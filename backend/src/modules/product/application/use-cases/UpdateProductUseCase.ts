// Import interface IProductRepository để thực hiện các thao tác truy xuất dữ liệu sản phẩm ở tầng Domain
import { IProductRepository } from "../../domain/repositories/IProductRepository";
// Import đối tượng giá trị GPSCoordinates để đại diện cho tọa độ kinh độ và vĩ độ của sản phẩm
import { GPSCoordinates } from "../../domain/value-objects/GPSCoordinates";
// Import các ngoại lệ nghiệp vụ NotFoundError, UnauthorizedError, ValidationError để báo lỗi khi cập nhật thông tin
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../../shared/domain/exceptions/DomainException";
// Import cấu hình cloudinary để thực hiện dọn dẹp và xóa các hình ảnh thừa trên đám mây khi cập nhật
import { cloudinary } from "../../../../config/cloudinary";
// Import biến redis để kết nối và thực hiện thao tác xóa, cập nhật phiên bản cache
import { redis } from "../../../../config/redis";
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
import { logger } from "../../../../utils/logger";
// Import hàm extractPublicId dùng để trích xuất mã định danh hình ảnh trên Cloudinary từ đường dẫn URL
import { extractPublicId } from "../../../../utils/cloudinary";
// Import hàm updateUserBadges phục vụ cập nhật lại danh hiệu của người bán sau khi cập nhật sản phẩm
import { updateUserBadges } from "../../../../services/badge.service";

// Định nghĩa lớp nghiệp vụ UpdateProductUseCase dùng để xử lý logic cập nhật sản phẩm
export class UpdateProductUseCase {
  // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
  constructor(private productRepository: IProductRepository) {}

  // Phương thức thực thi nghiệp vụ cập nhật thông tin sản phẩm
  async execute(id: string, userId: string, role: string, body: any): Promise<void> {
    // Tìm kiếm thông tin sản phẩm cần cập nhật từ Repository theo ID sản phẩm
    const product = await this.productRepository.findById(id);
    // Nếu không tồn tại sản phẩm, ném lỗi NotFoundError
    if (!product) throw new NotFoundError("Không tìm thấy sản phẩm");

    // Kiểm tra quyền: Nếu người thực hiện không phải Admin và cũng không phải chủ sở hữu sản phẩm này
    if (role !== "Admin" && product.sellerId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền chỉnh sửa bài đăng
      throw new UnauthorizedError("Bạn không có quyền chỉnh sửa bài đăng này");
    }

    // 1. Kiểm tra vị trí GPS khi cập nhật
    // Xác định phân loại sản phẩm mục tiêu (giữ nguyên loại cũ nếu không có giá trị cập nhật mới)
    const targetType = body.type !== undefined ? body.type : product.type;
    // Xác định vĩ độ GPS mục tiêu của sản phẩm
    const targetLat = body.lat !== undefined ? body.lat : (product.location ? product.location.latitude : undefined);
    // Xác định kinh độ GPS mục tiêu của sản phẩm
    const targetLng = body.lng !== undefined ? body.lng : (product.location ? product.location.longitude : undefined);

    // Khai báo biến lưu đối tượng tọa độ GPS hiện tại/kho của sản phẩm
    let location: GPSCoordinates | undefined;
    // Nếu sản phẩm mục tiêu thuộc loại hải sản tươi sống (Fresh)
    if (targetType === "Fresh") {
      // Yêu cầu bắt buộc phải có đầy đủ vĩ độ và kinh độ GPS
      if (targetLat == null || targetLng == null) {
        // Ném lỗi xác thực nếu thiếu tọa độ GPS cho sản phẩm tươi sống
        throw new ValidationError("Tọa độ GPS vị trí mẻ hàng là bắt buộc đối với hải sản tươi sống!");
      }
      // Khởi tạo đối tượng GPSCoordinates từ vĩ độ và kinh độ đích đã được ép kiểu số thực
      location = GPSCoordinates.create(parseFloat(targetLat), parseFloat(targetLng));
    } else {
      // Nếu sản phẩm là đồ khô, chỉ khởi tạo tọa độ GPS khi có đầy đủ kinh vĩ độ truyền vào
      if (targetLat != null && targetLng != null) {
        // Khởi tạo đối tượng GPSCoordinates cho sản phẩm đồ khô
        location = GPSCoordinates.create(parseFloat(targetLat), parseFloat(targetLng));
      }
    }

    // Khai báo biến lưu đối tượng tọa độ GPS nơi đánh bắt hải sản
    let catchLocation: GPSCoordinates | undefined;
    // Xác định vĩ độ nơi đánh bắt mục tiêu của sản phẩm
    const targetCatchLat = body.catchLat !== undefined ? body.catchLat : (product.catchLocation ? product.catchLocation.latitude : undefined);
    // Xác định kinh độ nơi đánh bắt mục tiêu của sản phẩm
    const targetCatchLng = body.catchLng !== undefined ? body.catchLng : (product.catchLocation ? product.catchLocation.longitude : undefined);
    // Nếu có đầy đủ vĩ độ và kinh độ đánh bắt mục tiêu
    if (targetCatchLat != null && targetCatchLng != null) {
      // Khởi tạo đối tượng GPSCoordinates đại diện cho địa điểm đánh bắt
      catchLocation = GPSCoordinates.create(parseFloat(targetCatchLat), parseFloat(targetCatchLng));
    }

    // 2. Cập nhật cân nặng
    // Xác định tổng khối lượng mới (ép kiểu sang số thực), nếu không truyền thì giữ nguyên tổng khối lượng cũ
    const finalTotalWeight = body.totalWeight !== undefined ? parseFloat(body.totalWeight) : product.totalWeight;
    // Xác định khối lượng còn lại mới (ép kiểu sang số thực), nếu không truyền thì giữ nguyên khối lượng còn lại cũ
    const finalRemainingWeight = body.remainingWeight !== undefined ? parseFloat(body.remainingWeight) : product.remainingWeight;
    // Gọi phương thức nghiệp vụ của Domain để cập nhật thông số khối lượng
    product.updateWeight(finalTotalWeight, finalRemainingWeight);

    // 3. Cập nhật giá bán
    // Nếu có dữ liệu giá bán mới truyền lên
    if (body.price !== undefined) {
      // Ép kiểu giá bán mới sang kiểu số nguyên cơ số 10
      const parsedPrice = parseInt(body.price, 10);
      // Gọi phương thức nghiệp vụ của Domain để cập nhật giá bán sản phẩm
      product.updatePrice(parsedPrice);
    }

    // 4. Giải phóng ảnh thừa trên Cloudinary nếu danh sách ảnh thay đổi
    // Khởi tạo biến lưu danh sách hình ảnh cuối cùng của sản phẩm
    let finalImages = product.images;
    // Nếu client gửi lên danh sách hình ảnh mới dạng mảng
    if (body.images !== undefined && Array.isArray(body.images)) {
      // Tìm ra các hình ảnh cũ bị xóa bỏ (có trong danh sách ảnh cũ nhưng không có trong danh sách ảnh mới cập nhật)
      const removedImages = (product.images || []).filter((img) => !body.images.includes(img));
      // Nếu tồn tại hình ảnh bị loại bỏ
      if (removedImages.length > 0) {
        // Trích xuất public ID của những hình ảnh cũ bị xóa bỏ đó từ URL Cloudinary
        const removedPublicIds = removedImages.map(extractPublicId).filter((id): id is string => !!id);
        // Nếu danh sách public ID cần xóa không rỗng
        if (removedPublicIds.length > 0) {
          // Gửi yêu cầu xóa các file hình ảnh cũ đó trên Cloudinary một cách bất đồng bộ
          cloudinary.api.delete_resources(removedPublicIds).catch((err: any) => {
            // Ghi nhật ký lỗi nếu tiến trình dọn dẹp ảnh cũ trên Cloudinary bị lỗi
            logger.error(`Cloudinary cleanup failed during update: ${err.message}`);
          });
        }
      }
      // Gán danh sách ảnh mới cập nhật làm ảnh cuối cùng của sản phẩm
      finalImages = body.images;
    }

    // 5. Cập nhật thông tin khác của sản phẩm
    product.updateProfile(
      // Cập nhật tên sản phẩm nếu có truyền, ngược lại giữ nguyên tên cũ
      body.name !== undefined ? body.name : product.name,
      // Cập nhật mô tả chi tiết, thực hiện xóa thẻ HTML chống XSS và cắt tối đa 2000 ký tự nếu có truyền
      body.description !== undefined
        ? body.description.trim().replace(/<[^>]*>/g, "").slice(0, 2000)
        : product.description,
      // Cập nhật danh mục sản phẩm nếu có truyền
      body.category !== undefined ? body.category : product.category,
      // Cập nhật hình thức bán hàng (sỉ/lẻ) nếu có truyền
      body.salesType !== undefined ? body.salesType : product.salesType,
      // Cập nhật loại sản phẩm mục tiêu (Fresh hoặc Dried)
      targetType,
      // Cập nhật vị trí GPS hiện tại của sản phẩm
      location,
      // Cập nhật tọa độ vị trí đánh bắt sản phẩm
      catchLocation,
      // Cập nhật thời điểm đánh bắt hải sản nếu có truyền
      body.catchTime !== undefined ? (body.catchTime ? new Date(body.catchTime) : undefined) : product.catchTime,
      // Cập nhật nguồn gốc xuất xứ của sản phẩm nếu có truyền
      body.origin !== undefined ? body.origin : product.origin,
      // Cập nhật hạn sử dụng của sản phẩm nếu có truyền
      body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : undefined) : product.expiryDate,
      // Gán danh sách hình ảnh cuối cùng sau xử lý
      finalImages,
      // Cập nhật kích thước hải sản
      body.productSize !== undefined ? body.productSize : product.productSize
    );

    // Nếu client có truyền trạng thái mới của sản phẩm lên
    if (body.status !== undefined) {
      // Cập nhật trạng thái sản phẩm vào props của thực thể sản phẩm
      product.props.status = body.status;
    }

    // Thực hiện lưu trữ thông tin sản phẩm đã cập nhật vào DB thông qua Repository
    await this.productRepository.save(product);

    // 6. Cập nhật danh hiệu người dùng
    // Tính toán lại danh hiệu của người bán bất đồng bộ trong background
    updateUserBadges(product.sellerId).catch((err) => {
      // Ghi nhật ký lỗi nếu cập nhật danh hiệu gặp sự cố
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${product.sellerId}: ${err.message}`);
    });

    // 7. Xóa cache Redis
    // Xóa cache chi tiết sản phẩm trên Redis để lần sau client truy vấn lấy dữ liệu mới đã cập nhật
    await redis.del(`product:detail:${id}`).catch(() => {});
    // Tăng phiên bản cache danh sách sản phẩm trên Redis dựa theo loại sản phẩm để buộc client tải lại danh sách mới
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}

