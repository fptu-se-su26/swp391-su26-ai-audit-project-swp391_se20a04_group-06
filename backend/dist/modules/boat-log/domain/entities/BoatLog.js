"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoatLog = void 0;
// Import lớp cha AggregateRoot để quản lý thực thể gốc trong thiết kế miền Domain
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
// Import ngoại lệ xác thực dữ liệu ValidationError để báo lỗi khi nội dung nhật ký trống
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Định nghĩa thực thể Aggregate Root đại diện cho BoatLog trong Domain
class BoatLog extends AggregateRoot_1.AggregateRoot {
    // Hàm khởi tạo nhận vào các thuộc tính props và mã định danh id tùy chọn
    constructor(props, id) {
        // Gọi hàm khởi tạo của lớp cha AggregateRoot để gán thuộc tính và thiết lập ID
        super(props, id);
        // Tự động kiểm tra tính hợp lệ của dữ liệu ngay khi tạo thực thể mới
        this.validate();
    }
    // Phương thức kiểm định tính toàn vẹn nghiệp vụ của nhật ký cabin
    validate() {
        // Kiểm tra xem nội dung nhật ký có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
        if (!this.props.content || this.props.content.trim() === "") {
            // Ném lỗi xác thực nghiệp vụ nếu nội dung nhật ký trống
            throw new DomainException_1.ValidationError("Nội dung nhật ký cabin không được trống.");
        }
    }
    // Nghiệp vụ bật/tắt yêu thích (Like/Unlike) nhật ký cabin cho một người dùng
    toggleLike(userId) {
        // Tìm kiếm vị trí ID người dùng trong danh sách đã thích likes
        const index = this.props.likes.indexOf(userId);
        // Nếu người dùng chưa từng thích bài viết nhật ký cabin này trước đó
        if (index === -1) {
            // Thêm ID người dùng vào danh sách những người thích
            this.props.likes.push(userId);
            // Trả về true biểu thị đã thích nhật ký thành công
            return true;
        }
        else {
            // Nếu đã thích rồi thì xóa ID người dùng ra khỏi danh sách thích
            this.props.likes.splice(index, 1);
            // Trả về false biểu thị đã hủy thích nhật ký thành công
            return false;
        }
    }
    // Chuyển đổi thực thể Domain BoatLog thành đối tượng thuần Plain Object kèm ID
    toProps() {
        // Trả về cấu trúc đối tượng chứa dữ liệu thuần phục vụ cho lưu trữ hoặc truyền tải
        return {
            // Mã ID duy nhất của nhật ký cabin
            id: this.id,
            // Mã người viết nhật ký
            userId: this.props.userId,
            // Tên hiển thị người viết
            userName: this.props.userName,
            // Ảnh đại diện người viết
            userAvatar: this.props.userAvatar,
            // Nội dung nhật ký
            content: this.props.content,
            // Danh sách mảng ảnh đính kèm
            images: this.props.images,
            // Danh sách ID người dùng thích bài đăng
            likes: this.props.likes,
            batchId: this.props.batchId,
            boatName: this.props.boatName,
            catchArea: this.props.catchArea,
            landingTime: this.props.landingTime,
            origin: this.props.origin,
        };
    }
    update(content, images, details = {}) {
        if (!content || content.trim() === "") {
            throw new DomainException_1.ValidationError("Nội dung nhật ký cabin không được trống.");
        }
        this.props.content = content;
        this.props.images = images;
        this.props.boatName = details.boatName;
        this.props.catchArea = details.catchArea;
        this.props.landingTime = details.landingTime;
        this.props.origin = details.origin;
    }
    // Getter để truy xuất nhanh mã người dùng tạo nhật ký cabin
    get userId() { return this.props.userId; }
    get content() { return this.props.content; }
    get images() { return this.props.images; }
    // Getter để truy xuất nhanh danh sách ID những người thích nhật ký cabin
    get likes() { return this.props.likes; }
    get batchId() { return this.props.batchId; }
    get boatName() { return this.props.boatName; }
    get catchArea() { return this.props.catchArea; }
    get landingTime() { return this.props.landingTime; }
    get origin() { return this.props.origin; }
}
exports.BoatLog = BoatLog;
