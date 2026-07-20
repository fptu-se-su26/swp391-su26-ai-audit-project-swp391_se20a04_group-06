import "dotenv/config";
import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { messageRepository } from "./repositories/message.repository";
import { productRepository } from "./repositories/product.repository";
import { userRepository } from "./repositories/user.repository";
import { redis } from "./config/redis";
import {
  isAllowedClientOrigin,
  rejectDisallowedOrigin,
} from "./config/cors";
import { logger } from "./utils/logger";
import { canSignalProductCall } from "./utils/callAuthorization";

interface AuthPayload {
  userId: string;
  role: string;
}

let ioInstance: IOServer;
let pubClientInstance: any;
let subClientInstance: any;

// Trích xuất JWT token từ cookie handshake
function getTokenFromCookie(headers: any): string | null {
  const cookieHeader = headers.cookie;
  if (!cookieHeader) return null;
  const parsed = cookie.parse(cookieHeader);
  return parsed.token || null;
}

// Khởi tạo máy chủ Socket.IO
export function initSocket(server: HttpServer) {
  const io = new IOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedClientOrigin(origin)) {
          callback(null, true);
        } else {
          callback(rejectDisallowedOrigin(origin));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  try {
    pubClientInstance = redis.duplicate();
    subClientInstance = redis.duplicate();

    pubClientInstance.connect().catch(() => {});
    subClientInstance.connect().catch(() => {});

    io.adapter(createAdapter(pubClientInstance, subClientInstance));
    logger.info("Socket.IO Redis Adapter configured successfully");
  } catch (err: any) {
    logger.error(`Failed to configure Socket.IO Redis Adapter: ${err.message}`);
  }

  // Middleware xác thực kết nối bằng JWT
  io.use(async (socket: Socket, next) => {
    let token = getTokenFromCookie(socket.handshake.headers);
    if (!token) {
      token = (socket.handshake.query?.token as string) || null;
    }

    if (!token) {
      return next(new Error("Chưa đăng nhập (không tìm thấy token)"));
    }
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as AuthPayload;

      const user = await userRepository.findRawById(payload.userId);
      if (!user || !user.isActive) {
        return next(new Error("Tài khoản của bạn đã bị khóa hoặc không tồn tại"));
      }

      (socket as any).user = payload;
      next();
    } catch (err) {
      return next(new Error("Token không hợp lệ hoặc đã hết hạn"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = (socket as any).user as AuthPayload;

    // Người dùng tham gia phòng chat của mẻ hải sản
    socket.on("join_room", async (data: any) => {
      let productId: string = data?.productId || (typeof data === "string" ? data : "");
      let buyerId: string = data?.buyerId || (typeof data === "string" ? userId : "");

      if (!productId || !buyerId) return;
      try {
        const prod = await productRepository.findById(productId);
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

    // Thoát khỏi phòng chat
    socket.on("leave_room", (data: any) => {
      let productId: string = data?.productId || (typeof data === "string" ? data : "");
      let buyerId: string = data?.buyerId || (typeof data === "string" ? userId : "");
      if (productId && buyerId) {
        socket.leave(`product_${productId}_${buyerId}`);
        logger.info(`Socket User ${userId} left room product_${productId}_${buyerId}`);
      }
    });

    // Nhắn tin realtime trong phòng chat
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
          socket.emit("error", { message: "Không thể tự gửi tin nhắn cho chính mình" });
          return;
        }

        if (content && content.length > 2000) {
          socket.emit("error", { message: "Tin nhắn không được vượt quá 2000 ký tự" });
          return;
        }

        try {
          const sender = await userRepository.findRawById(userId);
          if (!sender || !sender.isActive) {
            socket.emit("error", { message: "Tài khoản của bạn đã bị khóa." });
            socket.disconnect(true);
            return;
          }
        } catch (dbErr: any) {
          logger.error(`Socket state verification error: ${dbErr.message}`);
          socket.emit("error", { message: "Lỗi xác thực hệ thống" });
          return;
        }

        // Rate Limiter bằng Redis (tối đa 5 tin nhắn mỗi 2 giây)
        const rateLimitKey = `ratelimit:socket:msg:${userId}`;
        try {
          const pipe = redis.pipeline();
          pipe.incr(rateLimitKey);
          pipe.expire(rateLimitKey, 2, "NX");
          const results = await pipe.exec();

          const currentCount = results && results[0] && results[0][1] ? (results[0][1] as number) : 0;
          if (currentCount > 5) {
            socket.emit("error", { message: "Bạn gửi tin quá nhanh. Vui lòng gửi chậm lại." });
            return;
          }
        } catch (err: any) {
          logger.error(`Rate limiter Redis error: ${err.message}`);
        }

        try {
          const prod = await productRepository.findById(productId);
          if (!prod) {
            socket.emit("error", { message: "Sản phẩm không tồn tại" });
            return;
          }

          const receiver = await userRepository.findRawById(receiverId);
          if (!receiver || !receiver.isActive) {
            socket.emit("error", { message: "Người nhận không tồn tại hoặc tài khoản đã bị khóa." });
            return;
          }

          const isSeller = prod.sellerId.toString() === userId;
          const isReceiverSeller = prod.sellerId.toString() === receiverId;

          if (!isSeller && !isReceiverSeller) {
            socket.emit("error", { message: "Bạn không thể gửi tin nhắn cho sản phẩm không liên quan" });
            return;
          }

          const buyerId = isSeller ? receiverId : userId;
          const cleanContent = content ? content.trim().replace(/<[^>]*>/g, "").slice(0, 1000) : null;

          const newMsg = await messageRepository.create({
            productId,
            senderId: userId,
            receiverId,
            content: cleanContent,
            imageUrl: imageUrl || null,
            location: location || null,
          });

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

          // Gửi thông báo notification đẩy
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

    // WebRTC: Khởi tạo cuộc gọi
    socket.on(
      "call_user",
      async (data: {
        to: string;
        offer: any;
        callerName?: string;
        productId: string;
      }) => {
        const { to, offer, callerName, productId } = data;
        try {
          const product = productId ? await productRepository.findById(productId) : null;
          const sellerId = product?.sellerId?.toString();
          if (!product || !canSignalProductCall(sellerId, userId, to)) {
            socket.emit("error", { message: "Cuộc gọi phải thuộc cuộc trò chuyện sản phẩm hợp lệ." });
            return;
          }

          const recipient = await userRepository.findRawById(to);
          if (!recipient || !recipient.isActive) {
            socket.emit("error", { message: "Người nhận cuộc gọi không khả dụng." });
            return;
          }

          logger.info(`[Socket Call] User ${userId} calling User ${to}`);
          socket.to(`user_${to}`).emit("incoming_call", {
            from: userId,
            offer,
            callerName: callerName || "Người dùng",
            productId,
          });
        } catch (err) {
          socket.emit("error", { message: "Không thể khởi tạo cuộc gọi." });
        }
      },
    );

    // WebRTC: Trả lời cuộc gọi
    socket.on("answer_call", async (data: { to: string; answer: any; productId: string }) => {
      const { to, answer, productId } = data;
      const product = productId ? await productRepository.findById(productId).catch(() => null) : null;
      if (!product || !canSignalProductCall(product.sellerId?.toString(), userId, to)) {
        socket.emit("error", { message: "Tín hiệu cuộc gọi không hợp lệ." });
        return;
      }
      logger.info(`[Socket Call] User ${userId} accepted call from User ${to}`);
      socket.to(`user_${to}`).emit("call_accepted", { answer, productId });
    });

    // WebRTC: Từ chối cuộc gọi
    socket.on("reject_call", async (data: { to: string; productId: string }) => {
      const { to, productId } = data;
      const product = productId ? await productRepository.findById(productId).catch(() => null) : null;
      if (!product || !canSignalProductCall(product.sellerId?.toString(), userId, to)) return;
      logger.info(`[Socket Call] User ${userId} rejected call from User ${to}`);
      socket.to(`user_${to}`).emit("call_rejected", { productId });
    });

    // WebRTC: Trao đổi ICE Candidates
    socket.on("ice_candidate", async (data: { to: string; candidate: any; productId: string }) => {
      const { to, candidate, productId } = data;
      const product = productId ? await productRepository.findById(productId).catch(() => null) : null;
      if (!product || !canSignalProductCall(product.sellerId?.toString(), userId, to)) return;
      socket.to(`user_${to}`).emit("ice_candidate", { candidate, productId });
    });

    // WebRTC: Kết thúc cuộc gọi
    socket.on("end_call", async (data: { to: string; productId: string }) => {
      const { to, productId } = data;
      const product = productId ? await productRepository.findById(productId).catch(() => null) : null;
      if (!product || !canSignalProductCall(product.sellerId?.toString(), userId, to)) return;
      logger.info(`[Socket Call] Call ended between User ${userId} and User ${to}`);
      socket.to(`user_${to}`).emit("call_ended", { productId });
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

// Đóng an toàn các kết nối Redis khi tắt máy chủ
export async function closeSocketRedisClients() {
  try {
    const promises: Promise<void>[] = [];
    if (pubClientInstance) promises.push(pubClientInstance.quit().then(() => undefined));
    if (subClientInstance) promises.push(subClientInstance.quit().then(() => undefined));
    await Promise.all(promises);
    logger.info("Socket.IO Adapter Redis clients closed cleanly.");
  } catch (err: any) {
    logger.error(`Error closing Socket.IO Adapter Redis clients: ${err.message}`);
  }
}
