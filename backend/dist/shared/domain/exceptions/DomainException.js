"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.ConflictError = exports.ValidationError = exports.DomainException = void 0;
// Định nghĩa lớp lỗi trừu tượng DomainException kế thừa từ lớp Error gốc của Javascript/TypeScript
class DomainException extends Error {
    // Hàm khởi tạo nhận vào nội dung thông báo lỗi
    constructor(message) {
        // Gọi constructor của lớp Error cha truyền vào nội dung message
        super(message);
        // Thiết lập lại nguyên mẫu (prototype) để giữ tính kế thừa chính xác cho lớp con
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.DomainException = DomainException;
// Định nghĩa lớp lỗi ValidationError đại diện cho lỗi hợp lệ hóa dữ liệu trong Domain
class ValidationError extends DomainException {
    // Hàm khởi tạo nhận vào nội dung thông báo lỗi
    constructor(message) {
        // Gọi constructor lớp cha DomainException
        super(message);
    }
}
exports.ValidationError = ValidationError;
// Định nghĩa lớp lỗi ConflictError đại diện cho xung đột dữ liệu nghiệp vụ
class ConflictError extends DomainException {
    // Hàm khởi tạo nhận vào nội dung thông báo lỗi
    constructor(message) {
        // Gọi constructor lớp cha DomainException
        super(message);
    }
}
exports.ConflictError = ConflictError;
// Định nghĩa lớp lỗi NotFoundError đại diện cho lỗi không tìm thấy tài nguyên trong Domain
class NotFoundError extends DomainException {
    // Hàm khởi tạo nhận vào nội dung thông báo lỗi
    constructor(message) {
        // Gọi constructor lớp cha DomainException
        super(message);
    }
}
exports.NotFoundError = NotFoundError;
// Định nghĩa lớp lỗi UnauthorizedError đại diện cho lỗi không đủ thẩm quyền thao tác
class UnauthorizedError extends DomainException {
    // Hàm khởi tạo nhận vào nội dung thông báo lỗi
    constructor(message) {
        // Gọi constructor lớp cha DomainException
        super(message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
