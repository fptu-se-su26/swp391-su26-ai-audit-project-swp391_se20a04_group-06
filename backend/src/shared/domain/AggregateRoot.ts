// Import lớp thực thể Entity làm cơ sở để kế thừa thuộc tính định danh
import { Entity } from "./Entity";
// Import interface IDomainEvent đại diện cho giao diện cấu trúc sự kiện miền
import { IDomainEvent } from "./events/DomainEvent";
// Import lớp DomainEvents để quản lý phân phối sự kiện miền
import { DomainEvents } from "./events/DomainEvents";

// Định nghĩa lớp trừu tượng AggregateRoot kế thừa từ lớp Entity để đại diện cho một Aggregate Root trong DDD
export abstract class AggregateRoot<T> extends Entity<T> {
  // Khai báo mảng chứa các sự kiện miền phát sinh trong nội bộ thực thể gốc
  private _domainEvents: IDomainEvent[] = [];

  // Định nghĩa hàm getter để truy cập danh sách sự kiện miền bên ngoài thực thể
  get domainEvents(): IDomainEvent[] {
    // Trả về mảng các sự kiện miền hiện tại
    return this._domainEvents;
  }

  // Định nghĩa hàm được bảo vệ (protected) để thêm một sự kiện miền mới phát sinh
  protected addDomainEvent(domainEvent: IDomainEvent): void {
    // Đẩy sự kiện miền mới vào cuối mảng danh sách lưu trữ nội bộ
    this._domainEvents.push(domainEvent);
    // Đăng ký aggregate này với lớp quản lý DomainEvents để sẵn sàng gửi đi
    DomainEvents.markAggregateForDispatch(this);
  }

  // Định nghĩa hàm public để làm sạch toàn bộ mảng sự kiện sau khi đã được phân phối thành công
  public clearEvents(): void {
    // Thiết lập lại mảng sự kiện miền về trạng thái rỗng
    this._domainEvents = [];
  }
}
