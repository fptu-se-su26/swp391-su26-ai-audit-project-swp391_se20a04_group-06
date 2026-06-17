"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
// Định nghĩa lớp trừu tượng ValueObject (Đối tượng giá trị) dùng làm lớp cơ sở cho các Value Object trong DDD
class ValueObject {
    // Hàm khởi tạo nhận vào đối tượng props chứa các giá trị khởi đầu
    constructor(props) {
        // Đóng băng (freeze) đối tượng props để đảm bảo tính bất biến (immutability) đặc trưng của Value Object
        this.props = Object.freeze(props);
    }
    // Định nghĩa hàm equals để so sánh tính bằng nhau giữa hai Value Object dựa vào giá trị thực tế của các thuộc tính
    equals(vo) {
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
exports.ValueObject = ValueObject;
