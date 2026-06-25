// Import interface IProductRepository để thực hiện các thao tác dữ liệu với sản phẩm ở tầng Domain
import { IProductRepository } from "../../domain/repositories/IProductRepository";
// Import ngoại lệ NotFoundError để ném ra khi sản phẩm không tồn tại
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
// Import biến redis để kết nối và thực hiện thao tác xóa, tăng phiên bản cache
import { redis } from "../../../../config/redis";

// Định nghĩa lớp nghiệp vụ BumpProductUseCase (Đẩy bài sản phẩm)
export class BumpProductUseCase {
  // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
  constructor(private productRepository: IProductRepository) {}

  // Phương thức thực thi nghiệp vụ đẩy bài viết sản phẩm với productId và userId tương ứng
  async execute(productId: string, userId: string): Promise<void> {
    // Truy vấn thông tin sản phẩm từ Repository theo ID sản phẩm
    const product = await this.productRepository.findById(productId);
    // Kiểm tra xem sản phẩm có tồn tại hay không
    if (!product) {
      // Ném lỗi NotFoundError nếu không tìm thấy sản phẩm
      throw new NotFoundError("Không tìm thấy sản phẩm");
    }

    // Thực hiện gọi phương thức nghiệp vụ đẩy bài viết trong thực thể domain của sản phẩm
    product.bump(userId);
    // Lưu lại trạng thái sản phẩm đã được đẩy bài viết vào database
    await this.productRepository.save(product);

    // Gửi lệnh xóa cache chi tiết sản phẩm trên Redis để lần sau client truy vấn dữ liệu mới và bắt lỗi nếu xảy ra sự cố Redis
    await redis.del(`product:detail:${productId}`).catch(() => {});
    // Tăng phiên bản cache danh sách sản phẩm trên Redis dựa trên loại sản phẩm (ví dụ: Fresh, Dried) để buộc client tải lại danh sách mới
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}

