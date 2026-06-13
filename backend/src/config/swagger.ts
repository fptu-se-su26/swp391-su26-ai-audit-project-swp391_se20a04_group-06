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
      description: "Tài liệu API chi tiết cho ứng dụng mua bán hải sản HảiSản.vn", // Đoạn mô tả giới thiệu chung về hệ thống
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
