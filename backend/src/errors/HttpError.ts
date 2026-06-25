// Định nghĩa lớp HttpError kế thừa lớp Error mặc định của JavaScript/TypeScript để xử lý các lỗi liên quan đến HTTP response
export class HttpError extends Error {
  // Hàm khởi tạo nhận vào mã trạng thái HTTP (status: ví dụ 400, 404, 500) và thông điệp lỗi (message)
  constructor(
    public readonly status: number,           // Thuộc tính status chỉ đọc (readonly) lưu mã trạng thái HTTP
    message: string,                         // Thông điệp mô tả lỗi cụ thể
  ) {
    // Gọi hàm khởi tạo của lớp cha Error để thiết lập thông điệp lỗi
    super(message);
    // Thiết lập lại prototype một cách tường minh để đảm bảo cơ chế kiểm tra kiểu (instanceof HttpError) hoạt động chính xác trong môi trường TypeScript/JavaScript
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

