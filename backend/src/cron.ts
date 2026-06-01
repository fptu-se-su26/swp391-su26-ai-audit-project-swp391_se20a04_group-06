import cron from 'node-cron';
import { Product } from './models/Product';
import { logger } from './utils/logger';
import { redis } from './config/redis'; // 👈 Import thêm redis

/**
 * Chạy mỗi giờ: tự động chuyển hải sản tươi quá 24h sang Status = 'Expired'.
 * Theo test case TC-07: bài tươi đăng hơn 24h → Status = 'Expired', không còn trên trang chủ.
 */
export function startCronJobs() {
  const expireTask = async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const result = await Product.updateMany(
        {
          type: 'Fresh',
          status: 'Active',
          $or: [
            { catchTime: { $lte: twoDaysAgo } },
            { createdAt: { $lte: yesterday } }
          ]
        },
        { $set: { status: 'Expired' } }
      );

      if (result.modifiedCount > 0) {
        logger.info(`⏰ [CRON] Đã hết hạn ${result.modifiedCount} bài hải sản tươi`);

        // 🌟 GIẢI PHÁP: Tăng phiên bản cache để ép các client dọn dẹp cache rác của hải sản tươi ngay lập tức
        await redis.incr("product:list:version:Fresh");
      }
    } catch (err: any) {
      logger.error('[CRON] Lỗi khi expire sản phẩm tươi:', err);
    }
  };

  cron.schedule('0 * * * *', expireTask);

  /* Chạy luôn một lần khi khởi động để đồng bộ */
  expireTask().catch((err) => logger.error('[CRON-BOOT] Lỗi đồng bộ ban đầu:', err));

  logger.info('⏰ Cronjob expire hải sản tươi đã khởi động (mỗi giờ)');
}
