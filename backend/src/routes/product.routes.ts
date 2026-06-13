import { Router } from "express";
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
  getTodayCount,
} from "../modules/product/presentation/http/ProductController";
import { authenticate } from "../middlewares/auth";
import {
  productCreateSchema,
  productUpdateSchema,
} from "../validations/product.validation";

const router = Router();



/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm hoặc tìm kiếm theo GPS, từ khóa
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Vĩ độ GPS để lọc theo khoảng cách
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Kinh độ GPS để lọc theo khoảng cách
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *           default: 10
 *         description: Khoảng cách bán kính lọc (km)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm tên sản phẩm
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm thỏa mãn điều kiện
 */
router.get("/", getProducts);

/**
 * @openapi
 * /api/products/my:
 *   get:
 *     summary: Lấy danh sách sản phẩm của người bán hiện tại
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm của tôi
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/my", authenticate, getMyProducts);

/**
 * @openapi
 * /api/products/today-count:
 *   get:
 *     summary: Đếm số lượng sản phẩm đăng hôm nay của người dùng
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Trả về số lượng sản phẩm đăng hôm nay
 */
router.get("/today-count", authenticate, getTodayCount);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm MongoDB Object ID
 *     responses:
 *       200:
 *         description: Trả về thông tin chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get("/:id", getProductById);



/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Đăng bán một sản phẩm hải sản mới
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category, unit, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cua biển Cà Mau
 *               price:
 *                 type: number
 *                 example: 350000
 *               category:
 *                 type: string
 *                 example: Cua, Ghẹ
 *               unit:
 *                 type: string
 *                 example: kg
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.660172, 10.762622]
 *                     description: Mảng chứa [lng, lat]
 *     responses:
 *       201:
 *         description: Đăng bán sản phẩm thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post(
  "/",
  authenticate,
  validateSchema(productCreateSchema),
  createProduct,
);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 */
router.put(
  "/:id",
  authenticate,
  validateSchema(productUpdateSchema),
  updateProduct,
);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa một sản phẩm
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 */
router.delete("/:id", authenticate, deleteProduct);

/**
 * @openapi
 * /api/products/{id}/bump:
 *   post:
 *     summary: Đẩy bài đăng sản phẩm lên đầu trang
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đẩy bài thành công
 *       400:
 *         description: Chưa hết thời gian cooldown để tiếp tục đẩy bài
 */
router.post("/:id/bump", authenticate, bumpProduct);

export default router;
