// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý công thức nấu ăn từ RecipeController thuộc module recipe
import {
  // Lấy danh sách các công thức nấu ăn
  getRecipes,
  // Lấy chi tiết công thức theo ID
  getRecipeById,
  // Tạo công thức nấu ăn mới
  createRecipe,
  // Bật/tắt lượt thích công thức nấu ăn
  toggleLikeRecipe,
  addRecipeComment,
  // Cập nhật thông tin công thức nấu ăn
  updateRecipe,
  // Xóa công thức nấu ăn
  deleteRecipe,
} from "../modules/recipe/presentation/http/RecipeController";
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";
// Import middleware kiểm tra tính hợp lệ của dữ liệu đầu vào theo schema (validateSchema)
import { validateSchema } from "../middlewares/validate";
// Import các cấu trúc schema kiểm duyệt tạo mới và cập nhật công thức từ recipe.validation
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeCommentSchema,
} from "../validations/recipe.validation";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

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
router.get("/", getRecipes);

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
router.get("/:id", getRecipeById);

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
router.post(
  "/",
  authenticate,
  validateSchema(createRecipeSchema),
  createRecipe,
);

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
router.post("/:id/like", authenticate, toggleLikeRecipe);
router.post(
  "/:id/comments",
  authenticate,
  validateSchema(recipeCommentSchema),
  addRecipeComment,
);

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
router.put(
  "/:id",
  authenticate,
  validateSchema(updateRecipeSchema),
  updateRecipe,
);

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
router.delete("/:id", authenticate, deleteRecipe);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
