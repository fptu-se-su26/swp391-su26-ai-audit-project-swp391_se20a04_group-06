import { DomainEvents } from "../../../../shared/domain/events/DomainEvents";
import { UserPremiumUpgradedEvent } from "../../domain/events/UserPremiumUpgradedEvent";
import { redis } from "../../../../config/redis";
import { logger } from "../../../../utils/logger";

export class OnUserPremiumUpgraded {
  public static register(): void {
    DomainEvents.register(
      async (event: UserPremiumUpgradedEvent) => {
        await this.onUserPremiumUpgraded(event);
      },
      UserPremiumUpgradedEvent.name
    );
  }

  private static async onUserPremiumUpgraded(event: UserPremiumUpgradedEvent): Promise<void> {
    const { userId } = event;
    logger.info(`[DomainEvent Handler] Bắt đầu xử lý nâng cấp Premium cho User ID = ${userId}`);

    try {
      // Quét & Xóa toàn bộ Refresh Tokens của User này trên Redis (Cascade Logout)
      let cursor = "0";
      const keysToDelete: string[] = [];

      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${userId}:*`,
          "COUNT",
          100
        );
        cursor = reply[0];
        keysToDelete.push(...reply[1]);
      } while (cursor !== "0");

      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
        logger.info(
          `[DomainEvent Handler] Đã thu hồi thành công ${keysToDelete.length} phiên đăng nhập của User=${userId} (Cascade Logout)`
        );
      }
    } catch (err: any) {
      logger.error(
        `[DomainEvent Handler] Lỗi khi thu hồi token cho User=${userId}: ${err.message}`
      );
    }
  }
}
