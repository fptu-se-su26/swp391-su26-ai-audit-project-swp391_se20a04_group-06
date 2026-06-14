// Import interface IProductRepository quản lý lưu trữ và thao tác dữ liệu sản phẩm ở tầng Domain
import { IProductRepository } from "../../domain/repositories/IProductRepository";
// Import lớp thực thể Product đại diện cho đối tượng sản phẩm ở tầng Domain
import { Product } from "../../domain/entities/Product";
// Import đối tượng giá trị GPSCoordinates dùng để quản lý vĩ độ và kinh độ của sản phẩm
import { GPSCoordinates } from "../../domain/value-objects/GPSCoordinates";
// Import các ngoại lệ nghiệp vụ ValidationError và ConflictError để báo lỗi khi dữ liệu hoặc trạng thái không hợp lý
import { ValidationError, ConflictError } from "../../../../shared/domain/exceptions/DomainException";
// Import đối tượng redis kết nối tới Redis phục vụ tính năng lưu cache và đếm lượt đăng bài giới hạn trong ngày
import { redis } from "../../../../config/redis";
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
import { logger } from "../../../../utils/logger";
// Import repository của người dùng để kiểm tra thông tin và quyền của người dùng đăng bán
import { userRepository } from "../../../../repositories/user.repository";
// Import hàm cập nhật danh hiệu người dùng sau khi hoàn thành hành vi (đăng sản phẩm)
import { updateUserBadges } from "../../../../services/badge.service";
// Import hàm gửi thông báo cho những người dùng đang theo dõi khi chủ cửa hàng đăng sản phẩm mới
import { notifyFollowersNewProduct } from "../../../../services/notification.service";

// Định nghĩa lớp nghiệp vụ CreateProductUseCase dùng để xử lý logic khi người dùng đăng bán sản phẩm mới
export class CreateProductUseCase {
  // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
  constructor(private productRepository: IProductRepository) {}

  // Phương thức thực thi logic đăng bán sản phẩm
  async execute(userId: string, body: any) {
    // Giải nén các trường thông tin sản phẩm được gửi lên từ phía Client
    const {
      type,            // Loại sản phẩm ("Fresh" - Tươi sống hoặc "Dried" - Đồ khô)
      category,        // Danh mục sản phẩm (cá, tôm, cua...)
      name,            // Tên của sản phẩm đăng bán
      description,     // Mô tả thông tin chi tiết sản phẩm
      price,           // Giá bán của sản phẩm
      salesType,       // Phương thức bán hàng ("Retail" - Bán lẻ hoặc "Wholesale" - Bán sỉ)
      totalWeight,     // Tổng khối lượng sản phẩm đăng bán
      catchTime,       // Thời điểm đánh bắt hải sản (đối với đồ tươi sống)
      lat,             // Vĩ độ GPS vị trí hiện tại/kho của sản phẩm
      lng,             // Kinh độ GPS vị trí hiện tại/kho của sản phẩm
      origin,          // Nguồn gốc xuất xứ của sản phẩm
      expiryDate,      // Hạn sử dụng của sản phẩm
      images,          // Danh sách hình ảnh sản phẩm
      catchLat,        // Vĩ độ GPS địa điểm đánh bắt hải sản ngoài biển
      catchLng,        // Kinh độ GPS địa điểm đánh bắt hải sản ngoài biển
    } = body;

    // 1. Kiểm tra vị trí GPS nếu là hàng tươi sống
    // Khai báo biến lưu đối tượng tọa độ GPS hiện tại của sản phẩm
    let location: GPSCoordinates | undefined;
    // Nếu sản phẩm thuộc nhóm hải sản tươi sống (Fresh)
    if (type === "Fresh") {
      // Bắt buộc phải cung cấp cả vĩ độ (lat) và kinh độ (lng)
      if (lat == null || lng == null) {
        // Ném lỗi xác thực nếu thiếu thông tin tọa độ GPS
        throw new ValidationError("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
      }
      // Khởi tạo đối tượng GPSCoordinates từ giá trị vĩ độ và kinh độ được ép sang kiểu số thực
      location = GPSCoordinates.create(parseFloat(lat), parseFloat(lng));
    } else {
      // Đối với sản phẩm đồ khô (Dried), nếu client có gửi tọa độ GPS lên thì vẫn tiếp nhận
      if (lat != null && lng != null) {
        // Khởi tạo đối tượng GPSCoordinates từ vĩ độ và kinh độ của sản phẩm đồ khô
        location = GPSCoordinates.create(parseFloat(lat), parseFloat(lng));
      }
    }

    // Khai báo biến lưu đối tượng tọa độ GPS nơi đánh bắt hải sản
    let catchLocation: GPSCoordinates | undefined;
    // Kiểm tra xem client có gửi tọa độ GPS nơi đánh bắt lên hay không
    if (catchLat != null && catchLng != null) {
      // Khởi tạo đối tượng GPSCoordinates từ tọa độ nơi đánh bắt hải sản
      catchLocation = GPSCoordinates.create(parseFloat(catchLat), parseFloat(catchLng));
    }

    // 2. Kiểm tra giới hạn đăng tin qua Redis của tài khoản thường
    // Truy vấn thông tin người dùng từ cơ sở dữ liệu để kiểm tra trạng thái và gói tài khoản
    const user = await userRepository.findById(userId);
    // Nếu không tìm thấy người dùng đăng sản phẩm, ném lỗi xác thực
    if (!user) throw new ValidationError("Không tìm thấy người dùng");

    // Tính toán ngày hiện tại theo múi giờ Việt Nam (UTC+7) để lập khóa đếm giới hạn đăng bài theo ngày
    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    // Tạo chuỗi định dạng ngày YYYY-MM-DD dựa trên thời gian Việt Nam
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    // Tạo khóa lưu trữ số lần đăng bài của người dùng trong ngày trên Redis
    const limitKey = `product:limit:${userId}:${dateKey}`;

    // Nếu người dùng không phải tài khoản Premium và không phải Admin (là tài khoản thường)
    if (!user.isPremium && user.role !== "Admin") {
      // Tăng bộ đếm lượt đăng bài của user trong ngày trên Redis thêm 1 đơn vị
      const currentCount = await redis.incr(limitKey);
      // Nếu đây là lượt đăng bài đầu tiên trong ngày
      if (currentCount === 1) {
        // Thiết lập thời gian sống cho khóa trên Redis là 24 giờ (86400 giây) để tự động reset vào ngày hôm sau
        await redis.expire(limitKey, 24 * 3600);
      }

      // Nếu số lượng bài đăng trong ngày của tài khoản thường vượt quá 5 bài viết
      if (currentCount > 5) {
        // Giảm lại bộ đếm vừa tăng trên Redis để giữ đúng trạng thái đếm lỗi
        await redis.decr(limitKey);
        // Ném lỗi xung đột thông báo vượt hạn mức đăng tin và gợi ý nâng cấp Premium
        throw new ConflictError(
          "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!"
        );
      }
    }

    // 3. Chuẩn hóa dữ liệu đầu vào
    // Làm sạch nội dung mô tả sản phẩm bằng cách loại bỏ các thẻ HTML để phòng chống tấn công XSS
    const cleanDesc = description
      ? description
          .trim() // Xóa bỏ khoảng trắng ở hai đầu
          .replace(/<[^>]*>/g, "") // Regular Expression xóa bỏ tất cả các thẻ HTML
          .slice(0, 2000) // Giới hạn mô tả tối đa 2000 ký tự
      : "";

    // Thực hiện ép kiểu giá bán sang kiểu số
    const parsedPrice = typeof price === "number" ? price : parseInt(price, 10);
    // Thực hiện ép kiểu tổng khối lượng sang kiểu số thực
    const parsedWeight = typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight);

    // Kiểm tra xem giá bán hoặc khối lượng sau khi ép kiểu có bị lỗi NaN hay không
    if (isNaN(parsedPrice) || isNaN(parsedWeight)) {
      // Nếu ép kiểu thất bại và tài khoản thuộc diện bị giới hạn đăng bài
      if (!user.isPremium && user.role !== "Admin") {
        // Giảm lại số lần đếm đăng bài trên Redis vì bài viết đăng bị lỗi không thành công
        await redis.decr(limitKey);
      }
      // Ném lỗi xác thực thông báo giá cả hoặc khối lượng không hợp lệ
      throw new ValidationError("Thông tin giá cả hoặc khối lượng không hợp lệ");
    }

    // Khởi tạo thực thể Product mới từ dữ liệu đã qua tiền xử lý và chuẩn hóa
    const product = new Product({
      sellerId: userId,                        // Gán mã người bán
      type,                                    // Gán phân loại sản phẩm
      category,                                // Gán danh mục
      name: name.trim(),                       // Gán tên sản phẩm đã được cắt bỏ khoảng trắng hai đầu
      description: cleanDesc,                  // Gán mô tả sạch
      price: parsedPrice,                      // Gán giá bán hợp lệ
      salesType: salesType ?? "Retail",        // Gán hình thức bán hàng (mặc định là bán lẻ nếu thiếu)
      totalWeight: parsedWeight,               // Gán tổng khối lượng ban đầu
      remainingWeight: parsedWeight,           // Gán khối lượng còn lại bằng tổng khối lượng ban đầu
      status: "Active",                        // Trạng thái mặc định khi tạo mới sản phẩm là đang hoạt động
      location,                                // Gán tọa độ GPS của sản phẩm
      catchLocation,                           // Gán tọa độ nơi đánh bắt
      catchTime: catchTime ? new Date(catchTime) : undefined, // Gán thời gian đánh bắt nếu có
      origin,                                  // Gán nguồn gốc xuất xứ
      expiryDate: expiryDate ? new Date(expiryDate) : undefined, // Gán hạn sử dụng nếu có
      images: Array.isArray(images) ? images : [], // Gán danh sách ảnh (mặc định là mảng rỗng nếu không phải mảng)
    });

    try {
      // Thực hiện lưu trữ thông tin sản phẩm mới vào DB thông qua Repository
      await this.productRepository.save(product);
    } catch (saveErr) {
      // Nếu xảy ra lỗi trong quá trình lưu trữ vào DB và tài khoản thuộc diện bị giới hạn đăng bài
      if (!user.isPremium && user.role !== "Admin") {
        // Hoàn tác lại bộ đếm đăng bài trên Redis
        await redis.decr(limitKey);
      }
      // Tiếp tục ném lỗi ngoại lệ lưu trữ để controller xử lý tiếp
      throw saveErr;
    }

    // 4. Kích hoạt cập nhật danh hiệu & gửi thông báo bất đồng bộ (Background Tasks)
    // Thực hiện cập nhật các danh hiệu (badges) đạt được của người dùng mà không chặn tiến trình phản hồi của Client
    updateUserBadges(userId).catch((err) => {
      // Ghi nhật ký lỗi nếu việc cập nhật danh hiệu gặp sự cố
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${userId}: ${err.message}`);
    });

    // Tăng phiên bản cache của danh sách sản phẩm trên Redis theo phân loại tương ứng để buộc client tải lại danh sách mới
    await redis.incr(`product:list:version:${type}`).catch(() => {});

    // Gửi thông báo đến những người dùng đang theo dõi (followers) về việc có sản phẩm mới
    notifyFollowersNewProduct(
      userId,              // ID của người bán
      user.name,           // Tên của người bán
      product.id,          // ID sản phẩm vừa tạo
      product.name         // Tên sản phẩm vừa tạo
    ).catch((err) => logger.error(`[Notify] notifyFollowersNewProduct failed: ${err.message}`)); // Ghi nhật ký lỗi nếu gửi thông báo thất bại

    // Trả về ID của sản phẩm vừa tạo thành công cho phía client
    return { productId: product.id };
  }
}

