// Import thư viện mã hóa crypto có sẵn của Node.js để tạo chuỗi UUID duy nhất
import crypto from "crypto";

// Định nghĩa lớp trừu tượng Entity (Thực thể) làm mẫu chuẩn cho các thực thể trong Domain-Driven Design
export abstract class Entity<T> {
  // Khai báo thuộc tính định danh duy nhất _id ở chế độ chỉ đọc và được bảo vệ
  protected readonly _id: string;
  // Khai báo các thuộc tính nghiệp vụ khác của thực thể dưới thuộc tính props ở chế độ chỉ đọc
  public readonly props: T;

  // Định nghĩa hàm khởi tạo nhận vào props và một ID tùy chọn nếu đã được tạo từ trước
  constructor(props: T, id?: string) {
    // Nếu có id truyền vào thì dùng luôn, ngược lại tự phát sinh UUID ngẫu nhiên bằng randomUUID()
    this._id = id ? id : crypto.randomUUID();
    // Gán dữ liệu thuộc tính nghiệp vụ tương ứng cho props
    this.props = props;
  }

  // Định nghĩa hàm getter để truy cập vào thuộc tính định danh _id của thực thể từ bên ngoài
  get id(): string {
    // Trả về chuỗi định danh _id
    return this._id;
  }

  // Định nghĩa hàm equals để so sánh xem hai thực thể có bằng nhau hay không dựa vào định danh _id
  public equals(object?: Entity<T>): boolean {
    // Nếu đối tượng so sánh là null hoặc undefined
    if (object == null || object === undefined) {
      // Trả về false do đối tượng không hợp lệ
      return false;
    }

    // Nếu hai đối tượng cùng trỏ tới cùng một tham chiếu bộ nhớ
    if (this === object) {
      // Trả về true ngay lập tức
      return true;
    }

    // Nếu đối tượng so sánh không phải là một thực thể kế thừa từ lớp Entity
    if (!(object instanceof Entity)) {
      // Trả về false do khác kiểu dữ liệu
      return false;
    }

    // So sánh hai giá trị định danh _id của chúng và trả về kết quả logic
    return this._id === object._id;
  }
}
