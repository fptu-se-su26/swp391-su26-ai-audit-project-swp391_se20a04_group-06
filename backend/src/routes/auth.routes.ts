// ─── routes/auth.routes.ts ───────────────────────────────────
import { Router } from 'express';
<<<<<<< HEAD
import { register, login, me } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authenticate, me);

export default router;
=======
import rateLimit from 'express-rate-limit';
import { register, login, me } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

/* ─── Rate limiting chống brute force login ─── */
// Tối đa 10 lần thử / IP / 15 phút
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 phút
  max: 10,
  message: { message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip nếu request thành công (chỉ count thất bại)
  skipSuccessfulRequests: true,
});

// Rate limit register: 5 tài khoản / IP / giờ
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 giờ
  max: 5,
  message: { message: 'Đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau 1 giờ.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, register);
router.post('/login',    loginLimiter,    login);
router.get('/me',        authenticate,    me);

export default router;

// ─── Separate user public router ─────────────────────────────────────────────
export const userRouter = Router();
userRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT UserID AS id, Name AS name, Phone AS phone,
              IsVerified AS isVerified, CreatedAt AS createdAt
       FROM User WHERE UserID = ? AND IsActive = 1`,
      [id],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server' });
  }
});
>>>>>>> origin/main
