// Import thư viện swagger-jsdoc để tự động biên dịch các ghi chú mã nguồn (JSDoc) thành tài liệu chuẩn OpenAPI
import swaggerJSDoc from "swagger-jsdoc";
// Import thư viện swagger-ui-express để cung cấp giao diện hiển thị tài liệu API tương tác trên trình duyệt
import swaggerUi from "swagger-ui-express";
// Import kiểu đối tượng Express của ExpressJS
import { Express } from "express";

// Cấu hình các thông số đặc tả cho tài liệu API theo chuẩn OpenAPI 3.0
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0", // Khai báo sử dụng phiên bản chuẩn OpenAPI 3.0.0
    info: {
      title: "HảiSản.vn API Documentation", // Tên tiêu đề của trang tài liệu API
      version: "1.0.0", // Phiên bản hiện tại của bộ API
      description: "Tài liệu API chi tiết cho ứng dụng mua bán hải sản HảiSản.vn\n\n" +
                   "⚠️ **LƯU Ý BẢO MẬT & TÍCH HỢP CHO FRONTEND DEVELOPER:**\n" +
                   "1. **Bảo vệ CSRF**: Mọi API ghi dữ liệu (POST, PUT, DELETE, PATCH) ngoại trừ các API công khai đều yêu cầu đính kèm CSRF Token. Lập trình viên Frontend phải đọc token từ cookie `XSRF-TOKEN` của trình duyệt và gửi kèm trong request header dưới dạng `x-csrf-token: <value>`.\n" +
                   "2. **Xác thực Cookie**: Sử dụng HttpOnly JWT Cookie xác thực, hãy nhấn nút 'Authorize' (cấu hình `cookieAuth`) và đăng nhập thành công trước để thực hiện test các API cần quyền truy cập.\n" +
                   "3. **Tài liệu Realtime (Socket.IO & WebRTC)**: Các kênh sự kiện thời gian thực không thể chạy thử trực tiếp trên Swagger. Hãy tham chiếu tệp tài liệu hướng dẫn tích hợp realtime chuyên biệt tại [08_socket_io_realtime_guide.md](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/08_socket_io_realtime_guide.md) trong mã nguồn dự án.",
    },
    servers: [
      {
        url: "http://localhost:5000", // Đường dẫn chạy API Server ở môi trường máy cá nhân (Local Dev)
        description: "Local Development Server", // Mô tả máy chủ local
      },
    ],
    components: {
      // Cấu hình các cơ chế bảo mật xác thực dùng cho API
      securitySchemes: {
        // Cấu hình cơ chế xác thực JWT qua Cookie để lập trình viên có thể test API trực tiếp trên giao diện Swagger UI
        cookieAuth: {
          type: "apiKey", // Kiểu xác thực là truyền key
          in: "cookie", // Chỉ định khóa nằm ở trong Cookie
          name: "token", // Tên cookie lưu Access Token đăng nhập
          description: "JWT Access Token được lưu trong HTTP-Only Cookie", // Giải thích cơ chế bảo mật cookie
        },
      },
      // Định nghĩa các schemas dùng chung cho lập trình viên Frontend tiện đối chiếu và làm việc
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Mô tả chi tiết lỗi xảy ra"
            }
          }
        },
        UserPublicProfile: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e1234568" },
            name: { type: "string", example: "Nguyễn Văn A" },
            email: { type: "string", format: "email", example: "anguyen@gmail.com" },
            role: { type: "string", enum: ["User", "Admin"], example: "User" },
            avatarUrl: { type: "string", nullable: true, example: "https://cloudinary.com/avatar.jpg" },
            isVerified: { type: "boolean", example: true },
            rating: { type: "number", example: 4.8 }
          }
        },
        ProductResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e1234567" },
            name: { type: "string", example: "Cua biển Cà Mau" },
            price: { type: "number", example: 350000 },
            category: { type: "string", example: "Cua, Ghẹ" },
            unit: { type: "string", example: "kg" },
            location: {
              type: "object",
              properties: {
                type: { type: "string", example: "Point" },
                coordinates: { type: "array", items: { type: "number" }, example: [106.660172, 10.762622] }
              }
            },
            images: { type: "array", items: { type: "string" }, example: ["https://cloudinary.com/cua1.jpg"] },
            sellerId: { type: "string", example: "64df56e9c40212f8e1234568" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        MessageResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e1234599" },
            productId: { type: "string", example: "64df56e9c40212f8e1234567" },
            senderId: { type: "string", example: "64df56e9c40212f8e1234568" },
            receiverId: { type: "string", example: "64df56e9c40212f8e1234567" },
            content: { type: "string", nullable: true, example: "Xin chào shop!" },
            imageUrl: { type: "string", nullable: true, example: "https://cloudinary.com/chat1.jpg" },
            isRead: { type: "boolean", example: false },
            isRecalled: { type: "boolean", example: false },
            reaction: { type: "string", nullable: true, example: "heart" },
            sentAt: { type: "string", format: "date-time" }
          }
        },
        PostResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e12345aa" },
            title: { type: "string", example: "Kinh nghiệm chọn mua mực tươi ngon" },
            content: { type: "string", example: "Mực tươi cần có mắt trong, da không bị trầy..." },
            images: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" }, example: ["Kinh nghiệm", "Mực"] },
            authorId: { type: "string", example: "64df56e9c40212f8e1234568" },
            likesCount: { type: "integer", example: 12 },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        CommentResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e12345bb" },
            text: { type: "string", example: "Cảm ơn tác giả đã chia sẻ!" },
            authorId: { type: "string", example: "64df56e9c40212f8e1234567" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        RecipeResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "64df56e9c40212f8e12345cc" },
            title: { type: "string", example: "Lẩu thái hải sản chua cay" },
            description: { type: "string", example: "Công thức chế biến đơn giản chuẩn vị" },
            ingredients: { type: "array", items: { type: "string" } },
            instructions: { type: "array", items: { type: "string" } },
            imageUrl: { type: "string", nullable: true },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"], example: "Medium" },
            cookingTime: { type: "number", example: 30 },
            servings: { type: "number", example: 4 },
            likesCount: { type: "integer", example: 25 },
            authorId: { type: "string", example: "64df56e9c40212f8e1234568" }
          }
        }
      }
    },
  },
  // Khai báo danh sách các đường dẫn chứa tệp tin định nghĩa API cần quét để sinh tài liệu
  apis: [
    "./src/routes/*.ts", // Quét các file định tuyến TypeScript khi chạy trên môi trường phát triển (Dev)
    "./dist/routes/*.js", // Quét các file định tuyến Javascript đã biên dịch khi chạy trên môi trường Production
    "./backend/src/routes/*.ts", // Quét đường dẫn tương đối dự phòng cho cấu trúc Monorepo/Workspace
  ],
};

// Tiến hành sinh đối tượng dữ liệu tài liệu API hoàn chỉnh từ cấu hình phía trên
const swaggerSpec = swaggerJSDoc(options);

// Hàm tiện ích thiết lập endpoint hiển thị giao diện tài liệu cho ứng dụng Express
export function setupSwagger(app: Express) {
  // Đăng ký đường dẫn "/api-docs" làm trang giao diện tài liệu Swagger UI để nhà phát triển xem từ trình duyệt
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
// Xuất (export) đối tượng đặc tả JSON ra ngoài phòng khi cần dùng ở các module/test suite khác
export { swaggerSpec };
