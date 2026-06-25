// Định nghĩa lớp lỗi trừu tượng DomainException kế thừa từ lớp Error gốc của Javascript/TypeScript
export abstract class DomainException extends Error {
  // Hàm khởi tạo nhận vào nội dung thông báo lỗi
  constructor(message: string) {
    // Gọi constructor của lớp Error cha truyền vào nội dung message
    super(message);
    // Thiết lập lại nguyên mẫu (prototype) để giữ tính kế thừa chính xác cho lớp con
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Định nghĩa lớp lỗi ValidationError đại diện cho lỗi hợp lệ hóa dữ liệu trong Domain
export class ValidationError extends DomainException {
  // Hàm khởi tạo nhận vào nội dung thông báo lỗi
  constructor(message: string) {
    // Gọi constructor lớp cha DomainException
    super(message);
  }
}

// Định nghĩa lớp lỗi ConflictError đại diện cho xung đột dữ liệu nghiệp vụ
export class ConflictError extends DomainException {
  // Hàm khởi tạo nhận vào nội dung thông báo lỗi
  constructor(message: string) {
    // Gọi constructor lớp cha DomainException
    super(message);
  }
}

// Định nghĩa lớp lỗi NotFoundError đại diện cho lỗi không tìm thấy tài nguyên trong Domain
export class NotFoundError extends DomainException {
  // Hàm khởi tạo nhận vào nội dung thông báo lỗi
  constructor(message: string) {
    // Gọi constructor lớp cha DomainException
    super(message);
  }
}

// Định nghĩa lớp lỗi UnauthorizedError đại diện cho lỗi không đủ thẩm quyền thao tác
export class UnauthorizedError extends DomainException {
  // Hàm khởi tạo nhận vào nội dung thông báo lỗi
  constructor(message: string) {
    // Gọi constructor lớp cha DomainException
    super(message);
  }
}
