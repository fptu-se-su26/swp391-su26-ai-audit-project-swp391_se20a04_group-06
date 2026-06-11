import cron from "node-cron";
import { productRepository } from "./repositories/product.repository";
import { logger } from "./utils/logger";
import { redis } from "./config/redis";

export function startCronJobs() {
  const expireTask = async () => {
    const lockKey = "cron:lock:expire_fresh";

    try {
      // KHẮC PHỤC XUNG ĐỘT PHÂN TÁN: Sử dụng cơ chế Khóa RAM Redis để chỉ cho phép 1 Pod thực thi tác vụ mỗi giờ
      const VN_TIMEZONE_OFFSET = 7 * 60 * 60 * 1000;
      const nowVN = new Date(Date.now() + VN_TIMEZONE_OFFSET);
      const uniqueValue = `${nowVN.getUTCFullYear()}-${nowVN.getUTCMonth()}-${nowVN.getUTCDate()}:${nowVN.getUTCHours()}`;

      // Giành quyền thực thi trong vòng 55 phút (để tự động mở khóa trước chu kỳ giờ tiếp theo)
      const lockAcquired = await redis.set(
        lockKey,
        uniqueValue,
        "EX",
        3300,
        "NX",
      );

      if (!lockAcquired) {
        logger.debug(
          "[CRON] Một thực thể ứng dụng khác đã giành quyền thực thi tác vụ hết hạn.",
        );
        return;
      }

      logger.info(
        "[CRON] Khóa phân tán được thiết lập thành công. Tiến hành hết hạn hải sản tươi...",
      );

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const result = await productRepository.updateMany(
        {
          type: "Fresh",
          status: "Active",
          $or: [
            { catchTime: { $lte: twoDaysAgo } },
            { createdAt: { $lte: yesterday } },
          ],
        },
        { $set: { status: "Expired" } },
      );

      if (result.modifiedCount > 0) {
        logger.info(
          `⏰ [CRON] Đã hết hạn ${result.modifiedCount} bài hải sản tươi`,
        );
        await redis.incr("product:list:version:Fresh");
      }
    } catch (err: any) {
      logger.error("[CRON] Lỗi khi expire sản phẩm tươi:", err);
    }
  };

  cron.schedule("0 * * * *", expireTask);

  expireTask().catch((err) =>
    logger.error("[CRON-BOOT] Lỗi đồng bộ ban đầu:", err),
  );

  logger.info("⏰ Cronjob expire hải sản tươi đã khởi động (mỗi giờ)");
}
