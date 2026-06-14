// Import các kiểu dữ liệu Request, Response, NextFunction từ Express để xử lý HTTP request/response và middleware
import { Request, Response, NextFunction } from "express";
// Import hàm parseId từ helper để định dạng và xác thực mã định danh truyền lên
import { parseId } from "../../../../helpers/response.helper";
// Import đối tượng recipeService quản lý các tác vụ truy vấn đọc dữ liệu công thức món ăn
import { recipeService } from "../../../../services/recipe.service";

// DDD Components
// Import lớp MongooseRecipeRepository để tương tác trực tiếp với cơ sở dữ liệu MongoDB
import { MongooseRecipeRepository } from "../../infrastructure/persistence/mongoose/MongooseRecipeRepository";
// Import lớp CreateRecipeUseCase để thực hiện nghiệp vụ tạo mới công thức nấu ăn
import { CreateRecipeUseCase } from "../../application/use-cases/CreateRecipeUseCase";
// Import lớp UpdateRecipeUseCase để thực hiện nghiệp vụ cập nhật thông tin công thức nấu ăn
import { UpdateRecipeUseCase } from "../../application/use-cases/UpdateRecipeUseCase";
// Import lớp DeleteRecipeUseCase để thực hiện nghiệp vụ xóa công thức nấu ăn
import { DeleteRecipeUseCase } from "../../application/use-cases/DeleteRecipeUseCase";
// Import lớp ToggleLikeRecipeUseCase để thực hiện nghiệp vụ thích hoặc bỏ thích công thức nấu ăn
import { ToggleLikeRecipeUseCase } from "../../application/use-cases/ToggleLikeRecipeUseCase";

// Khởi tạo đối tượng Repository dùng chung cho các Use Cases
const recipeRepository = new MongooseRecipeRepository();
// Khởi tạo Use Case tạo mới công thức, tiêm Repository vào qua Constructor (DI)
const createRecipeUseCase = new CreateRecipeUseCase(recipeRepository);
// Khởi tạo Use Case cập nhật công thức, tiêm Repository vào qua Constructor (DI)
const updateRecipeUseCase = new UpdateRecipeUseCase(recipeRepository);
// Khởi tạo Use Case xóa công thức, tiêm Repository vào qua Constructor (DI)
const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepository);
// Khởi tạo Use Case thích/bỏ thích công thức, tiêm Repository vào qua Constructor (DI)
const toggleLikeRecipeUseCase = new ToggleLikeRecipeUseCase(recipeRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────
// Các API đọc được tối ưu hóa hiệu năng bằng cách truy vấn trực tiếp thông qua
// tầng Service / Repository cũ (Mongoose populate thô), bỏ qua Mapping phức tạp.

// API lấy danh sách các công thức nấu ăn (hỗ trợ phân trang, tìm kiếm, độ khó, thẻ tag)
export async function getRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    // Gọi recipeService thực hiện tìm kiếm và lọc danh sách theo query params nhận được
    const result = await recipeService.list(req.query as any);
    // Trả về kết quả JSON cho Client
    return res.json(result);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// API lấy chi tiết một công thức món ăn theo ID (đồng thời tăng số lượt xem)
export async function getRecipeById(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID công thức từ tham số URL params
  const id = parseId(req.params.id);
  // Nếu ID công thức không hợp lệ, trả về mã trạng thái 400 kèm thông báo lỗi
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    // Gọi recipeService lấy thông tin chi tiết công thức và tự động tăng lượt xem
    const recipe = await recipeService.getById(id);
    // Trả về thông tin công thức dạng JSON cho Client
    return res.json(recipe);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────
// Các API ghi bắt buộc phải đi qua các DDD Use Cases và Domain Entities để 
// thực thi toàn bộ các quy tắc kiểm tra và đảm bảo tính toàn vẹn dữ liệu.

// API tạo mới một công thức nấu ăn
export async function createRecipe(req: Request, res: Response, next: NextFunction) {
  // Trích xuất mã ID người dùng hiện tại và quyền hạn vai trò từ token đã xác thực
  const { userId, role } = req.user;
  try {
    // Thực thi Use Case tạo mới công thức với ID tác giả, vai trò và dữ liệu body gửi lên
    const recipe = await createRecipeUseCase.execute(userId, role, req.body);
    // Phản hồi mã trạng thái 201 (Created) kèm thông điệp và thuộc tính công thức dạng thuần
    return res.status(201).json({
      // Câu thông báo thành công
      message: "Tạo công thức thành công",
      // Chuyển đổi thực thể miền sang đối tượng thuần để trả về client
      recipe: recipe.toProps(),
    });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// API Thích hoặc Bỏ thích một công thức nấu ăn
export async function toggleLikeRecipe(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID công thức từ tham số URL params
  const id = parseId(req.params.id);
  // Trích xuất ID người dùng thích công thức từ token
  const { userId } = req.user;
  // Nếu ID công thức không hợp lệ, phản hồi lỗi 400
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    // Thực thi Use Case thích/bỏ thích công thức
    const result = await toggleLikeRecipeUseCase.execute(id, userId);
    // Trả về kết quả JSON (trạng thái liked và số lượt thích hiện tại)
    return res.json(result);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// API cập nhật thông tin công thức nấu ăn
export async function updateRecipe(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID công thức cần cập nhật từ tham số URL params
  const id = parseId(req.params.id);
  // Trích xuất ID người dùng và vai trò hiện tại của tài khoản từ token
  const { userId, role } = req.user;
  // Nếu ID không hợp lệ, phản hồi lỗi 400
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    // Thực thi Use Case cập nhật công thức món ăn
    const recipe = await updateRecipeUseCase.execute(id, userId, role, req.body);
    // Trả về kết quả cập nhật thành công dạng JSON cho client
    return res.json({
      // Thông báo cập nhật thành công
      message: "Cập nhật công thức thành công",
      // Chuyển đổi thực thể sang đối tượng thuần
      recipe: recipe.toProps(),
    });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// API xóa một công thức nấu ăn khỏi hệ thống
export async function deleteRecipe(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID công thức cần xóa từ tham số URL
  const id = parseId(req.params.id);
  // Trích xuất ID người dùng và vai trò yêu cầu xóa từ token
  const { userId, role } = req.user;
  // Nếu ID không hợp lệ, trả về lỗi 400
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    // Thực thi Use Case xóa công thức nấu ăn
    await deleteRecipeUseCase.execute(id, userId, role);
    // Phản hồi thông điệp thông báo đã xóa công thức thành công
    return res.json({ message: "Xóa công thức thành công" });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}
