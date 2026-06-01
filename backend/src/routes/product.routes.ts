import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { validateSchema } from "../middlewares/validate";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  bumpProduct,
  getProductPriceHistory,
  getTodayCount,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// ─── Shared field definitions ─────────────────────────────────
// Trong tệp: backend/src/routes/product.routes.ts

const productBodyFields = {
  type: z.enum(["Fresh", "Dried"] as const, {
    error: "Loại hải sản tươi hoặc khô là bắt buộc",
  }),
  category: z.enum(
    ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"] as const,
    { error: "Nhãn phân loại chi tiết là bắt buộc" },
  ),
  name: z
    .string({ error: "Tên mẻ hàng bắt buộc nhập" })
    .min(2, "Tên quá ngắn")
    .max(150, "Tên quá dài"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Đơn giá phải lớn hơn 0"),
  ),
  totalWeight: z.preprocess(
    (val) => Number(val),
    z.number().positive("Khối lượng phải lớn hơn 0"),
  ),
  salesType: z.enum(["Retail", "Wholesale"] as const).optional(),
  description: z.string().optional(),
  catchTime: z.string().optional().nullable(),
  lat: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(-90).max(90).optional(),
  ),
  lng: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(-180).max(180).optional(),
  ),
  origin: z.string().optional(),
  expiryDate: z.string().optional(),

  // Chỉ dùng khi update
  remainingWeight: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().positive("Khối lượng còn lại phải lớn hơn 0").optional(),
  ),
  status: z.enum(["Active", "Expired", "Deleted"] as const).optional(),

  // 🌟 GIẢI PHÁP: Khai báo mảng URL ảnh cho phép vượt qua bộ lọc của Zod
  images: z.array(z.string()).optional(),
};

// ─── POST /api/products — các trường bắt buộc đầy đủ ──────────
const productCreateSchema = z.object({
  body: z.object(productBodyFields),
});

// ─── PUT /api/products/:id — tất cả optional, chỉ validate trường được gửi lên
// FIX: Trước đây dùng cùng productSchema → PUT phải gửi type/category/name/price/totalWeight
// dù chỉ muốn cập nhật description. Dùng .partial() để mọi field đều optional khi update.
const productUpdateSchema = z.object({
  body: z.object(productBodyFields).partial(),
});

const priceHistoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 60, // tối đa 60 yêu cầu mỗi IP
  message: { message: "Quá nhiều yêu cầu xem lịch sử giá. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────
router.get("/", getProducts);
router.get("/my", authenticate, getMyProducts);
router.get("/today-count", authenticate, getTodayCount);
router.get("/:id", getProductById);
router.get("/:id/price-history", priceHistoryLimiter, getProductPriceHistory);

router.post(
  "/",
  authenticate,
  validateSchema(productCreateSchema),
  createProduct,
);
router.put(
  "/:id",
  authenticate,
  validateSchema(productUpdateSchema),
  updateProduct,
);

router.delete("/:id", authenticate, deleteProduct);
router.post("/:id/bump", authenticate, bumpProduct);

export default router;
