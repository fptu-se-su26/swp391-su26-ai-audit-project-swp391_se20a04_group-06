"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BumpProductUseCase = void 0;
// Import ngoại lệ NotFoundError để ném ra khi sản phẩm không tồn tại
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import biến redis để kết nối và thực hiện thao tác xóa, tăng phiên bản cache
const redis_1 = require("../../../../config/redis");
// Định nghĩa lớp nghiệp vụ BumpProductUseCase (Đẩy bài sản phẩm)
class BumpProductUseCase {
    // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    // Phương thức thực thi nghiệp vụ đẩy bài viết sản phẩm với productId và userId tương ứng
    async execute(productId, userId) {
        // Truy vấn thông tin sản phẩm từ Repository theo ID sản phẩm
        const product = await this.productRepository.findById(productId);
        // Kiểm tra xem sản phẩm có tồn tại hay không
        if (!product) {
            // Ném lỗi NotFoundError nếu không tìm thấy sản phẩm
            throw new DomainException_1.NotFoundError("Không tìm thấy sản phẩm");
        }
        // Thực hiện gọi phương thức nghiệp vụ đẩy bài viết trong thực thể domain của sản phẩm
        product.bump(userId);
        // Lưu lại trạng thái sản phẩm đã được đẩy bài viết vào database
        await this.productRepository.save(product);
        // Gửi lệnh xóa cache chi tiết sản phẩm trên Redis để lần sau client truy vấn dữ liệu mới và bắt lỗi nếu xảy ra sự cố Redis
        await redis_1.redis.del(`product:detail:${productId}`).catch(() => { });
        // Tăng phiên bản cache danh sách sản phẩm trên Redis dựa trên loại sản phẩm (ví dụ: Fresh, Dried) để buộc client tải lại danh sách mới
        await redis_1.redis.incr(`product:list:version:${product.type}`).catch(() => { });
    }
}
exports.BumpProductUseCase = BumpProductUseCase;
