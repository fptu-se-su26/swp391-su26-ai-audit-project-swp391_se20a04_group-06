import cron from 'node-cron';
import { pool } from './db';
import { RowDataPacket } from 'mysql2';

/**
 * Chạy mỗi giờ: tự động chuyển hải sản tươi quá 24h sang Status = 'Expired'.
 * Theo test case TC-07: bài tươi đăng hơn 24h → Status = 'Expired', không còn trên trang chủ.
 */
export function startCronJobs() {
  cron.schedule('0 * * * *', async () => {
    try {
      const [result] = await pool.query<any>(
        `UPDATE Product
         SET Status = 'Expired'
         WHERE Type = 'Fresh'
           AND Status = 'Active'
           AND CatchTime IS NOT NULL
           AND CatchTime <= NOW() - INTERVAL 24 HOUR`,
      );
      if (result.affectedRows > 0) {
        console.log(`⏰ [CRON] Đã hết hạn ${result.affectedRows} bài hải sản tươi`);
      }
    } catch (err) {
      console.error('[CRON] Lỗi khi expire sản phẩm tươi:', err);
    }
  });

  /* Chạy luôn một lần khi khởi động để đồng bộ */
  (async () => {
    try {
      const [result] = await pool.query<any>(
        `UPDATE Product SET Status = 'Expired'
         WHERE Type = 'Fresh' AND Status = 'Active'
           AND CatchTime IS NOT NULL AND CatchTime <= NOW() - INTERVAL 24 HOUR`,
      );
      console.log(`⏰ [CRON-BOOT] Khởi động: đã hết hạn ${result.affectedRows} bài tươi cũ`);
    } catch (err) {
      console.error('[CRON-BOOT]', err);
    }
  })();

  console.log('⏰ Cronjob expire hải sản tươi đã khởi động (mỗi giờ)');
}
