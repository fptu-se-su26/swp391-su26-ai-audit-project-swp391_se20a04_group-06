"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("./db");
/**
 * Chạy mỗi giờ: tự động chuyển hải sản tươi quá 24h sang Status = 'Expired'.
 * Theo test case TC-07: bài tươi đăng hơn 24h → Status = 'Expired', không còn trên trang chủ.
 */
function startCronJobs() {
    node_cron_1.default.schedule('0 * * * *', async () => {
        try {
            const [result] = await db_1.pool.query(`UPDATE Product
         SET Status = 'Expired'
         WHERE Type = 'Fresh'
           AND Status = 'Active'
           AND CatchTime IS NOT NULL
           AND CatchTime <= NOW() - INTERVAL 24 HOUR`);
            if (result.affectedRows > 0) {
                console.log(`⏰ [CRON] Đã hết hạn ${result.affectedRows} bài hải sản tươi`);
            }
        }
        catch (err) {
            console.error('[CRON] Lỗi khi expire sản phẩm tươi:', err);
        }
    });
    /* Chạy luôn một lần khi khởi động để đồng bộ */
    (async () => {
        try {
            const [result] = await db_1.pool.query(`UPDATE Product SET Status = 'Expired'
         WHERE Type = 'Fresh' AND Status = 'Active'
           AND CatchTime IS NOT NULL AND CatchTime <= NOW() - INTERVAL 24 HOUR`);
            console.log(`⏰ [CRON-BOOT] Khởi động: đã hết hạn ${result.affectedRows} bài tươi cũ`);
        }
        catch (err) {
            console.error('[CRON-BOOT]', err);
        }
    })();
    console.log('⏰ Cronjob expire hải sản tươi đã khởi động (mỗi giờ)');
}
