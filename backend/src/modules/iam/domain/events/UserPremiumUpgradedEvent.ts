// Import giao diện IDomainEvent để triển khai cấu trúc chuẩn của một sự kiện miền trong DDD
import { IDomainEvent } from "../../../../shared/domain/events/DomainEvent";

/**
 * SỰ KIỆN MIỀN: TÀI KHOẢN NGƯỜI DÙNG ĐÃ ĐƯỢC NÂNG CẤP LÊN PREMIUM
 * Được kích hoạt khi một người dùng thanh toán thành công và chuyển trạng thái sang Premium
 */
export class UserPremiumUpgradedEvent implements IDomainEvent {
  // Thời điểm sự kiện này diễn ra
  public dateTimeOccurred: Date;

  // Hàm khởi tạo nhận vào ID của người dùng được nâng cấp Premium
  constructor(public readonly userId: string) {
    // Tự động lấy thời gian hiện tại lúc khởi tạo làm thời điểm xảy ra sự kiện
    this.dateTimeOccurred = new Date();
  }

  /**
   * LẤY ID CỦA THỰC THỂ (AGGREGATE ROOT) LIÊN QUAN
   * Trả về ID của thực thể User nhằm xác định đối tượng chịu tác động của sự kiện
   */
  getAggregateId(): string {
    return this.userId;
  }
}

