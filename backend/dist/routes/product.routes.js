"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import middleware kiểm tra tính hợp lệ của dữ liệu đầu vào theo schema (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import các hàm xử lý từ ProductController của module product liên quan đến sản phẩm hải sản
const ProductController_1 = require("../modules/product/presentation/http/ProductController");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Import cấu trúc schema kiểm duyệt dữ liệu tạo mới và cập nhật sản phẩm từ product.validation
const product_validation_1 = require("../validations/product.validation");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
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
// Định nghĩa tuyến đường GET / lấy danh sách sản phẩm (công khai không cần đăng nhập)
router.get("/", ProductController_1.getProducts);
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
// Định nghĩa tuyến đường GET /my để lấy danh sách sản phẩm của chính người đăng nhập (yêu cầu đăng nhập)
router.get("/my", auth_1.authenticate, auth_1.sellerOnly, ProductController_1.getMyProducts);
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
// Định nghĩa tuyến đường GET /today-count lấy số sản phẩm đã đăng trong ngày (yêu cầu đăng nhập)
router.get("/today-count", auth_1.authenticate, auth_1.sellerOnly, ProductController_1.getTodayCount);
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
// Định nghĩa tuyến đường GET /:id để lấy thông tin chi tiết sản phẩm theo ID (công khai không cần đăng nhập)
router.get("/:id", ProductController_1.getProductById);
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
// Định nghĩa tuyến đường POST / để tạo sản phẩm mới (yêu cầu đăng nhập, validate cấu trúc đầu vào, rồi gọi controller createProduct)
router.post("/", auth_1.authenticate, auth_1.sellerOnly, (0, validate_1.validateSchema)(product_validation_1.productCreateSchema), ProductController_1.createProduct);
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
// Định nghĩa tuyến đường PUT /:id cập nhật thông tin sản phẩm theo ID (yêu cầu đăng nhập, validate dữ liệu cập nhật, rồi gọi controller updateProduct)
router.put("/:id", auth_1.authenticate, auth_1.sellerOnly, (0, validate_1.validateSchema)(product_validation_1.productUpdateSchema), ProductController_1.updateProduct);
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
// Định nghĩa tuyến đường DELETE /:id để người bán tự xóa sản phẩm theo ID (yêu cầu đăng nhập)
router.delete("/:id", auth_1.authenticate, auth_1.sellerOnly, ProductController_1.deleteProduct);
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
// Định nghĩa tuyến đường POST /:id/bump để đẩy bài đăng sản phẩm lên đầu trang tìm kiếm (yêu cầu đăng nhập)
router.post("/:id/bump", auth_1.authenticate, auth_1.sellerOnly, ProductController_1.bumpProduct);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
