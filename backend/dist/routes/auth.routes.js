"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý đăng xuất, lấy thông tin cá nhân, làm mới token, cập nhật hồ sơ, xóa tài khoản, đăng nhập Google từ AuthController của DDD module iam
const AuthController_1 = require("../modules/iam/presentation/http/AuthController");
// Import middleware xác thực người dùng đã đăng nhập hay chưa (authenticate)
const auth_1 = require("../middlewares/auth");
// Import middleware cấu hình lưu trữ file tải lên (upload) và hàm xử lý lỗi upload (handleUploadError)
const upload_1 = require("../middlewares/upload");
// Import hàm xử lý thông tin hồ sơ công khai của người dùng và bảng xếp hạng ngư dân (Fisherman Leaderboard) từ user.controller
const user_controller_1 = require("../controllers/user.controller");
// Import middleware kiểm tra tính hợp lệ của schema dữ liệu đầu vào (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import schema kiểm duyệt dữ liệu cập nhật hồ sơ từ auth.validation
const auth_validation_1 = require("../validations/auth.validation");
// Khởi tạo một đối tượng router cho phần xác thực (auth routes)
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     summary: Đăng nhập qua tài khoản Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential:
 *                 type: string
 *                 description: JWT token sinh bởi Google OAuth Client
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công
 */
// Tuyến đường POST /google phục vụ đăng nhập thông qua Google OAuth
router.post("/google", AuthController_1.googleAuth);
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Đăng xuất và xóa cookie xác thực thành công
 */
// Tuyến đường POST /logout phục vụ đăng xuất và hủy bỏ các token cookie
router.post("/logout", AuthController_1.logout);
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Gia hạn Access Token mới qua Refresh Token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Gia hạn token thành công
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
// Tuyến đường POST /refresh dùng để gia hạn lại access token mới khi access token cũ hết hạn
router.post("/refresh", AuthController_1.refreshToken);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản người dùng hiện tại
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin chi tiết người dùng
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
// Tuyến đường GET /me để lấy thông tin cá nhân của tài khoản hiện tại đang đăng nhập
router.get("/me", AuthController_1.me);
/**
 * @openapi
 * /api/auth/profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh đại diện người dùng
 *               name:
 *                 type: string
 *                 description: Tên người dùng
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email người dùng
 *                 example: anguyen@gmail.com
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Tuyến đường PUT /profile cập nhật thông tin tài khoản (yêu cầu đăng nhập, cho phép tải lên 1 ảnh đại diện avatar, validate dữ liệu, rồi gọi controller updateProfile)
router.put("/profile", auth_1.authenticate, upload_1.upload.single("avatar"), upload_1.handleUploadError, (0, validate_1.validateSchema)(auth_validation_1.updateProfileSchema), AuthController_1.updateProfile);
/**
 * @openapi
 * /api/auth/account:
 *   delete:
 *     summary: Người dùng tự xóa tài khoản của chính mình
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Tuyến đường DELETE /account để người dùng tự xóa tài khoản của chính mình (yêu cầu đăng nhập)
router.delete("/account", auth_1.authenticate, AuthController_1.deleteAccount);
// Tuyến đường PUT /password dùng để đổi mật khẩu (yêu cầu đăng nhập)
router.put("/password", auth_1.authenticate, AuthController_1.changePassword);
// Tuyến đường DELETE /password dùng để xóa/gỡ mật khẩu (yêu cầu đăng nhập)
router.delete("/password", auth_1.authenticate, AuthController_1.deletePassword);
// Xuất mặc định router auth để sử dụng
exports.default = router;
// Khởi tạo một đối tượng router riêng biệt quản lý thông tin công khai của người dùng (user routes)
exports.userRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/users/fishermen/leaderboard:
 *   get:
 *     summary: Lấy bảng xếp hạng ngư dân tiêu biểu
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lấy bảng xếp hạng thành công
 */
// Tuyến đường GET /fishermen/leaderboard lấy bảng xếp hạng ngư dân tiêu biểu
exports.userRouter.get("/fishermen/leaderboard", user_controller_1.getFishermanLeaderboard);
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Lấy hồ sơ cá nhân công khai của người dùng khác
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần xem hồ sơ
 *     responses:
 *       200:
 *         description: Lấy hồ sơ cá nhân thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
// Tuyến đường GET /:id để lấy thông tin hồ sơ cá nhân công khai của người dùng dựa theo ID
exports.userRouter.get("/:id", user_controller_1.getUserPublicProfile);
