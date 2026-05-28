import { Router } from "express";
import { z } from "zod";
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
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Định nghĩa Schema Zod v4 kiểm duyệt sản phẩm đăng bán
const productSchema = z.object({
  body: z.object({
    // 🌟 Zod v4: Dùng "as const" và chuyển sang cấu trúc tham số "error" hợp nhất
    type: z.enum(["Fresh", "Dried"] as const, {
      error: "Loại hải sản tươi hoặc khô là bắt buộc",
    }),
    category: z.enum(
      ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"] as const,
      {
        error: "Nhãn phân loại chi tiết là bắt buộc",
      },
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
  }),
});

router.get("/", getProducts);
router.get("/my", authenticate, getMyProducts);
router.get("/:id", getProductById);
router.get("/:id/price-history", getProductPriceHistory);

router.post("/", authenticate, validateSchema(productSchema), createProduct);
router.put("/:id", authenticate, validateSchema(productSchema), updateProduct);

router.delete("/:id", authenticate, deleteProduct);
router.post("/:id/bump", authenticate, bumpProduct);

export default router;
