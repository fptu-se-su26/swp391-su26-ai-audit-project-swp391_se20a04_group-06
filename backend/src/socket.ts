import "dotenv/config";
import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { pool } from "./db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface AuthPayload {
  userId: number;
  role: string;
}

let ioInstance: IOServer;

/**
 * Lấy JWT token từ cookie trong handshake headers
 */
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
      credentials: true, // cho phép gửi cookie
    },
  });

  /* ── Xác thực JWT từ Cookie ── */
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
    console.log(`🔌 Socket connected: userId=${userId}`);

    /* Buyer / Seller tham gia room của product để nhận tin real-time */
    socket.on("join_room", async (productId: number) => {
      if (!productId) return;
      try {
        // Kiểm tra xem user có phải người bán không
        const [prodRows] = await pool.query<RowDataPacket[]>(
          "SELECT SellerID FROM Product WHERE ProductID = ?",
          [productId],
        );
        const isSeller = prodRows[0] && prodRows[0].SellerID === userId;

        // Kiểm tra xem user đã có tin nhắn nào về sản phẩm này chưa
        const [msgRows] = await pool.query<RowDataPacket[]>(
          "SELECT 1 FROM Message WHERE ProductID = ? AND (SenderID = ? OR ReceiverID = ?) LIMIT 1",
          [productId, userId, userId],
        );
        const hasMessages = msgRows.length > 0;

        if (isSeller || hasMessages) {
          socket.join(`product_${productId}`);
        }
      } catch (err) {
        console.error("Socket join_room error:", err);
      }
    });

    socket.on("leave_room", (productId: number) => {
      socket.leave(`product_${productId}`);
    });

    /* ── Gửi tin nhắn ── */
    socket.on(
      "send_message",
      async (data: {
        productId: number;
        receiverId: number;
        content: string;
      }) => {
        const { productId, receiverId, content } = data;
        if (!productId || !receiverId || !content?.trim()) return;

        if (receiverId === userId) {
          socket.emit("error", {
            message: "Không thể tự gửi tin nhắn cho chính mình",
          });
          return;
        }

        try {
          const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES (?, ?, ?, ?)",
            [productId, userId, receiverId, content.trim()],
          );

          const message = {
            id: result.insertId,
            productId,
            senderId: userId,
            receiverId,
            content: content.trim(),
            sentAt: new Date().toISOString(),
            isRead: false,
          };

          /* Phát tin nhắn riêng biệt đến sender và receiver */
          io.to(`user_${userId}`).emit("new_message", message);
          io.to(`user_${receiverId}`).emit("new_message", message);

          /* Phát notification riêng đến receiver (nếu không trong room) */
          io.to(`user_${receiverId}`).emit("notification", {
            type: "new_message",
            productId,
            senderId: userId,
            preview: content.trim().slice(0, 40),
          });
        } catch (err) {
          console.error("Socket send_message error:", err);
          socket.emit("error", { message: "Gửi tin thất bại" });
        }
      },
    );

    /* User join room cá nhân để nhận notification */
    socket.join(`user_${userId}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: userId=${userId}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  if (!ioInstance) throw new Error("Socket.io chưa được khởi tạo");
  return ioInstance;
}
