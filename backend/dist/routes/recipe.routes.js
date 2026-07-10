"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý công thức nấu ăn từ RecipeController thuộc module recipe
const RecipeController_1 = require("../modules/recipe/presentation/http/RecipeController");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Import middleware kiểm tra tính hợp lệ của dữ liệu đầu vào theo schema (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import các cấu trúc schema kiểm duyệt tạo mới và cập nhật công thức từ recipe.validation
const recipe_validation_1 = require("../validations/recipe.validation");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/recipes:
 *   get:
 *     summary: Lấy danh sách công thức nấu ăn (công khai không cần đăng nhập)
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
// Định nghĩa tuyến đường GET / để lấy danh sách công thức nấu ăn (công khai không cần đăng nhập)
router.get("/", RecipeController_1.getRecipes);
/**
 * @openapi
 * /api/recipes/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một công thức nấu ăn theo ID (công khai không cần đăng nhập)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của công thức nấu ăn
 *     responses:
 *       200:
 *         description: Lấy thông tin công thức nấu ăn thành công
 *       404:
 *         description: Không tìm thấy công thức nấu ăn
 */
// Định nghĩa tuyến đường GET /:id để lấy thông tin chi tiết một công thức theo ID (công khai không cần đăng nhập)
router.get("/:id", RecipeController_1.getRecipeById);
/**
 * @openapi
 * /api/recipes:
 *   post:
 *     summary: Đăng một công thức nấu ăn mới (yêu cầu đăng nhập)
 *     tags: [Recipes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, ingredients, instructions]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Lẩu cua biển chua cay
 *               description:
 *                 type: string
 *                 example: Công thức nấu lẩu cua chuẩn vị miền Tây.
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["2 con cua biển", "1 gói gia vị lẩu", "Rau muống, bắp chuối"]
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Làm sạch cua biển", "Nấu nước dùng lẩu", "Thả cua vào đun chín và thưởng thức"]
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://res.cloudinary.com/demo/image/upload/v1234/seafood.jpg
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Hard]
 *                 example: Medium
 *               cookingTime:
 *                 type: number
 *                 example: 45
 *               servings:
 *                 type: number
 *                 example: 4
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Lẩu", "Cua", "Cay"]
 *     responses:
 *       201:
 *         description: Đăng công thức thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST / để tạo một công thức nấu ăn mới (yêu cầu đăng nhập, validate dữ liệu tạo mới, rồi gọi controller createRecipe)
router.post("/", auth_1.authenticate, (0, validate_1.validateSchema)(recipe_validation_1.createRecipeSchema), RecipeController_1.createRecipe);
/**
 * @openapi
 * /api/recipes/{id}/like:
 *   post:
 *     summary: Bật hoặc tắt trạng thái thích công thức nấu ăn theo ID (yêu cầu đăng nhập)
 *     tags: [Recipes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của công thức nấu ăn
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái thích thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy công thức nấu ăn
 */
// Định nghĩa tuyến đường POST /:id/like để bật hoặc tắt trạng thái thích công thức theo ID (yêu cầu đăng nhập)
router.post("/:id/like", auth_1.authenticate, RecipeController_1.toggleLikeRecipe);
router.post("/:id/comments", auth_1.authenticate, (0, validate_1.validateSchema)(recipe_validation_1.recipeCommentSchema), RecipeController_1.addRecipeComment);
/**
 * @openapi
 * /api/recipes/{id}:
 *   put:
 *     summary: Chỉnh sửa thông tin công thức nấu ăn theo ID (yêu cầu đăng nhập)
 *     tags: [Recipes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của công thức nấu ăn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền sửa công thức của người khác
 *       404:
 *         description: Không tìm thấy công thức nấu ăn
 */
// Định nghĩa tuyến đường PUT /:id để cập nhật thông tin công thức nấu ăn theo ID (yêu cầu đăng nhập, validate dữ liệu cập nhật, rồi gọi controller updateRecipe)
router.put("/:id", auth_1.authenticate, (0, validate_1.validateSchema)(recipe_validation_1.updateRecipeSchema), RecipeController_1.updateRecipe);
/**
 * @openapi
 * /api/recipes/{id}:
 *   delete:
 *     summary: Xóa một công thức nấu ăn theo ID (yêu cầu đăng nhập)
 *     tags: [Recipes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của công thức nấu ăn
 *     responses:
 *       200:
 *         description: Xóa công thức nấu ăn thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa công thức của người khác
 *       404:
 *         description: Không tìm thấy công thức nấu ăn
 */
// Định nghĩa tuyến đường DELETE /:id để xóa một công thức nấu ăn theo ID (yêu cầu đăng nhập)
router.delete("/:id", auth_1.authenticate, RecipeController_1.deleteRecipe);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
