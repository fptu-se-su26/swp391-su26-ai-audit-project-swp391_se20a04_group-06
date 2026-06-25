// Định nghĩa lớp trừu tượng ValueObject (Đối tượng giá trị) dùng làm lớp cơ sở cho các Value Object trong DDD
export abstract class ValueObject<T> {
  // Thuộc tính props lưu trữ các giá trị nghiệp vụ bên trong, chỉ cho phép đọc và truy cập nội bộ kế thừa
  protected readonly props: T;

  // Hàm khởi tạo nhận vào đối tượng props chứa các giá trị khởi đầu
  constructor(props: T) {
    // Đóng băng (freeze) đối tượng props để đảm bảo tính bất biến (immutability) đặc trưng của Value Object
    this.props = Object.freeze(props);
  }

  // Định nghĩa hàm equals để so sánh tính bằng nhau giữa hai Value Object dựa vào giá trị thực tế của các thuộc tính
  public equals(vo?: ValueObject<T>): boolean {
    // Nếu đối tượng so sánh là null hoặc không được xác định (undefined)
    if (vo === null || vo === undefined) {
      // Trả về false do không có giá trị để so sánh
      return false;
    }
    // Nếu thuộc tính props của đối tượng so sánh không được xác định
    if (vo.props === undefined) {
      // Trả về false do cấu trúc không đồng bộ
      return false;
    }
    // So sánh chuỗi JSON hóa của cả hai thuộc tính props để kiểm tra sự trùng khớp toàn bộ nội dung giá trị
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
