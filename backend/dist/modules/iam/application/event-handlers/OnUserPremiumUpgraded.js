"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnUserPremiumUpgraded = void 0;
// Import lớp điều phối sự kiện Domain (DomainEvents) để đăng ký lắng nghe sự kiện
const DomainEvents_1 = require("../../../../shared/domain/events/DomainEvents");
// Import sự kiện UserPremiumUpgradedEvent để làm định nghĩa kiểu cho sự kiện nhận được
const UserPremiumUpgradedEvent_1 = require("../../domain/events/UserPremiumUpgradedEvent");
// Import đối tượng kết nối Redis để tương tác thu hồi token
const redis_1 = require("../../../../config/redis");
// Import logger ghi nhận vết xử lý sự kiện
const logger_1 = require("../../../../utils/logger");
/**
 * BỘ XỬ LÝ SỰ KIỆN MIỀN (DOMAIN EVENT HANDLER): KHI NGƯỜI DÙNG ĐƯỢC NÂNG CẤP PREMIUM
 * Lắng nghe sự kiện nâng cấp thành công để thực thi các tác vụ phụ trợ (side-effects) như buộc đăng xuất các phiên cũ
 */
class OnUserPremiumUpgraded {
    /**
     * ĐĂNG KÝ BỘ LẮNG NGHE SỰ KIỆN VỚI HỆ THỐNG ĐIỀU PHỐI (DomainEvents)
     */
    static register() {
        DomainEvents_1.DomainEvents.register(async (event) => {
            // Khi sự kiện được phát đi, gọi hàm xử lý bất đồng bộ tương ứng bên dưới
            await this.onUserPremiumUpgraded(event);
        }, UserPremiumUpgradedEvent_1.UserPremiumUpgradedEvent.name // Đăng ký dựa trên tên định danh duy nhất của lớp sự kiện
        );
    }
    /**
     * HÀM XỬ LÝ SỰ KIỆN NÂNG CẤP PREMIUM (THU HỒI TOKEN / CASCADE LOGOUT)
     */
    static async onUserPremiumUpgraded(event) {
        const { userId } = event; // Lấy ID người dùng được nâng cấp từ sự kiện nhận được
        logger_1.logger.info(`[DomainEvent Handler] Bắt đầu xử lý nâng cấp Premium cho User ID = ${userId}`);
        try {
            // THU HỒI TOÀN BỘ PHIÊN ĐĂNG NHẬP CŨ TRÊN REDIS (Cascade Logout)
            // Mục đích: Ép buộc client phải xin cấp lại Access Token mới chứa quyền Premium ở lần gọi API tiếp theo
            let cursor = "0";
            const keysToDelete = [];
            // Quét tìm tất cả các Refresh Token đang hoạt động của người dùng trên Redis
            do {
                const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${userId}:*`, "COUNT", 100);
                cursor = reply[0];
                keysToDelete.push(...reply[1]);
            } while (cursor !== "0");
            // Nếu tìm thấy các phiên đăng nhập cũ, thực hiện xóa chúng khỏi bộ nhớ Redis
            if (keysToDelete.length > 0) {
                await redis_1.redis.del(...keysToDelete);
                logger_1.logger.info(`[DomainEvent Handler] Đã thu hồi thành công ${keysToDelete.length} phiên đăng nhập của User=${userId} (Cascade Logout)`);
            }
        }
        catch (err) {
            // Chỉ log lỗi nếu có sự cố xảy ra chứ không quăng lỗi ra ngoài để tránh ảnh hưởng đến tiến trình chính phát sự kiện
            logger_1.logger.error(`[DomainEvent Handler] Lỗi khi thu hồi token cho User=${userId}: ${err.message}`);
        }
    }
}
exports.OnUserPremiumUpgraded = OnUserPremiumUpgraded;
