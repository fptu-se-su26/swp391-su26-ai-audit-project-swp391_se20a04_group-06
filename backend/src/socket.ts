import "dotenv/config";
import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { Message } from "./models/Message";
import { Product } from "./models/Product";
import { redis } from "./config/redis";
import { logger } from "./utils/logger";

interface AuthPayload {
  userId: string;
  role: string;
}

let ioInstance: IOServer;

function getTokenFromCookie(headers: any): string | null {
  const cookieHeader = headers.cookie;
  if (!cookieHeader) return null;
  const parsed = cookie.parse(cookieHeader);
  return parsed.token || null;
}

export function initSocket(server: HttpServer) {
  const io = new IOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  try {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();

    pubClient.connect().catch(() => {});
    subClient.connect().catch(() => {});

    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis Adapter configured successfully");
  } catch (err: any) {
    logger.error(`Failed to configure Socket.IO Redis Adapter: ${err.message}`);
  }

  io.use((socket: Socket, next) => {
    const token = getTokenFromCookie(socket.handshake.headers);
    if (!token) {
      return next(
        new Error("Chưa đăng nhập (không tìm thấy token trong cookie)"),
      );
    }
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch (err) {
      return next(new Error("Token không hợp lệ hoặc đã hết hạn"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = (socket as any).user as AuthPayload;

    socket.on("join_room", async (data: any) => {
      let productId: string;
      let buyerId: string;
      if (typeof data === "string") {
        productId = data;
        buyerId = userId;
      } else {
        productId = data?.productId;
        buyerId = data?.buyerId;
      }

      if (!productId || !buyerId) return;
      try {
        const prod = await Product.findById(productId);
        if (!prod) return;
        const isSeller = prod.sellerId.toString() === userId;
        const isBuyer = buyerId === userId;

        if (isSeller || isBuyer) {
          socket.join(`product_${productId}_${buyerId}`);
          logger.info(`Socket User ${userId} joined room product_${productId}_${buyerId}`);
        }
      } catch (err: any) {
        logger.error(`Socket join_room error: ${err.message}`);
      }
    });

    socket.on("leave_room", (data: any) => {
      let productId: string;
      let buyerId: string;
      if (typeof data === "string") {
        productId = data;
        buyerId = userId;
      } else {
        productId = data?.productId;
        buyerId = data?.buyerId;
      }
      if (productId && buyerId) {
        socket.leave(`product_${productId}_${buyerId}`);
        logger.info(`Socket User ${userId} left room product_${productId}_${buyerId}`);
      }
    });

    socket.on(
      "send_message",
      async (data: {
        productId: string;
        receiverId: string;
        content?: string;
        imageUrl?: string;
        location?: {
          latitude: number;
          longitude: number;
          address?: string;
        };
      }) => {
        const { productId, receiverId, content, imageUrl, location } = data;
        if (!productId || !receiverId) return;

        if (!content?.trim() && !imageUrl && !location) return;

        if (receiverId === userId) {
          socket.emit("error", {
            message: "Không thể tự gửi tin nhắn cho chính mình",
          });
          return;
        }

        const rateLimitKey = `ratelimit:socket:msg:${userId}`;
        try {
          const pipe = redis.pipeline();
          pipe.incr(rateLimitKey);
          pipe.expire(rateLimitKey, 2);
          const results = await pipe.exec();

          const currentCount = (results?.[0]?.[1] as number) ?? 0;

          if (currentCount > 5) {
            socket.emit("error", {
              message:
                "Bạn gửi tin quá nhanh. Vui lòng làm chậm lại hành động của mình.",
            });
            return;
          }
        } catch (err: any) {
          logger.error(`Rate limiter Redis error: ${err.message}`);
        }

        try {
          const prod = await Product.findById(productId);
          if (!prod) {
            socket.emit("error", { message: "Sản phẩm không tồn tại" });
            return;
          }
          const isSeller = prod.sellerId.toString() === userId;
          const buyerId = isSeller ? receiverId : userId;

          const cleanContent = content
            ? content
                .trim()
                .replace(/<[^>]*>/g, "")
                .slice(0, 1000)
            : null;

          const newMsg = new Message({
            productId,
            senderId: userId,
            receiverId,
            content: cleanContent,
            imageUrl: imageUrl || null,
            location: location || null,
          });

          await newMsg.save();

          const messageResponse = {
            id: newMsg._id.toString(),
            productId,
            senderId: userId,
            receiverId,
            content: newMsg.content,
            imageUrl: newMsg.imageUrl,
            location: newMsg.location,
            sentAt: newMsg.createdAt,
            isRead: false,
          };

          const roomName = `product_${productId}_${buyerId}`;
          io.to(roomName).emit("new_message", messageResponse);

          let previewText = "Bạn có tin nhắn mới";
          if (imageUrl) {
            previewText = "📷 [Hình ảnh]";
          } else if (location) {
            previewText = "📍 [Vị trí]";
          } else if (content) {
            previewText = content.trim().slice(0, 40);
          }

          io.to(`user_${receiverId}`).emit("notification", {
            type: "new_message",
            productId,
            senderId: userId,
            preview: previewText,
          });
        } catch (err: any) {
          logger.error(`Socket send_message saving error: ${err.message}`);
          socket.emit("error", { message: "Gửi tin thất bại" });
        }
      },
    );
    /* ─── VIDEO CALL EVENTS (MỚI) ─── */

    // 1. Gửi yêu cầu gọi (Truyền kèm callerName sang cho Callee)
    socket.on(
      "call_user",
      (data: { to: string; offer: any; callerName?: string }) => {
        const { to, offer, callerName } = data;
        logger.info(
          `[Socket Call] User ${userId} (${callerName || "Không tên"}) is calling User ${to}`,
        );
        socket.to(`user_${to}`).emit("incoming_call", {
          from: userId,
          offer,
          callerName: callerName || "Một người dùng",
        });
      },
    );

    // 2. Chấp nhận cuộc gọi
    socket.on("answer_call", (data: { to: string; answer: any }) => {
      const { to, answer } = data;
      logger.info(`[Socket Call] User ${userId} accepted call from User ${to}`);
      socket.to(`user_${to}`).emit("call_accepted", {
        answer,
      });
    });

    // 3. Trao đổi cấu hình mạng ICE Candidates
    socket.on("ice_candidate", (data: { to: string; candidate: any }) => {
      const { to, candidate } = data;
      socket.to(`user_${to}`).emit("ice_candidate", {
        candidate,
      });
    });

    // 4. Kết thúc/Từ chối cuộc gọi
    socket.on("end_call", (data: { to: string }) => {
      const { to } = data;
      logger.info(
        `[Socket Call] Call ended between User ${userId} and User ${to}`,
      );
      socket.to(`user_${to}`).emit("call_ended");
    });

    socket.join(`user_${userId}`);
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  if (!ioInstance) throw new Error("Socket.io chưa được khởi tạo");
  return ioInstance;
}
