"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
exports.setupSwagger = setupSwagger;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Cấu hình thông số Swagger (OpenAPI 3.0)
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "HảiSản.vn API Documentation",
            version: "1.0.0",
            description: "Tài liệu API chi tiết cho ứng dụng mua bán hải sản HảiSản.vn\n\n" +
                "⚠️ LƯU Ý BẢO MẬT & TÍCH HỢP CHO FRONTEND:\n" +
                "1. Bảo vệ CSRF: Gửi kèm CSRF Token trong header x-csrf-token (đọc từ cookie XSRF-TOKEN).\n" +
                "2. Xác thực Cookie: Sử dụng HttpOnly JWT Cookie, hãy nhấn 'Authorize' (cookieAuth) và đăng nhập trước để test các API yêu cầu xác thực.\n" +
                "3. Tài liệu Realtime (Socket.IO & WebRTC): Không thể chạy thử trực tiếp trên Swagger. Tham chiếu tài liệu tại docs/08_socket_io_realtime_guide.md.",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local Development Server",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description: "JWT Access Token được lưu trong HTTP-Only Cookie",
                },
            },
            schemas: {
                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Mô tả chi tiết lỗi xảy ra",
                        },
                    },
                },
                UserPublicProfile: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e1234568" },
                        name: { type: "string", example: "Nguyễn Văn A" },
                        email: {
                            type: "string",
                            format: "email",
                            example: "anguyen@gmail.com",
                        },
                        role: { type: "string", enum: ["User", "Admin"], example: "User" },
                        avatarUrl: {
                            type: "string",
                            nullable: true,
                            example: "https://cloudinary.com/avatar.jpg",
                        },
                        isVerified: { type: "boolean", example: true },
                        rating: { type: "number", example: 4.8 },
                    },
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
                                coordinates: {
                                    type: "array",
                                    items: { type: "number" },
                                    example: [106.660172, 10.762622], // [kinh độ, vĩ độ]
                                },
                            },
                        },
                        images: {
                            type: "array",
                            items: { type: "string" },
                            example: ["https://cloudinary.com/cua1.jpg"],
                        },
                        sellerId: { type: "string", example: "64df56e9c40212f8e1234568" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                MessageResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e1234599" },
                        productId: { type: "string", example: "64df56e9c40212f8e1234567" },
                        senderId: { type: "string", example: "64df56e9c40212f8e1234568" },
                        receiverId: { type: "string", example: "64df56e9c40212f8e1234567" },
                        content: {
                            type: "string",
                            nullable: true,
                            example: "Xin chào shop!",
                        },
                        imageUrl: {
                            type: "string",
                            nullable: true,
                            example: "https://cloudinary.com/chat1.jpg",
                        },
                        isRead: { type: "boolean", example: false },
                        isRecalled: { type: "boolean", example: false },
                        reaction: { type: "string", nullable: true, example: "heart" },
                        sentAt: { type: "string", format: "date-time" },
                    },
                },
                PostResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e12345aa" },
                        title: {
                            type: "string",
                            example: "Kinh nghiệm chọn mua mực tươi ngon",
                        },
                        content: {
                            type: "string",
                            example: "Mực tươi cần có mắt trong, da không bị trầy...",
                        },
                        images: { type: "array", items: { type: "string" } },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            example: ["Kinh nghiệm", "Mực"],
                        },
                        authorId: { type: "string", example: "64df56e9c40212f8e1234568" },
                        likesCount: { type: "integer", example: 12 },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                CommentResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e12345bb" },
                        text: { type: "string", example: "Cảm ơn tác giả đã chia sẻ!" },
                        authorId: { type: "string", example: "64df56e9c40212f8e1234567" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                RecipeResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e12345cc" },
                        title: { type: "string", example: "Lẩu thái hải sản chua cay" },
                        description: {
                            type: "string",
                            example: "Công thức chế biến đơn giản chuẩn vị",
                        },
                        ingredients: { type: "array", items: { type: "string" } },
                        instructions: { type: "array", items: { type: "string" } },
                        imageUrl: { type: "string", nullable: true },
                        difficulty: {
                            type: "string",
                            enum: ["Easy", "Medium", "Hard"],
                            example: "Medium",
                        },
                        cookingTime: { type: "number", example: 30 },
                        servings: { type: "number", example: 4 },
                        likesCount: { type: "integer", example: 25 },
                        authorId: { type: "string", example: "64df56e9c40212f8e1234568" },
                    },
                },
            },
        },
    },
    apis: [
        "./src/routes/*.ts", // Dev: Quét tệp TS
        "./dist/routes/*.js", // Prod: Quét tệp JS đã build
        "./backend/src/routes/*.ts", // Monorepo
    ],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;
// Đăng ký Swagger UI Middleware
function setupSwagger(app) {
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
}
