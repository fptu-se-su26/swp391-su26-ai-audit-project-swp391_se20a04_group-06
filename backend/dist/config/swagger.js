"use strict";
// ============================================================
// FILE: swagger.ts
// MỤC ĐÍCH: Cấu hình và khởi tạo tài liệu API tự động (Swagger/OpenAPI)
// cho ứng dụng mua bán hải sản HảiSản.vn
//
// 💡 SWAGGER LÀ GÌ?
//    Swagger (hay còn gọi là OpenAPI) là bộ công cụ giúp bạn:
//    - Tự động tạo ra trang web mô tả toàn bộ các API của dự án
//    - Cho phép lập trình viên Frontend "thử" gọi API ngay trên trình duyệt
//    - Không cần dùng Postman hay công cụ ngoài nào khác
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
exports.setupSwagger = setupSwagger;
// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT THƯ VIỆN
// ─────────────────────────────────────────────────────────────
/**
 * Import thư viện `swagger-jsdoc`
 *
 * Thư viện này có nhiệm vụ:
 * → Quét qua các file .ts / .js chứa code định tuyến (route)
 * → Đọc các comment đặc biệt theo chuẩn JSDoc (bắt đầu bằng /** và có @swagger bên trong)
 * → Tổng hợp tất cả thành 1 file tài liệu API dạng JSON theo chuẩn OpenAPI 3.0
 *
 * Ví dụ comment JSDoc trong route file:
 *
 *   /**
 *    * @swagger
 *    * /api/products:
 *    *   get:
 *    *     summary: Lấy danh sách sản phẩm
 *    * /
 */
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
/**
 * Import thư viện `swagger-ui-express`
 *
 * Thư viện này có nhiệm vụ:
 * → Nhận vào tài liệu JSON do swagger-jsdoc tạo ra
 * → Render thành giao diện web đẹp, tương tác được (dạng HTML/CSS/JS)
 * → Gắn giao diện đó vào một đường dẫn cụ thể trong ứng dụng Express
 *    (thường là http://localhost:5000/api-docs)
 *
 * Người dùng chỉ cần mở trình duyệt lên là thấy toàn bộ tài liệu API
 */
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// ─────────────────────────────────────────────────────────────
// PHẦN 2: CẤU HÌNH THÔNG SỐ SWAGGER (OPTIONS)
// ─────────────────────────────────────────────────────────────
/**
 * Biến `options` chứa toàn bộ cấu hình để swagger-jsdoc biết:
 * - Tài liệu API này dùng chuẩn nào? (OpenAPI 3.0)
 * - Tiêu đề, phiên bản, mô tả là gì?
 * - Server nào đang chạy?
 * - Bảo mật được thiết lập như thế nào?
 * - Các "khuôn mẫu dữ liệu" (schema) dùng chung là gì?
 * - Quét tài liệu từ những file nào?
 *
 * Kiểu dữ liệu: `swaggerJSDoc.Options` — được TypeScript kiểm tra
 * để đảm bảo bạn không điền sai trường nào
 */
const options = {
    // ── MỤC definition: Thông tin tổng quan của tài liệu API ──
    definition: {
        /**
         * openapi: "3.0.0"
         *
         * Khai báo bạn đang dùng chuẩn OpenAPI phiên bản 3.0.0
         * Đây là chuẩn quốc tế mô tả API, được hầu hết công cụ hỗ trợ
         *
         * 💡 Tại sao phải khai báo? Vì có nhiều phiên bản khác nhau
         *    (2.0 gọi là Swagger, 3.0 gọi là OpenAPI), công cụ cần biết
         *    để parse đúng định dạng
         */
        openapi: "3.0.0",
        // ── Thông tin mô tả dự án ──
        info: {
            /**
             * title: Tên hiển thị trên trang tài liệu Swagger UI
             * Lập trình viên sẽ thấy tiêu đề này khi mở http://localhost:5000/api-docs
             */
            title: "HảiSản.vn API Documentation",
            /**
             * version: Phiên bản API hiện tại
             *
             * Nên cập nhật số này mỗi khi có thay đổi lớn trong API
             * Theo quy ước "Semantic Versioning": MAJOR.MINOR.PATCH
             * - 1.0.0 → phiên bản chính thức đầu tiên
             * - 1.1.0 → thêm tính năng mới, không phá vỡ API cũ
             * - 2.0.0 → thay đổi lớn, có thể không tương thích ngược
             */
            version: "1.0.0",
            /**
             * description: Phần mô tả dài, hiển thị dưới tiêu đề trên Swagger UI
             *
             * Ở đây dùng Template String (dấu backtick ``) để viết nhiều dòng
             * \n tạo xuống dòng, ** ** in đậm theo cú pháp Markdown
             *
             * Nội dung mô tả gồm 3 lưu ý quan trọng cho Frontend Developer:
             *
             * 1. CSRF Token: Bảo vệ chống tấn công Cross-Site Request Forgery
             *    → Mọi API thay đổi dữ liệu (POST/PUT/DELETE/PATCH) đều cần
             *      gửi kèm CSRF Token trong header `x-csrf-token`
             *    → Token này Frontend đọc từ cookie tên `XSRF-TOKEN`
             *
             * 2. Cookie Auth: Xác thực bằng JWT lưu trong HTTP-Only Cookie
             *    → Phải đăng nhập trước (qua nút Authorize trên Swagger UI)
             *      mới test được các API yêu cầu đăng nhập
             *
             * 3. Realtime: Socket.IO và WebRTC không test được trên Swagger
             *    → Tham khảo file hướng dẫn riêng trong thư mục docs/
             */
            description: "Tài liệu API chi tiết cho ứng dụng mua bán hải sản HảiSản.vn\n\n" +
                "⚠️ **LƯU Ý BẢO MẬT & TÍCH HỢP CHO FRONTEND DEVELOPER:**\n" +
                "1. **Bảo vệ CSRF**: Mọi API ghi dữ liệu (POST, PUT, DELETE, PATCH) ngoại trừ các API công khai đều yêu cầu đính kèm CSRF Token. Lập trình viên Frontend phải đọc token từ cookie `XSRF-TOKEN` của trình duyệt và gửi kèm trong request header dưới dạng `x-csrf-token: <value>`.\n" +
                "2. **Xác thực Cookie**: Sử dụng HttpOnly JWT Cookie xác thực, hãy nhấn nút 'Authorize' (cấu hình `cookieAuth`) và đăng nhập thành công trước để thực hiện test các API cần quyền truy cập.\n" +
                "3. **Tài liệu Realtime (Socket.IO & WebRTC)**: Các kênh sự kiện thời gian thực không thể chạy thử trực tiếp trên Swagger. Hãy tham chiếu tệp tài liệu hướng dẫn tích hợp realtime chuyên biệt tại [08_socket_io_realtime_guide.md](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/08_socket_io_realtime_guide.md) trong mã nguồn dự án.",
        },
        // ── Khai báo danh sách máy chủ (Servers) ──
        /**
         * servers: Danh sách các môi trường mà API có thể chạy
         *
         * Swagger UI sẽ hiển thị dropdown cho phép chọn server
         * Khi "Try it out", request sẽ gửi đến URL của server đang chọn
         *
         * Dự án thực tế thường có nhiều môi trường:
         * - http://localhost:5000     → Máy cá nhân (Local Dev)  ← đang cấu hình
         * - https://staging.example.com → Môi trường kiểm thử (Staging)
         * - https://api.example.com    → Môi trường thật (Production)
         */
        servers: [
            {
                /**
                 * url: Địa chỉ gốc (base URL) của API server
                 *
                 * localhost = máy tính của chính mình
                 * 5000 = cổng (port) mà server Express đang lắng nghe
                 *
                 * Tất cả API endpoint sẽ được gọi dưới dạng:
                 * http://localhost:5000/api/products
                 * http://localhost:5000/api/auth/login
                 * ... v.v.
                 */
                url: "http://localhost:5000",
                /**
                 * description: Nhãn mô tả server này là gì
                 * Hiển thị trong dropdown chọn server trên Swagger UI
                 */
                description: "Local Development Server",
            },
        ],
        // ── components: Định nghĩa các phần tử dùng chung (tái sử dụng) ──
        /**
         * components là kho chứa các thành phần có thể tái sử dụng
         * ở nhiều nơi trong tài liệu API mà không cần viết lại
         *
         * Gồm 2 phần chính ở đây:
         * 1. securitySchemes → cách xác thực (authentication)
         * 2. schemas         → khuôn mẫu cấu trúc dữ liệu (data models)
         */
        components: {
            // ── 1. Cấu hình bảo mật / xác thực ──
            securitySchemes: {
                /**
                 * cookieAuth: Tên định danh cho cơ chế xác thực này
                 * (tên này tự đặt, dùng để tham chiếu trong các API khác)
                 *
                 * 💡 JWT LÀ GÌ?
                 *    JWT (JSON Web Token) là một chuỗi mã hóa chứa thông tin
                 *    người dùng (id, role, thời hạn...). Server tạo ra và ký bằng
                 *    khóa bí mật. Client lưu lại và gửi kèm mỗi request để xác thực.
                 *
                 * 💡 HTTP-ONLY COOKIE LÀ GÌ?
                 *    Cookie thông thường: JavaScript có thể đọc → dễ bị XSS tấn công
                 *    HTTP-Only Cookie: JavaScript KHÔNG đọc được → an toàn hơn
                 *    Trình duyệt tự động gửi cookie này theo mỗi request đến cùng domain
                 *
                 * Cấu hình:
                 * - type: "apiKey"   → loại xác thực là "dùng khóa/token"
                 * - in: "cookie"     → khóa nằm trong Cookie (không phải Header hay URL)
                 * - name: "token"    → tên của cookie cụ thể chứa JWT Access Token
                 */
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description: "JWT Access Token được lưu trong HTTP-Only Cookie",
                },
            },
            // ── 2. Định nghĩa schemas (khuôn mẫu cấu trúc dữ liệu) ──
            /**
             * schemas: Các "bản thiết kế" mô tả hình dạng của dữ liệu
             *
             * Giống như interface trong TypeScript, schema mô tả:
             * - Có những trường (field) nào?
             * - Mỗi trường có kiểu dữ liệu gì? (string, number, boolean, array...)
             * - Giá trị mẫu (example) trông như thế nào?
             *
             * Lợi ích:
             * → Frontend biết chính xác dữ liệu nhận về có dạng gì
             * → Tái sử dụng bằng cách dùng `$ref: '#/components/schemas/TenSchema'`
             *   thay vì phải viết lại toàn bộ ở mỗi API endpoint
             */
            schemas: {
                /**
                 * ErrorResponse: Khuôn mẫu phản hồi lỗi chung
                 *
                 * Khi API gặp lỗi, server luôn trả về dạng:
                 * {
                 *   "message": "Mô tả lỗi cụ thể"
                 * }
                 *
                 * Frontend dùng schema này để biết cách hiển thị thông báo lỗi
                 */
                ErrorResponse: {
                    type: "object", // Đây là một đối tượng JSON
                    properties: {
                        message: {
                            type: "string", // Kiểu chuỗi văn bản
                            example: "Mô tả chi tiết lỗi xảy ra", // Ví dụ minh họa
                        },
                    },
                },
                /**
                 * UserPublicProfile: Thông tin công khai của người dùng
                 *
                 * Schema này dùng khi trả về thông tin user cho người khác xem
                 * (KHÔNG bao gồm mật khẩu hay thông tin nhạy cảm)
                 *
                 * Các trường:
                 * - id        → Mã định danh duy nhất trong MongoDB (ObjectId)
                 * - name      → Họ tên hiển thị
                 * - email     → Email đăng nhập (format: email = Swagger validate định dạng)
                 * - role      → Vai trò: "User" (thường) hoặc "Admin" (quản trị viên)
                 * - avatarUrl → Đường dẫn ảnh đại diện (nullable = có thể null nếu chưa đặt)
                 * - isVerified → Đã xác thực email chưa?
                 * - rating    → Điểm đánh giá trung bình (ví dụ: 4.8/5.0)
                 */
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
                        //                             ↑ enum: chỉ được phép là 1 trong 2 giá trị này
                        avatarUrl: {
                            type: "string",
                            nullable: true,
                            example: "https://cloudinary.com/avatar.jpg",
                        },
                        //                             ↑ nullable: true → trường này có thể trả về null
                        isVerified: { type: "boolean", example: true },
                        rating: { type: "number", example: 4.8 },
                    },
                },
                /**
                 * ProductResponse: Thông tin một sản phẩm hải sản
                 *
                 * Các trường đáng chú ý:
                 * - price    → Giá tiền (đơn vị: VND)
                 * - unit     → Đơn vị bán: "kg", "con", "hộp"...
                 * - location → Tọa độ địa lý theo chuẩn GeoJSON (dùng cho tính năng tìm kiếm theo vị trí)
                 *              type: "Point" và coordinates: [kinh độ, vĩ độ]
                 *              💡 Chú ý: GeoJSON dùng [longitude, latitude] — ngược thứ tự thông thường!
                 * - images   → Mảng URL ảnh sản phẩm (lưu trên Cloudinary)
                 * - sellerId → ID của người bán đăng sản phẩm này
                 */
                ProductResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e1234567" },
                        name: { type: "string", example: "Cua biển Cà Mau" },
                        price: { type: "number", example: 350000 },
                        category: { type: "string", example: "Cua, Ghẹ" },
                        unit: { type: "string", example: "kg" },
                        // Trường location có cấu trúc lồng nhau (nested object)
                        location: {
                            type: "object",
                            properties: {
                                type: { type: "string", example: "Point" },
                                coordinates: {
                                    type: "array",
                                    items: { type: "number" }, // Mảng số thực
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
                        //                           ↑ format: "date-time" → chuỗi ISO 8601, ví dụ: "2024-01-15T08:30:00Z"
                    },
                },
                /**
                 * MessageResponse: Cấu trúc một tin nhắn trong chat
                 *
                 * Ứng dụng có tính năng nhắn tin trực tiếp giữa người mua và người bán
                 * Mỗi tin nhắn liên kết với:
                 * - productId  → Sản phẩm đang hỏi/thảo luận
                 * - senderId   → Người gửi tin nhắn
                 * - receiverId → Người nhận tin nhắn
                 *
                 * Các trường đặc biệt:
                 * - content    → Nội dung text (nullable: tin nhắn có thể chỉ có ảnh, không có text)
                 * - imageUrl   → Ảnh đính kèm (nullable: có thể không có ảnh)
                 * - isRead     → Người nhận đã đọc chưa? (dùng để hiện dấu tích đọc)
                 * - isRecalled → Tin nhắn có bị thu hồi không? (tính năng thu hồi tin nhắn)
                 * - reaction   → Emoji phản ứng (nullable: ví dụ "heart", "like", "haha"...)
                 */
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
                /**
                 * PostResponse: Cấu trúc một bài viết trong cộng đồng/blog
                 *
                 * Ứng dụng có khu vực cộng đồng để người dùng chia sẻ kinh nghiệm
                 * Ví dụ: "Cách chọn tôm tươi", "Kinh nghiệm mua cua"
                 *
                 * - tags       → Mảng nhãn/chủ đề (ví dụ: ["Kinh nghiệm", "Mực"])
                 * - likesCount → Số người thích bài viết (integer = số nguyên, không có thập phân)
                 * - authorId   → ID người đăng bài
                 */
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
                        likesCount: { type: "integer", example: 12 }, // integer: số nguyên (khác number cho phép số thập phân)
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                /**
                 * CommentResponse: Cấu trúc một bình luận dưới bài viết
                 *
                 * Schema đơn giản gồm 3 trường:
                 * - text     → Nội dung bình luận
                 * - authorId → Người viết bình luận
                 * - createdAt → Thời điểm bình luận được đăng
                 */
                CommentResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "64df56e9c40212f8e12345bb" },
                        text: { type: "string", example: "Cảm ơn tác giả đã chia sẻ!" },
                        authorId: { type: "string", example: "64df56e9c40212f8e1234567" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                /**
                 * RecipeResponse: Cấu trúc một công thức nấu ăn hải sản
                 *
                 * Ứng dụng có thêm tính năng chia sẻ công thức chế biến
                 *
                 * Các trường đặc biệt:
                 * - ingredients  → Mảng chuỗi tên nguyên liệu (ví dụ: ["500g tôm", "2 quả cà chua"])
                 * - instructions → Mảng chuỗi các bước thực hiện theo thứ tự
                 * - difficulty   → Độ khó: "Easy" / "Medium" / "Hard" (chỉ 3 giá trị được phép)
                 * - cookingTime  → Thời gian nấu tính bằng phút (ví dụ: 30 → 30 phút)
                 * - servings     → Số khẩu phần (ví dụ: 4 → nấu cho 4 người ăn)
                 * - likesCount   → Số người đã thích công thức này
                 */
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
            }, // Kết thúc schemas
        }, // Kết thúc components
    }, // Kết thúc definition
    // ─────────────────────────────────────────────────────────────
    // PHẦN 3: KHAI BÁO ĐƯỜNG DẪN CÁC FILE CẦN QUÉT ĐỂ SINH TÀI LIỆU
    // ─────────────────────────────────────────────────────────────
    /**
     * apis: Mảng chứa các pattern đường dẫn đến file route
     *
     * swagger-jsdoc sẽ quét qua từng file khớp với pattern này,
     * tìm các comment /** @swagger ... * / và tổng hợp thành tài liệu
     *
     * 💡 Dấu * là wildcard — nghĩa là "bất kỳ tên file nào"
     *    Ví dụ: "./src/routes/*.ts" khớp với:
     *    - ./src/routes/auth.route.ts
     *    - ./src/routes/product.route.ts
     *    - ./src/routes/user.route.ts
     *    ... v.v.
     *
     * Tại sao có 3 đường dẫn?
     * ┌─────────────────────────────────────────────────────────┐
     * │ Path 1: "./src/routes/*.ts"                            │
     * │ → Dùng khi chạy môi trường Development (ts-node)       │
     * │   File TypeScript (.ts) chưa được biên dịch            │
     * │                                                         │
     * │ Path 2: "./dist/routes/*.js"                           │
     * │ → Dùng khi chạy môi trường Production                  │
     * │   TypeScript đã được biên dịch thành JavaScript (.js)  │
     * │   vào thư mục dist/                                     │
     * │                                                         │
     * │ Path 3: "./backend/src/routes/*.ts"                    │
     * │ → Đường dẫn dự phòng cho cấu trúc Monorepo             │
     * │   (Monorepo = 1 repo chứa cả frontend lẫn backend)     │
     * │   Khi đó server chạy từ thư mục gốc, đường dẫn khác    │
     * └─────────────────────────────────────────────────────────┘
     */
    apis: [
        "./src/routes/*.ts", // Dev: file TypeScript gốc
        "./dist/routes/*.js", // Production: file đã biên dịch sang JS
        "./backend/src/routes/*.ts", // Monorepo: cấu trúc thư mục lồng nhau
    ],
}; // Kết thúc options
// ─────────────────────────────────────────────────────────────
// PHẦN 4: SINH TÀI LIỆU VÀ XUẤT RA NGOÀI
// ─────────────────────────────────────────────────────────────
/**
 * swaggerJSDoc(options) — Gọi hàm chính để sinh tài liệu
 *
 * Hàm này thực hiện tuần tự:
 * 1. Đọc cấu hình từ `options` ở trên
 * 2. Quét tất cả các file trong danh sách `apis`
 * 3. Tìm và parse tất cả comment @swagger trong các file đó
 * 4. Gộp với phần `definition` đã khai báo
 * 5. Trả về một object JSON hoàn chỉnh theo chuẩn OpenAPI 3.0
 *
 * Kết quả lưu vào biến `swaggerSpec` — đây là "bản tài liệu" hoàn chỉnh
 * được dùng để:
 * - Render giao diện Swagger UI (qua hàm setupSwagger)
 * - Export ra ngoài để dùng trong test suite hay CI/CD pipeline
 */
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;
// ─────────────────────────────────────────────────────────────
// PHẦN 5: HÀM TIỆN ÍCH GẮN SWAGGER VÀO ỨNG DỤNG EXPRESS
// ─────────────────────────────────────────────────────────────
/**
 * setupSwagger(app) — Hàm cài đặt Swagger UI vào Express
 *
 * @param app — Đối tượng ứng dụng Express (được tạo bằng express())
 *
 * Cách dùng trong file server.ts / app.ts chính:
 * ```typescript
 * import express from "express";
 * import { setupSwagger } from "./swagger";
 *
 * const app = express();
 * setupSwagger(app);  // ← Gọi hàm này một lần duy nhất
 *
 * app.listen(5000);
 * ```
 *
 * Sau khi gọi hàm này:
 * → Truy cập http://localhost:5000/api-docs để xem tài liệu API
 *
 * 💡 app.use() là cách Express đăng ký middleware cho một đường dẫn
 *    - "/api-docs"        → prefix URL, tất cả request đến /api-docs/* đều vào đây
 *    - swaggerUi.serve    → middleware phục vụ các file tĩnh (CSS, JS) của Swagger UI
 *    - swaggerUi.setup()  → middleware render HTML, nhận tài liệu JSON làm tham số
 */
function setupSwagger(app) {
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    //      ↑ URL path    ↑ Phục vụ file  ↑ Render giao diện với dữ liệu swaggerSpec
}
