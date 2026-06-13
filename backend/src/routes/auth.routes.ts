import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  me,
  refreshToken,
  updateProfile,
  changePassword,
  deleteAccount,
  googleAuth,
} from "../modules/iam/presentation/http/AuthController";
import { authenticate } from "../middlewares/auth";
import { upload, handleUploadError } from "../middlewares/upload";
import {
  getUserPublicProfile,
  getFishermanLeaderboard,
} from "../controllers/user.controller";
import { validateSchema } from "../middlewares/validate";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/auth.validation";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản người dùng mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, phone, role]
 *             properties:
 *               username:
 *                 type: string
 *                 example: nguoidung123
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123!
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               role:
 *                 type: string
 *                 enum: [buyer, seller, fisherman, admin]
 *                 example: buyer
 *     responses:
 *       201:
 *         description: Đăng ký tài khoản thành công
 *       400:
 *         description: Yêu cầu không hợp lệ hoặc số điện thoại/email đã tồn tại
 */
router.post(
  "/register",
  registerLimiter,
  validateSchema(registerSchema),
  register,
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống bằng email và mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và gắn Cookie HTTP-Only token
 *       401:
 *         description: Email hoặc mật khẩu không chính xác
 */
router.post("/login", loginLimiter, validateSchema(loginSchema), login);

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
router.post("/google", googleAuth);

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
router.post("/logout", logout);

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
router.post("/refresh", refreshToken);

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
router.get("/me", me);

router.put(
  "/profile",
  authenticate,
  upload.single("avatar"),
  handleUploadError,
  validateSchema(updateProfileSchema),
  updateProfile,
);

router.post(
  "/change-password",
  authenticate,
  validateSchema(changePasswordSchema),
  changePassword,
);

router.delete("/account", authenticate, deleteAccount);

export default router;

export const userRouter = Router();
userRouter.get("/fishermen/leaderboard", getFishermanLeaderboard);
userRouter.get("/:id", getUserPublicProfile);
