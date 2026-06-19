"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
// Import lớp thực thể Entity làm cơ sở để kế thừa thuộc tính định danh
const Entity_1 = require("./Entity");
// Import lớp DomainEvents để quản lý phân phối sự kiện miền
const DomainEvents_1 = require("./events/DomainEvents");
// Định nghĩa lớp trừu tượng AggregateRoot kế thừa từ lớp Entity để đại diện cho một Aggregate Root trong DDD
class AggregateRoot extends Entity_1.Entity {
    constructor() {
        super(...arguments);
        // Khai báo mảng chứa các sự kiện miền phát sinh trong nội bộ thực thể gốc
        this._domainEvents = [];
    }
    // Định nghĩa hàm getter để truy cập danh sách sự kiện miền bên ngoài thực thể
    get domainEvents() {
        // Trả về mảng các sự kiện miền hiện tại
        return this._domainEvents;
    }
    // Định nghĩa hàm được bảo vệ (protected) để thêm một sự kiện miền mới phát sinh
    addDomainEvent(domainEvent) {
        // Đẩy sự kiện miền mới vào cuối mảng danh sách lưu trữ nội bộ
        this._domainEvents.push(domainEvent);
        // Đăng ký aggregate này với lớp quản lý DomainEvents để sẵn sàng gửi đi
        DomainEvents_1.DomainEvents.markAggregateForDispatch(this);
    }
    // Định nghĩa hàm public để làm sạch toàn bộ mảng sự kiện sau khi đã được phân phối thành công
    clearEvents() {
        // Thiết lập lại mảng sự kiện miền về trạng thái rỗng
        this._domainEvents = [];
    }
}
exports.AggregateRoot = AggregateRoot;
