import { Router } from "express";
import {
  logout,
  me,
  refreshToken,
  updateProfile,
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
  updateProfileSchema,
} from "../validations/auth.validation";

const router = Router();

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

router.delete("/account", authenticate, deleteAccount);

export default router;

export const userRouter = Router();
userRouter.get("/fishermen/leaderboard", getFishermanLeaderboard);
userRouter.get("/:id", getUserPublicProfile);
