// Import lớp cha AggregateRoot để quản lý vòng đời thực thể miền Domain của công thức chế biến
import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
// Import lớp lỗi ngoại lệ ValidationError để ném ra khi tiêu đề hoặc thông tin không hợp lệ
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

// Định nghĩa giao diện (interface) RecipeProps chứa các thuộc tính của công thức nấu ăn
export interface RecipeProps {
  // Tiêu đề của công thức nấu ăn
  title: string;
  // Nội dung mô tả chi tiết công thức nấu ăn
  description: string;
  // Mảng chứa danh sách các nguyên liệu cần chuẩn bị
  ingredients: string[];
  // Mảng chứa các bước hướng dẫn chế biến cụ thể
  instructions: string[];
  // Đường dẫn hình ảnh thành phẩm của món ăn (có thể rỗng)
  imageUrl: string | null;
  // ID tác giả của người chia sẻ công thức nấu ăn
  authorId: string;
  // Mức độ khó của công thức, chỉ nhận: Easy (Dễ), Medium (Trung bình), Hard (Khó)
  difficulty: "Easy" | "Medium" | "Hard";
  // Thời gian chế biến và nấu nướng (đơn vị tính theo phút)
  cookingTime: number;
  // Số lượng khẩu phần ăn phục vụ (ví dụ: cho 2 người, 4 người ăn)
  servings: number;
  // Mảng chứa danh sách các nhãn/từ khóa (tags) liên quan
  tags: string[];
  // Mảng chứa danh sách ID những người dùng đã thích công thức này
  likes: string[];
  // Số lượt xem chi tiết công thức nấu ăn này
  viewCount: number;
}

// Định nghĩa thực thể Aggregate Root đại diện cho Recipe trong miền nghiệp vụ (Domain)
export class Recipe extends AggregateRoot<RecipeProps> {
  // Hàm khởi tạo nhận vào các thuộc tính props và ID công thức (nếu có)
  constructor(props: RecipeProps, id?: string) {
    // Gọi hàm khởi tạo của lớp cha AggregateRoot để lưu trữ props và thiết lập ID
    super(props, id);
    // Thực thi hàm kiểm tra tính hợp lệ dữ liệu của thực thể ngay khi khởi tạo
    this.validate();
  }

  // Phương thức kiểm định tính toàn vẹn của thực thể công thức nấu ăn
  private validate(): void {
    // Kiểm tra xem tiêu đề công thức có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
    if (!this.props.title || this.props.title.trim() === "") {
      // Ném lỗi xác thực nghiệp vụ nếu tiêu đề trống
      throw new ValidationError("Tiêu đề không được trống.");
    }
  }

  // Nghiệp vụ thích hoặc bỏ thích công thức nấu ăn (Like/Unlike) của một người dùng
  public toggleLike(userId: string): boolean {
    // Tìm kiếm vị trí ID người dùng trong danh sách thích likes
    const index = this.props.likes.indexOf(userId);
    // Nếu người dùng chưa từng thích công thức này
    if (index === -1) {
      // Thêm ID người dùng vào danh sách những người thích
      this.props.likes.push(userId);
      // Trả về true biểu thị đã thích công thức thành công
      return true;
    } else {
      // Nếu đã thích từ trước thì xóa ID người dùng ra khỏi danh sách thích
      this.props.likes.splice(index, 1);
      // Trả về false biểu thị đã hủy thích công thức thành công
      return false;
    }
  }

  // Phương thức tăng số lượt xem công thức nấu ăn lên 1 đơn vị
  public incrementViews(): void {
    // Tăng trường viewCount hiện tại thêm 1
    this.props.viewCount += 1;
  }

  // Phương thức cập nhật các thông số chi tiết của công thức nấu ăn
  public update(data: Partial<RecipeProps>): void {
    // Nếu có tiêu đề mới, thực hiện cập nhật
    if (data.title !== undefined) this.props.title = data.title;
    // Nếu có mô tả mới, thực hiện cập nhật
    if (data.description !== undefined) this.props.description = data.description;
    // Nếu có danh sách nguyên liệu mới, thực hiện cập nhật
    if (data.ingredients !== undefined) this.props.ingredients = data.ingredients;
    // Nếu có danh sách các bước hướng dẫn mới, thực hiện cập nhật
    if (data.instructions !== undefined) this.props.instructions = data.instructions;
    // Nếu có đường dẫn ảnh mới, thực hiện cập nhật
    if (data.imageUrl !== undefined) this.props.imageUrl = data.imageUrl;
    // Nếu có cấp độ khó mới, thực hiện cập nhật
    if (data.difficulty !== undefined) this.props.difficulty = data.difficulty;
    // Nếu có thời gian nấu mới, thực hiện cập nhật
    if (data.cookingTime !== undefined) this.props.cookingTime = data.cookingTime;
    // Nếu có số lượng khẩu phần ăn mới, thực hiện cập nhật
    if (data.servings !== undefined) this.props.servings = data.servings;
    // Nếu có danh sách nhãn dán tags mới, thực hiện cập nhật
    if (data.tags !== undefined) this.props.tags = data.tags;
    // Thực hiện kiểm duyệt tính toàn vẹn của thực thể sau khi cập nhật dữ liệu mới
    this.validate();
  }

  // Chuyển đổi thực thể Domain Recipe thành đối tượng thuần Plain Object kèm ID
  public toProps(): RecipeProps & { id: string } {
    // Trả về đối tượng chứa tất cả thông tin chi tiết của công thức nấu ăn phục vụ lưu trữ hoặc mapping
    return {
      // Mã định danh duy nhất của công thức
      id: this.id,
      // Tiêu đề công thức
      title: this.props.title,
      // Mô tả công thức
      description: this.props.description,
      // Danh sách các nguyên liệu
      ingredients: this.props.ingredients,
      // Các bước hướng dẫn thực hiện
      instructions: this.props.instructions,
      // Đường dẫn hình ảnh
      imageUrl: this.props.imageUrl,
      // Mã ID của tác giả đăng công thức
      authorId: this.props.authorId,
      // Cấp độ khó của món ăn
      difficulty: this.props.difficulty,
      // Thời gian chế biến món ăn
      cookingTime: this.props.cookingTime,
      // Số lượng khẩu phần ăn
      servings: this.props.servings,
      // Các từ khóa liên quan
      tags: this.props.tags,
      // Danh sách người dùng thích công thức
      likes: this.props.likes,
      // Tổng số lượt xem
      viewCount: this.props.viewCount,
    };
  }

  // Getter để truy xuất nhanh tiêu đề công thức
  get title() { return this.props.title; }
  // Getter để truy xuất nhanh ID của tác giả
  get authorId() { return this.props.authorId; }
  // Getter để truy xuất nhanh danh sách lượt thích
  get likes() { return this.props.likes; }
  get imageUrl() { return this.props.imageUrl; }
}

