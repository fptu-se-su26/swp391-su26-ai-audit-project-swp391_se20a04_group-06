"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
// Import lớp cha AggregateRoot để quản lý vòng đời và các sự kiện miền (Domain Events) của Product
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
// Import các lớp ngoại lệ nghiệp vụ ValidationError và ConflictError để ném ra khi dữ liệu hoặc trạng thái không hợp lệ
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Định nghĩa thực thể gốc AggregateRoot đại diện cho Product trong miền (Domain)
class Product extends AggregateRoot_1.AggregateRoot {
    // Hàm khởi tạo nhận vào các thuộc tính props và mã định danh id (nếu có)
    constructor(props, id) {
        // Gọi hàm khởi tạo của lớp cha AggregateRoot để thiết lập các giá trị mặc định nếu thiếu và gán ID
        super({
            // Giải nén các thuộc tính ban đầu được truyền vào
            ...props,
            priceHistory: props.priceHistory?.length
                ? props.priceHistory
                : [{ price: props.price, changedAt: props.createdAt || new Date() }],
            // Thiết lập thời gian đẩy bài mặc định là thời gian hiện tại nếu chưa được cung cấp
            bumpedAt: props.bumpedAt || new Date(),
            // Thiết lập thời gian tạo mặc định là thời gian hiện tại nếu chưa được cung cấp
            createdAt: props.createdAt || new Date(),
            // Thiết lập lượt xem ban đầu mặc định là 0 nếu chưa được cung cấp
            viewCount: props.viewCount || 0,
        }, id);
        // Thực thi hàm kiểm định dữ liệu thực thể ngay khi tạo mới hoặc tái tạo đối tượng
        this.validate();
    }
    // Phương thức kiểm tra tính toàn vẹn và hợp lệ của dữ liệu thực thể (Domain Invariant Verification)
    validate() {
        // Kiểm tra xem tên sản phẩm có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
        if (!this.props.name || this.props.name.trim() === "") {
            // Ném lỗi xác thực nếu tên sản phẩm không hợp lệ
            throw new DomainException_1.ValidationError("Tên sản phẩm không được trống.");
        }
        // Kiểm tra xem giá bán của sản phẩm có nhỏ hơn 0 hay không
        if (this.props.price < 0) {
            // Ném lỗi xác thực nếu giá bán nhỏ hơn 0
            throw new DomainException_1.ValidationError("Giá bán không thể nhỏ hơn 0.");
        }
        // Kiểm tra xem tổng khối lượng sản phẩm có nhỏ hơn hoặc bằng 0 hay không
        if (this.props.totalWeight <= 0) {
            // Ném lỗi xác thực nếu tổng khối lượng không lớn hơn 0
            throw new DomainException_1.ValidationError("Khối lượng tổng phải lớn hơn 0.");
        }
        // Kiểm tra xem khối lượng còn lại của sản phẩm có nhỏ hơn 0 hay không
        if (this.props.remainingWeight < 0) {
            // Ném lỗi xác thực nếu khối lượng còn lại nhỏ hơn 0
            throw new DomainException_1.ValidationError("Khối lượng còn lại không thể nhỏ hơn 0.");
        }
        // Kiểm tra xem khối lượng còn lại có vượt quá tổng khối lượng ban đầu hay không
        if (this.props.remainingWeight > this.props.totalWeight) {
            // Ném lỗi xác thực nếu khối lượng còn lại lớn hơn tổng khối lượng
            throw new DomainException_1.ValidationError("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
        }
        // Đối với hải sản tươi sống (Fresh), bắt buộc phải cung cấp tọa độ vị trí hiện tại (location)
        if (this.props.type === "Fresh" && !this.props.location) {
            // Ném lỗi xác thực nếu thiếu tọa độ vị trí GPS cho sản phẩm tươi sống
            throw new DomainException_1.ValidationError("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
        }
    }
    // Phương thức cập nhật giá bán mới của sản phẩm
    updatePrice(newPrice) {
        // Kiểm tra xem giá bán mới có nhỏ hơn 0 hay không
        if (newPrice < 0) {
            // Ném lỗi xác thực nếu giá bán mới không hợp lệ
            throw new DomainException_1.ValidationError("Giá bán không thể nhỏ hơn 0.");
        }
        // Cập nhật giá bán mới vào thuộc tính props
        if (newPrice !== this.props.price) {
            this.props.price = newPrice;
            this.props.priceHistory = [
                ...(this.props.priceHistory || []),
                { price: newPrice, changedAt: new Date() },
            ].slice(-50);
        }
    }
    // Nghiệp vụ đẩy bài viết sản phẩm (Bump Product) lên đầu trang tìm kiếm
    bump(requestedByUserId) {
        // Kiểm tra xem người yêu cầu đẩy bài có đúng là chủ sở hữu (người bán) của sản phẩm này không
        if (this.props.sellerId !== requestedByUserId) {
            // Ném lỗi xung đột quyền hạn nếu người thực hiện không phải là người bán
            throw new DomainException_1.ConflictError("Bạn không có quyền đẩy bài đăng này");
        }
        // Thời gian giãn cách tối thiểu giữa 2 lần đẩy bài là 24 giờ (đổi ra mili-giây)
        const cooldownPeriodMs = 24 * 60 * 60 * 1000;
        // Khởi tạo đối tượng thời gian hiện tại
        const now = new Date();
        // Tính toán thời gian chênh lệch so với lần đẩy bài gần nhất để kiểm tra thời gian chờ (cooldown)
        if (now.getTime() - this.props.bumpedAt.getTime() < cooldownPeriodMs) {
            // Ném lỗi xung đột nếu sản phẩm vẫn đang trong thời gian chờ đẩy bài tiếp theo
            throw new DomainException_1.ConflictError("Sản phẩm này đã được đẩy lên gần đây. Vui lòng đẩy tin lại sau.");
        }
        // Cập nhật thời điểm đẩy bài viết gần nhất là thời điểm hiện tại
        this.props.bumpedAt = now;
    }
    // Phương thức cập nhật tổng khối lượng và khối lượng còn lại của sản phẩm
    updateWeight(totalWeight, remainingWeight) {
        // Kiểm tra xem khối lượng còn lại có vượt quá tổng khối lượng mới cập nhật hay không
        if (remainingWeight > totalWeight) {
            // Ném lỗi xác thực nếu thông số khối lượng bất hợp lý
            throw new DomainException_1.ValidationError("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
        }
        // Cập nhật giá trị tổng khối lượng mới vào thuộc tính props
        this.props.totalWeight = totalWeight;
        // Cập nhật giá trị khối lượng còn lại mới vào thuộc tính props
        this.props.remainingWeight = remainingWeight;
        // Thực hiện kiểm định lại toàn bộ thực thể sau khi thay đổi thông số khối lượng
        this.validate();
    }
    // Phương thức cập nhật thông tin hồ sơ chi tiết của sản phẩm
    updateProfile(name, description, category, salesType, type, location, catchLocation, catchTime, origin, expiryDate, images, productSize) {
        // Cập nhật tên sản phẩm và tự động loại bỏ khoảng trắng thừa ở hai đầu
        this.props.name = name.trim();
        // Cập nhật thông tin mô tả chi tiết mới của sản phẩm
        this.props.description = description;
        // Cập nhật danh mục phân loại mới của sản phẩm
        this.props.category = category;
        // Cập nhật hình thức bán hàng mới (bán sỉ/bán lẻ)
        this.props.salesType = salesType;
        // Cập nhật phân loại sản phẩm mới (tươi sống/đồ khô)
        this.props.type = type;
        // Cập nhật tọa độ vị trí hiện tại/kho của sản phẩm
        this.props.location = location;
        // Cập nhật tọa độ vị trí đánh bắt sản phẩm
        this.props.catchLocation = catchLocation;
        // Cập nhật mốc thời gian đánh bắt hải sản ngoài biển
        this.props.catchTime = catchTime;
        // Cập nhật thông tin nơi xuất xứ/nguồn gốc đánh bắt
        this.props.origin = origin;
        // Cập nhật thông tin hạn sử dụng mới cho sản phẩm
        this.props.expiryDate = expiryDate;
        // Kiểm tra xem danh sách hình ảnh mới truyền vào có tồn tại và hợp lệ hay không
        if (images !== undefined) {
            // Thay thế danh sách hình ảnh cũ bằng danh sách hình ảnh mới cập nhật
            this.props.images = images;
        }
        // Cập nhật kích thước hải sản
        this.props.productSize = productSize;
        // Kiểm tra tính hợp lệ toàn diện của thực thể sản phẩm sau khi cập nhật thông tin chi tiết
        this.validate();
    }
    // Phương thức tăng số lượt xem của sản phẩm lên 1 đơn vị
    incrementViews() {
        // Tăng giá trị viewCount hiện tại thêm 1 đơn vị
        this.props.viewCount = (this.props.viewCount || 0) + 1;
    }
    // Phương thức đánh dấu trạng thái sản phẩm là đã bị xóa (Soft Delete)
    markAsDeleted() {
        // Thay đổi thuộc tính status sang trạng thái Deleted để ẩn sản phẩm khỏi hệ thống mà không xóa khỏi DB
        this.props.status = "Deleted";
    }
    // Chuyển đổi thực thể Domain Product thành đối tượng thuần Plain Object (Props) kèm theo ID sản phẩm
    toProps() {
        // Trả về đối tượng thuần chứa tất cả thông tin dữ liệu của sản phẩm phục vụ lưu trữ hoặc mapping dữ liệu
        return {
            // Mã định danh duy nhất của sản phẩm
            id: this.id,
            // Mã định danh của người bán
            sellerId: this.props.sellerId,
            // Loại sản phẩm (tươi sống/đồ khô)
            type: this.props.type,
            // Danh mục phân loại sản phẩm
            category: this.props.category,
            // Tên sản phẩm
            name: this.props.name,
            // Mô tả chi tiết sản phẩm
            description: this.props.description,
            // Giá bán sản phẩm
            price: this.props.price,
            priceHistory: this.props.priceHistory,
            // Hình thức bán (sỉ/lẻ)
            salesType: this.props.salesType,
            // Tổng khối lượng mẻ hàng
            totalWeight: this.props.totalWeight,
            // Khối lượng hàng còn lại
            remainingWeight: this.props.remainingWeight,
            // Trạng thái bán sản phẩm
            status: this.props.status,
            // Vị trí GPS hiện tại của sản phẩm
            location: this.props.location,
            // Vị trí GPS nơi đánh bắt hải sản
            catchLocation: this.props.catchLocation,
            // Thời điểm đánh bắt hải sản
            catchTime: this.props.catchTime,
            // Nguồn gốc xuất xứ sản phẩm
            origin: this.props.origin,
            // Hạn sử dụng của sản phẩm
            expiryDate: this.props.expiryDate,
            // Danh sách đường dẫn hình ảnh sản phẩm
            images: this.props.images,
            // Kích thước của hải sản
            productSize: this.props.productSize,
            // Mốc thời gian đẩy bài gần nhất
            bumpedAt: this.props.bumpedAt,
            // Mốc thời gian đăng bán sản phẩm
            createdAt: this.props.createdAt,
            // Tổng số lượt xem sản phẩm
            viewCount: this.props.viewCount,
        };
    }
    // Getter để truy xuất nhanh mã định danh người bán
    get sellerId() { return this.props.sellerId; }
    // Getter để truy xuất loại sản phẩm (tươi sống hay đồ khô)
    get type() { return this.props.type; }
    // Getter để truy xuất danh mục phân loại sản phẩm
    get category() { return this.props.category; }
    // Getter để truy xuất tên sản phẩm
    get name() { return this.props.name; }
    // Getter để truy xuất thông tin mô tả sản phẩm
    get description() { return this.props.description; }
    // Getter để truy xuất giá bán sản phẩm
    get price() { return this.props.price; }
    // Getter để truy xuất hình thức bán (sỉ/lẻ)
    get salesType() { return this.props.salesType; }
    // Getter để truy xuất tổng khối lượng sản phẩm
    get totalWeight() { return this.props.totalWeight; }
    // Getter để truy xuất khối lượng sản phẩm còn lại
    get remainingWeight() { return this.props.remainingWeight; }
    // Getter để truy xuất trạng thái của sản phẩm
    get status() { return this.props.status; }
    // Getter để truy xuất vị trí GPS hiện tại của sản phẩm
    get location() { return this.props.location; }
    // Getter để truy xuất vị trí đánh bắt sản phẩm
    get catchLocation() { return this.props.catchLocation; }
    // Getter để truy xuất thời điểm đánh bắt sản phẩm
    get catchTime() { return this.props.catchTime; }
    // Getter để truy xuất nơi xuất xứ sản phẩm
    get origin() { return this.props.origin; }
    // Getter để truy xuất hạn sử dụng sản phẩm
    get expiryDate() { return this.props.expiryDate; }
    // Getter để truy xuất danh sách hình ảnh sản phẩm
    get images() { return this.props.images; }
    // Getter để truy xuất kích thước hải sản
    get productSize() { return this.props.productSize; }
    // Getter để truy xuất thời điểm đẩy bài viết sản phẩm
    get bumpedAt() { return this.props.bumpedAt; }
    // Getter để truy xuất ngày đăng bán sản phẩm
    get createdAt() { return this.props.createdAt; }
    // Getter để truy xuất lượt xem sản phẩm
    get viewCount() { return this.props.viewCount; }
}
exports.Product = Product;
