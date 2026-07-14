// Nạp các cấu hình biến môi trường từ file .env
import "dotenv/config";
// Import lớp Server từ thư viện http của Node.js để định kiểu cho máy chủ HTTP
import { Server as HttpServer } from "http";
// Import các đối tượng Server và Socket của socket.io để quản lý kết nối thời gian thực
import { Server as IOServer, Socket } from "socket.io";
// Import hàm createAdapter để tích hợp Redis adapter hỗ trợ mở rộng quy mô Socket.IO đa máy chủ
import { createAdapter } from "@socket.io/redis-adapter";
// Import thư viện jsonwebtoken để giải mã và xác thực mã JWT token của kết nối
import jwt from "jsonwebtoken";
// Import thư viện cookie để giải mã tiêu đề cookie lấy token
import cookie from "cookie";
// Import đối tượng messageRepository để lưu trữ tin nhắn chat vào database
import { messageRepository } from "./repositories/message.repository";
// Import đối tượng productRepository để kiểm tra thông tin mẻ hàng liên quan đến cuộc hội thoại
import { productRepository } from "./repositories/product.repository";
// Import đối tượng userRepository để lấy thông tin tài khoản người gửi/người nhận
import { userRepository } from "./repositories/user.repository";
// Import đối tượng kết nối redis dùng làm bộ nhớ đệm và khóa giới hạn tần suất
import { redis } from "./config/redis";
import {
  isAllowedClientOrigin,
  rejectDisallowedOrigin,
} from "./config/cors";
// Import logger phục vụ ghi log hệ thống
import { logger } from "./utils/logger";

// Định nghĩa giao diện AuthPayload đại diện cho thông tin tài khoản giải mã từ JWT token
interface AuthPayload {
  // ID người dùng dạng chuỗi
  userId: string;
  // Vai trò của tài khoản (User hoặc Admin)
  role: string;
}

// Khai báo thực thể IOServer của socket.io
let ioInstance: IOServer;
// Khai báo kết nối Redis dùng để phát bản tin (Publish) của adapter
let pubClientInstance: any;
// Khai báo kết nối Redis dùng để đăng ký nhận bản tin (Subscribe) của adapter
let subClientInstance: any;

// Hàm hỗ trợ trích xuất JWT token từ tiêu đề cookie của yêu cầu handshake
function getTokenFromCookie(headers: any): string | null {
  // Lấy giá trị tiêu đề cookie
  const cookieHeader = headers.cookie;
  // Trả về null nếu không tồn tại tiêu đề cookie
  if (!cookieHeader) return null;
  // Sử dụng thư viện cookie để giải mã chuỗi cookieHeader thành đối tượng Javascript
  const parsed = cookie.parse(cookieHeader);
  // Trả về giá trị của cookie có tên 'token' hoặc null nếu không tồn tại
  return parsed.token || null;
}

// Định nghĩa và xuất hàm initSocket khởi tạo dịch vụ Socket.IO thời gian thực
export function initSocket(server: HttpServer) {
  // Khởi tạo máy chủ Socket.IO gắn vào HTTP server hiện hành kèm theo cấu hình CORS
  const io = new IOServer(server, {
    cors: {
      // Chấp nhận kết nối từ Vite (5173) và backend truy cập trực tiếp (3000)
      origin: (origin, callback) => {
        if (isAllowedClientOrigin(origin)) {
          callback(null, true);
        } else {
          callback(rejectDisallowedOrigin(origin));
        }
      },
      // Chỉ cho phép các phương thức GET và POST
      methods: ["GET", "POST"],
      // Cho phép truyền kèm cookie/credentials
      credentials: true,
    },
  });

  try {
    // Nhân bản kết nối Redis hiện hành để phục vụ kênh pub (Publish)
    pubClientInstance = redis.duplicate();
    // Nhân bản kết nối Redis hiện hành để phục vụ kênh sub (Subscribe)
    subClientInstance = redis.duplicate();

    // Thực hiện kết nối bất đồng bộ cho client publish
    pubClientInstance.connect().catch(() => {});
    // Thực hiện kết nối bất đồng bộ cho client subscribe
    subClientInstance.connect().catch(() => {});

    // Đăng ký adapter Redis cho Socket.IO giúp đồng bộ các bản tin realtime khi scale ứng dụng
    io.adapter(createAdapter(pubClientInstance, subClientInstance));
    // Ghi log cấu hình adapter thành công
    logger.info("Socket.IO Redis Adapter configured successfully");
  } catch (err: any) {
    // Ghi nhận log lỗi nếu thiết lập adapter thất bại
    logger.error(`Failed to configure Socket.IO Redis Adapter: ${err.message}`);
  }

  // Sử dụng middleware cho Socket.IO để xác thực danh tính người dùng trước khi chấp nhận kết nối
  io.use(async (socket: Socket, next) => {
    // Thử trích xuất token từ cookies của yêu cầu kết nối
    let token = getTokenFromCookie(socket.handshake.headers);
    // Nếu không tìm thấy token trong cookies
    if (!token) {
      // Thử lấy token từ tham số query trên URL (dành cho môi trường kiểm thử hoặc thiết bị không dùng cookie)
      token = (socket.handshake.query?.token as string) || null;
    }

    // Nếu hoàn toàn không có token nào khả dụng
    if (!token) {
      // Bác bỏ kết nối thời gian thực và trả lỗi chưa đăng nhập
      return next(
        new Error(
          "Chưa đăng nhập (không tìm thấy token trong cookie hoặc query)",
        ),
      );
    }
    try {
      // Xác thực token JWT sử dụng khóa bí mật JWT_SECRET
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as AuthPayload;

      // Truy vấn thông tin người dùng từ cơ sở dữ liệu để kiểm tra trạng thái tài khoản
      const user = await userRepository.findRawById(payload.userId);
      // Nếu tài khoản không tồn tại hoặc đã bị quản trị viên khóa hoạt động
      if (!user || !user.isActive) {
        // Từ chối kết nối Socket và thông báo lỗi tài khoản bị khóa
        return next(
          new Error("Tài khoản của bạn đã bị khóa hoặc không tồn tại"),
        );
      }

      // Gán thông tin tài khoản giải mã được vào đối tượng socket để sử dụng ở các luồng sau
      (socket as any).user = payload;
      // Cho phép tiếp tục tiến trình kết nối Socket.IO
      next();
    } catch (err) {
      // Bác bỏ kết nối nếu token bị lỗi cú pháp hoặc đã hết hạn sử dụng
      return next(new Error("Token không hợp lệ hoặc đã hết hạn"));
    }
  });

  // Lắng nghe sự kiện "connection" khi một kết nối client được chấp nhận thành công
  io.on("connection", (socket: Socket) => {
    // Trích xuất ID người dùng từ thông tin tài khoản đã được gán vào socket trước đó
    const { userId } = (socket as any).user as AuthPayload;

    // Lắng nghe sự kiện "join_room" khi client muốn tham gia phòng chat của một mẻ hàng cụ thể
    socket.on("join_room", async (data: any) => {
      // Trích xuất ID sản phẩm từ tham số truyền lên hoặc từ dữ liệu gửi thô dạng chuỗi
      let productId: string =
        data?.productId || (typeof data === "string" ? data : "");
      // Trích xuất ID người mua hoặc mặc định là ID người dùng hiện tại
      let buyerId: string =
        data?.buyerId || (typeof data === "string" ? userId : "");

      // Nếu thiếu một trong hai ID quan trọng, dừng xử lý
      if (!productId || !buyerId) return;
      try {
        // Tìm kiếm thông tin sản phẩm mẻ hàng từ database
        const prod = await productRepository.findById(productId);
        // Nếu sản phẩm không tồn tại, kết thúc
        if (!prod) return;
        // Kiểm tra xem người dùng hiện tại có phải là người bán mẻ hàng này hay không
        const isSeller = prod.sellerId.toString() === userId;
        // Kiểm tra xem người dùng hiện tại có phải là người mua đang muốn liên hệ hay không
        const isBuyer = buyerId === userId;

        // Chỉ cho phép người bán hoặc chính người mua của mẻ hàng tham gia vào phòng chat riêng này
        if (isSeller || isBuyer) {
          // Thực thi lệnh cho socket gia nhập vào phòng chat định danh riêng theo sản phẩm và người mua
          socket.join(`product_${productId}_${buyerId}`);
          // Ghi log sự kiện gia nhập phòng chat thành công
          logger.info(
            `Socket User ${userId} joined room product_${productId}_${buyerId}`,
          );
        }
      } catch (err: any) {
        // Ghi log lỗi nếu quá trình gia nhập phòng chat gặp sự cố database
        logger.error(`Socket join_room error: ${err.message}`);
      }
    });

    // Lắng nghe sự kiện "leave_room" khi client muốn thoát khỏi phòng chat mẻ hàng
    socket.on("leave_room", (data: any) => {
      // Trích xuất ID sản phẩm
      let productId: string =
        data?.productId || (typeof data === "string" ? data : "");
      // Trích xuất ID người mua
      let buyerId: string =
        data?.buyerId || (typeof data === "string" ? userId : "");
      // Nếu có đầy đủ cả hai giá trị
      if (productId && buyerId) {
        // Rời khỏi phòng chat
        socket.leave(`product_${productId}_${buyerId}`);
        // Ghi log sự kiện thoát phòng chat thành công
        logger.info(
          `Socket User ${userId} left room product_${productId}_${buyerId}`,
        );
      }
    });

    // Lắng nghe sự kiện "send_message" gửi tin nhắn thời gian thực trong phòng chat mẻ hàng
    socket.on(
      "send_message",
      async (data: {
        // ID sản phẩm mẻ hàng liên quan
        productId: string;
        // ID tài khoản người nhận tin nhắn
        receiverId: string;
        // Nội dung tin nhắn văn bản tùy chọn
        content?: string;
        // Đường dẫn hình ảnh đính kèm tùy chọn
        imageUrl?: string;
        // Chia sẻ vị trí GPS tùy chọn
        location?: {
          latitude: number;
          longitude: number;
          address?: string;
        };
      }) => {
        // Giải nén các thuộc tính từ dữ liệu gửi lên
        const { productId, receiverId, content, imageUrl, location } = data;
        // Dừng xử lý nếu thiếu thông tin ID sản phẩm hoặc ID người nhận
        if (!productId || !receiverId) return;

        // Dừng xử lý nếu tin nhắn hoàn toàn trống rỗng không chứa văn bản, ảnh hay vị trí chia sẻ
        if (!content?.trim() && !imageUrl && !location) return;

        // Ràng buộc bảo mật: Không cho phép tự gửi tin nhắn cho chính mình
        if (receiverId === userId) {
          // Phát sự kiện lỗi về lại cho chính client gửi
          socket.emit("error", {
            message: "Không thể tự gửi tin nhắn cho chính mình",
          });
          return;
        }

        try {
          // Truy vấn kiểm tra lại trạng thái tài khoản người gửi tin trong database
          const sender = await userRepository.findRawById(userId);
          // Nếu tài khoản người gửi không tồn tại hoặc đã bị khóa
          if (!sender || !sender.isActive) {
            // Phát lỗi về client
            socket.emit("error", {
              message: "Tài khoản của bạn đã bị khóa hoặc không hoạt động.",
            });
            // Ngắt kết nối socket của client này ngay lập tức
            socket.disconnect(true);
            return;
          }
        } catch (dbErr: any) {
          // Ghi nhận log lỗi hệ thống truy vấn và báo lỗi về client
          logger.error(`Socket state verification error: ${dbErr.message}`);
          socket.emit("error", { message: "Lỗi xác thực hệ thống" });
          return;
        }

        // Tạo khóa Redis để thiết lập bộ giới hạn tần suất gửi tin nhắn trên Socket (Rate Limiting)
        const rateLimitKey = `ratelimit:socket:msg:${userId}`;
        try {
          // Khởi tạo pipeline của Redis để chạy các lệnh đồng thời tối ưu hiệu năng mạng
          const pipe = redis.pipeline();
          // Tăng biến đếm số lượng tin nhắn đã gửi của người dùng lên 1
          pipe.incr(rateLimitKey);
          // Cài đặt thời gian hết hạn cho khóa đếm là 2 giây (chỉ thực hiện khi khóa mới được tạo NX)
          pipe.expire(rateLimitKey, 2, "NX");
          // Thực thi pipeline
          const results = await pipe.exec();

          // Lấy giá trị đếm hiện tại từ kết quả trả về của lệnh thứ nhất (incr)
          const currentCount =
            results && results[0] && results[0][1]
              ? (results[0][1] as number)
              : 0;

          // Nếu gửi quá 5 tin nhắn trong vòng 2 giây
          if (currentCount > 5) {
            // Phát lỗi cảnh báo gửi tin quá nhanh về client gửi
            socket.emit("error", {
              message:
                "Bạn gửi tin quá nhanh. Vui lòng làm chậm lại hành động của mình.",
            });
            return;
          }
        } catch (err: any) {
          // Ghi nhận log lỗi nếu kết nối Redis bị gián đoạn nhưng vẫn cho phép tiếp tục luồng gửi tin
          logger.error(`Rate limiter Redis error: ${err.message}`);
        }

        try {
          // Tìm kiếm thông tin sản phẩm mẻ hàng trong database
          const prod = await productRepository.findById(productId);
          // Nếu sản phẩm không tồn tại, báo lỗi về client và kết thúc
          if (!prod) {
            socket.emit("error", { message: "Sản phẩm không tồn tại" });
            return;
          }

          // Kiểm tra xem người dùng gửi tin nhắn hiện tại có phải là người bán mẻ hàng này không
          const isSeller = prod.sellerId.toString() === userId;
          // Kiểm tra xem người nhận tin nhắn có phải là người bán mẻ hàng không
          const isReceiverSeller = prod.sellerId.toString() === receiverId;

          // Ràng buộc bảo mật: Chỉ cho phép cuộc trò chuyện diễn ra giữa người bán và người mua thực sự quan tâm đến sản phẩm mẻ hàng này
          if (!isSeller && !isReceiverSeller) {
            socket.emit("error", {
              message:
                "Bạn không thể gửi tin nhắn cho sản phẩm không liên quan",
            });
            return;
          }

          // Xác định ID người mua: nếu người gửi hiện tại là người bán thì người mua là người nhận, ngược lại người mua là người gửi hiện tại
          const buyerId = isSeller ? receiverId : userId;

          // Làm sạch nội dung tin nhắn tránh mã độc XSS và cắt chuỗi lấy tối đa 1000 ký tự đầu tiên
          const cleanContent = content
            ? content
                .trim()
                .replace(/<[^>]*>/g, "")
                .slice(0, 1000)
            : null;

          // Thực hiện lưu trữ tài liệu tin nhắn mới vào cơ sở dữ liệu qua repository
          const newMsg = await messageRepository.create({
            productId,
            senderId: userId,
            receiverId,
            content: cleanContent,
            imageUrl: imageUrl || null,
            location: location || null,
          });

          // Chuẩn hóa cấu trúc dữ liệu phản hồi tin nhắn mới gửi
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

          // Định danh tên phòng chat tương ứng
          const roomName = `product_${productId}_${buyerId}`;
          // Phát sự kiện "new_message" kèm dữ liệu tin nhắn tới tất cả các client đang kết nối trong phòng chat này
          io.to(roomName).emit("new_message", messageResponse);

          // Xây dựng chuỗi văn bản xem trước (preview) hiển thị trong thông báo notification
          let previewText = "Bạn có tin nhắn mới";
          // Nếu tin nhắn đính kèm hình ảnh
          if (imageUrl) {
            previewText = "📷 [Hình ảnh]";
          // Nếu tin nhắn chia sẻ tọa độ GPS
          } else if (location) {
            previewText = "📍 [Vị trí]";
          // Nếu tin nhắn dạng văn bản thông thường
          } else if (content) {
            // Cắt lấy tối đa 40 ký tự đầu hiển thị xem trước
            previewText = content.trim().slice(0, 40);
          }

          // Phát sự kiện thông báo thời gian thực "notification" tới phòng cá nhân của người nhận `user_${receiverId}`
          io.to(`user_${receiverId}`).emit("notification", {
            type: "new_message",
            productId,
            senderId: userId,
            preview: previewText,
          });
        } catch (err: any) {
          // Ghi nhận log lỗi và thông báo thất bại về client
          logger.error(`Socket send_message saving error: ${err.message}`);
          socket.emit("error", { message: "Gửi tin thất bại" });
        }
      },
    );

    // Cho phép socket tự gia nhập vào phòng định danh cá nhân của chính mình để nhận các thông báo riêng tư từ hệ thống
    socket.join(`user_${userId}`);
  });

  // Gán đối tượng máy chủ Socket.IO vừa khởi tạo vào biến ioInstance phục vụ tra cứu
  ioInstance = io;
  // Trả về đối tượng máy chủ Socket.IO
  return io;
}

// Định nghĩa và xuất hàm getIO để lấy thực thể ioInstance đang chạy từ các module nghiệp vụ khác
export function getIO() {
  // Ném lỗi nếu hàm được gọi trước khi máy chủ khởi tạo Socket.IO thành công
  if (!ioInstance) throw new Error("Socket.io chưa được khởi tạo");
  // Trả về thực thể ioInstance
  return ioInstance;
}

// Định nghĩa và xuất hàm closeSocketRedisClients để đóng an toàn các kết nối Redis trùng lặp sử dụng cho adapter khi shutdown server
export async function closeSocketRedisClients() {
  try {
    // Khởi tạo mảng các Promise xử lý đóng kết nối
    const promises: Promise<void>[] = [];
    // Nếu kết nối pubClientInstance đang tồn tại
    if (pubClientInstance)
      // Thêm tác vụ đóng kết nối pub và chuyển đổi giá trị trả về thành undefined
      promises.push(pubClientInstance.quit().then(() => undefined));
    // Nếu kết nối subClientInstance đang tồn tại
    if (subClientInstance)
      // Thêm tác vụ đóng kết nối sub và chuyển đổi giá trị trả về thành undefined
      promises.push(subClientInstance.quit().then(() => undefined));
    // Chờ tất cả các kết nối Redis adapter đóng hoàn tất
    await Promise.all(promises);
    // Ghi log đóng kết nối thành công sạch sẽ
    logger.info("✅ Socket.IO Adapter Redis clients closed cleanly.");
  } catch (err: any) {
    // Ghi log lỗi nếu quá trình đóng kết nối gặp sự cố
    logger.error(
      `Error closing Socket.IO Adapter Redis clients: ${err.message}`,
    );
  }
}
