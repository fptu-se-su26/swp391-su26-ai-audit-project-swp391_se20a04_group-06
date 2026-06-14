// Import các đối tượng Request, Response, NextFunction từ Express để xử lý HTTP request/response và middleware
import { Request, Response, NextFunction } from "express";
// Import hàm parseId từ helper để định dạng và xác thực mã định danh truyền lên
import { parseId } from "../../../../helpers/response.helper";
// Import hàm paginatedResponse để định dạng chuẩn phản hồi dữ liệu có phân trang
import { paginatedResponse } from "../../../../utils/pagination";
// Import đối tượng productService quản lý các tác vụ truy vấn đọc dữ liệu sản phẩm
import { productService } from "../../../../services/product.service";

// DDD Components
// Import lớp MongooseProductRepository để tương tác trực tiếp với cơ sở dữ liệu MongoDB
import { MongooseProductRepository } from "../../infrastructure/persistence/mongoose/MongooseProductRepository";
// Import lớp CreateProductUseCase để thực hiện nghiệp vụ tạo mới sản phẩm
import { CreateProductUseCase } from "../../application/use-cases/CreateProductUseCase";
// Import lớp UpdateProductUseCase để thực hiện nghiệp vụ cập nhật thông tin sản phẩm
import { UpdateProductUseCase } from "../../application/use-cases/UpdateProductUseCase";
// Import lớp DeleteProductUseCase để thực hiện nghiệp vụ xóa sản phẩm
import { DeleteProductUseCase } from "../../application/use-cases/DeleteProductUseCase";
// Import lớp BumpProductUseCase để thực hiện nghiệp vụ đẩy bài viết sản phẩm
import { BumpProductUseCase } from "../../application/use-cases/BumpProductUseCase";

// Khởi tạo đối tượng Repository dùng chung cho các Use Cases
const productRepository = new MongooseProductRepository();
// Khởi tạo Use Case tạo mới sản phẩm, tiêm Repository vào qua Constructor
const createProductUseCase = new CreateProductUseCase(productRepository);
// Khởi tạo Use Case cập nhật sản phẩm, tiêm Repository vào qua Constructor
const updateProductUseCase = new UpdateProductUseCase(productRepository);
// Khởi tạo Use Case xóa sản phẩm, tiêm Repository vào qua Constructor
const deleteProductUseCase = new DeleteProductUseCase(productRepository);
// Khởi tạo Use Case đẩy bài viết sản phẩm, tiêm Repository vào qua Constructor
const bumpProductUseCase = new BumpProductUseCase(productRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────

// API lấy danh sách các sản phẩm (hỗ trợ tìm kiếm, lọc, phân trang)
export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    // Gọi productService thực hiện nghiệp vụ tìm kiếm và lọc danh sách sản phẩm theo query params
    const result = await productService.list(req.query as Record<string, string | undefined>);
    // Trả về kết quả dưới dạng dữ liệu JSON cho Client
    return res.json(result);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh sang middleware xử lý lỗi tiếp theo
    next(err);
  }
}

// API lấy thông tin chi tiết một sản phẩm theo ID
export async function getProductById(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID sản phẩm từ tham số URL params
  const id = parseId(req.params.id);
  // Nếu ID sản phẩm không hợp lệ, trả về mã trạng thái 400 kèm thông điệp báo lỗi
  if (!id) return res.status(400).json({ message: "ID mẻ hàng không hợp lệ" });
  try {
    // Gọi productService lấy thông tin chi tiết sản phẩm theo ID đã kiểm định
    const product = await productService.getById(id);
    // Trả về thông tin sản phẩm dạng JSON
    return res.json(product);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// API lấy danh sách sản phẩm do chính người dùng hiện tại đang đăng bán
export async function getMyProducts(req: Request, res: Response, next: NextFunction) {
  // Xác định tham số trang hiển thị từ query string (ép kiểu chuỗi hoặc undefined)
  const rawPage = typeof req.query.page === "string" ? req.query.page : undefined;
  // Xác định tham số giới hạn số lượng sản phẩm mỗi trang từ query string
  const rawLimit = typeof req.query.limit === "string" ? req.query.limit : undefined;

  try {
    // Gọi productService truy vấn danh sách sản phẩm của người dùng kèm tổng số lượng
    const { products, total, page, limit } = await productService.getProducts(
      req.user.userId,
      rawPage,
      rawLimit
    );
    // Định dạng dữ liệu trả về theo chuẩn phân trang và phản hồi dạng JSON
    return res.json(paginatedResponse(products, total, page, limit));
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// API lấy số lượng sản phẩm đã đăng bán trong ngày hôm nay của người dùng
export async function getTodayCount(req: Request, res: Response, next: NextFunction) {
  try {
    // Lấy mã định danh người dùng từ đối tượng request đã được xác thực
    const userId = req.user.userId;
    // Gọi productService truy vấn số lượng sản phẩm đã đăng hôm nay của người dùng đó
    const stats = await productService.getTodayCount(userId);
    // Trả về thống kê số lượng dạng JSON
    return res.json(stats);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────

// API đăng bán sản phẩm mới
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    // Thực thi Use Case tạo mới sản phẩm với userId của người đăng và dữ liệu từ body của request
    const result = await createProductUseCase.execute(req.user.userId, req.body);
    // Phản hồi mã trạng thái 201 (Created) kèm thông điệp thành công và ID sản phẩm mới tạo
    return res.status(201).json({ message: "Đăng bài thành công", ...result });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// API cập nhật thông tin sản phẩm hiện có
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID sản phẩm cần cập nhật từ tham số truyền trên URL
  const id = parseId(req.params.id);
  // Nếu ID sản phẩm không hợp lệ, trả về mã trạng thái 400 báo lỗi
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    // Thực thi Use Case cập nhật sản phẩm với ID sản phẩm, thông tin người dùng yêu cầu, quyền hạn và body dữ liệu mới
    await updateProductUseCase.execute(id, req.user.userId, req.user.role, req.body);
    // Phản hồi thông điệp cập nhật thành công cho Client
    return res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// API xóa bỏ sản phẩm đăng bán
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID sản phẩm cần xóa từ tham số URL
  const id = parseId(req.params.id);
  // Nếu ID sản phẩm không hợp lệ, trả về lỗi 400
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    // Thực thi Use Case xóa sản phẩm với ID sản phẩm, mã người yêu cầu xóa và quyền hạn hiện tại
    await deleteProductUseCase.execute(id, req.user.userId, req.user.role);
    // Phản hồi thông điệp thông báo đã xóa bài đăng thành công
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// API đẩy bài viết sản phẩm lên đầu trang
export async function bumpProduct(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID sản phẩm cần đẩy bài từ tham số URL
  const id = parseId(req.params.id);
  // Nếu ID sản phẩm không hợp lệ, trả về lỗi 400
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });
  try {
    // Thực thi Use Case đẩy bài với ID sản phẩm và mã người bán yêu cầu đẩy bài
    await bumpProductUseCase.execute(id, req.user.userId);
    // Phản hồi thông điệp đẩy bài đăng thành công
    return res.json({ message: "Đã đẩy tin thành công!" });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

