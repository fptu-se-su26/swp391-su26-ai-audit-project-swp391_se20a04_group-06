// Import lớp cha AggregateRoot để quản lý thực thể gốc trong thiết kế miền Domain
import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
// Import ngoại lệ xác thực dữ liệu ValidationError để báo lỗi khi nội dung nhật ký trống
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

// Định nghĩa giao diện BoatLogProps chứa các thuộc tính nghiệp vụ của nhật ký cabin
export interface BoatLogProps {
  // Mã ID của người dùng (ngư dân hoặc quản trị viên) viết nhật ký
  userId: string;
  // Tên hiển thị của người viết nhật ký cabin
  userName: string;
  // Đường dẫn ảnh đại diện của người viết nhật ký (có thể là null)
  userAvatar: string | null;
  // Nội dung chi tiết của bài đăng nhật ký cabin
  content: string;
  // Mảng chứa các đường dẫn hình ảnh đính kèm bài nhật ký
  images: string[];
  // Mảng chứa danh sách ID của những người dùng đã thích nhật ký này
  likes: string[];
}

// Định nghĩa thực thể Aggregate Root đại diện cho BoatLog trong Domain
export class BoatLog extends AggregateRoot<BoatLogProps> {
  // Hàm khởi tạo nhận vào các thuộc tính props và mã định danh id tùy chọn
  constructor(props: BoatLogProps, id?: string) {
    // Gọi hàm khởi tạo của lớp cha AggregateRoot để gán thuộc tính và thiết lập ID
    super(props, id);
    // Tự động kiểm tra tính hợp lệ của dữ liệu ngay khi tạo thực thể mới
    this.validate();
  }

  // Phương thức kiểm định tính toàn vẹn nghiệp vụ của nhật ký cabin
  private validate(): void {
    // Kiểm tra xem nội dung nhật ký có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
    if (!this.props.content || this.props.content.trim() === "") {
      // Ném lỗi xác thực nghiệp vụ nếu nội dung nhật ký trống
      throw new ValidationError("Nội dung nhật ký cabin không được trống.");
    }
  }

  // Nghiệp vụ bật/tắt yêu thích (Like/Unlike) nhật ký cabin cho một người dùng
  public toggleLike(userId: string): boolean {
    // Tìm kiếm vị trí ID người dùng trong danh sách đã thích likes
    const index = this.props.likes.indexOf(userId);
    // Nếu người dùng chưa từng thích bài viết nhật ký cabin này trước đó
    if (index === -1) {
      // Thêm ID người dùng vào danh sách những người thích
      this.props.likes.push(userId);
      // Trả về true biểu thị đã thích nhật ký thành công
      return true;
    } else {
      // Nếu đã thích rồi thì xóa ID người dùng ra khỏi danh sách thích
      this.props.likes.splice(index, 1);
      // Trả về false biểu thị đã hủy thích nhật ký thành công
      return false;
    }
  }

  // Chuyển đổi thực thể Domain BoatLog thành đối tượng thuần Plain Object kèm ID
  public toProps(): BoatLogProps & { id: string } {
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
    };
  }

  // Getter để truy xuất nhanh mã người dùng tạo nhật ký cabin
  get userId() { return this.props.userId; }
  // Getter để truy xuất nhanh danh sách ID những người thích nhật ký cabin
  get likes() { return this.props.likes; }
}
