"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPremiumUpgradedEvent = void 0;
/**
 * SỰ KIỆN MIỀN: TÀI KHOẢN NGƯỜI DÙNG ĐÃ ĐƯỢC NÂNG CẤP LÊN PREMIUM
 * Được kích hoạt khi một người dùng thanh toán thành công và chuyển trạng thái sang Premium
 */
class UserPremiumUpgradedEvent {
    // Hàm khởi tạo nhận vào ID của người dùng được nâng cấp Premium
    constructor(userId) {
        this.userId = userId;
        // Tự động lấy thời gian hiện tại lúc khởi tạo làm thời điểm xảy ra sự kiện
        this.dateTimeOccurred = new Date();
    }
    /**
     * LẤY ID CỦA THỰC THỂ (AGGREGATE ROOT) LIÊN QUAN
     * Trả về ID của thực thể User nhằm xác định đối tượng chịu tác động của sự kiện
     */
    getAggregateId() {
        return this.userId;
    }
}
exports.UserPremiumUpgradedEvent = UserPremiumUpgradedEvent;
