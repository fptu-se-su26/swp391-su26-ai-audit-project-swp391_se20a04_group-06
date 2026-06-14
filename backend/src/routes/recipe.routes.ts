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
} from "../validations/recipe.validation";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET / để lấy danh sách công thức nấu ăn (công khai không cần đăng nhập)
router.get("/", getRecipes);

// Định nghĩa tuyến đường GET /:id để lấy thông tin chi tiết một công thức theo ID (công khai không cần đăng nhập)
router.get("/:id", getRecipeById);

// Định nghĩa tuyến đường POST / để tạo một công thức nấu ăn mới (yêu cầu đăng nhập, validate dữ liệu tạo mới, rồi gọi controller createRecipe)
router.post(
  "/",
  authenticate,
  validateSchema(createRecipeSchema),
  createRecipe,
);

// Định nghĩa tuyến đường POST /:id/like để bật hoặc tắt trạng thái thích công thức theo ID (yêu cầu đăng nhập)
router.post("/:id/like", authenticate, toggleLikeRecipe);

// Định nghĩa tuyến đường PUT /:id để cập nhật thông tin công thức nấu ăn theo ID (yêu cầu đăng nhập, validate dữ liệu cập nhật, rồi gọi controller updateRecipe)
router.put(
  "/:id",
  authenticate,
  validateSchema(updateRecipeSchema),
  updateRecipe,
);

// Định nghĩa tuyến đường DELETE /:id để xóa một công thức nấu ăn theo ID (yêu cầu đăng nhập)
router.delete("/:id", authenticate, deleteRecipe);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
