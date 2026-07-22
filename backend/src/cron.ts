// Import thư viện node-cron để thiết lập lịch trình tự động chạy các tác vụ nền
import cron from "node-cron";
// Import đối tượng productRepository để thực hiện các truy vấn cập nhật trạng thái hết hạn của sản phẩm
import { productRepository } from "./repositories/product.repository";
// Import logger phục vụ ghi log hệ thống
import { logger } from "./utils/logger";
// Import kết nối redis phục vụ cơ chế khóa phân tán chống trùng lặp tiến trình
import { redis } from "./config/redis";

// Định nghĩa và xuất hàm startCronJobs để khởi tạo các công việc cron lập lịch tự động
export function startCronJobs() {
  // Định nghĩa hàm bất đồng bộ expireTask xử lý nghiệp vụ tự động chuyển trạng thái sản phẩm tươi sống quá hạn
  const expireTask = async () => {
    // Khóa phân tán lưu trữ trong Redis nhằm đảm bảo trong môi trường đa máy chủ (Multi-pod/Cluster) chỉ có duy nhất 1 luồng thực thi tác vụ
    const lockKey = "cron:lock:expire_fresh";

    try {
      // KHẮC PHỤC XUNG ĐỘT PHÂN TÁN: Sử dụng cơ chế Khóa RAM Redis để chỉ cho phép 1 Pod thực thi tác vụ mỗi giờ
      // Tính toán múi giờ GMT+7 của Việt Nam
      const VN_TIMEZONE_OFFSET = 7 * 60 * 60 * 1000;
      // Khởi tạo đối tượng Date chuyển đổi theo múi giờ Việt Nam
      const nowVN = new Date(Date.now() + VN_TIMEZONE_OFFSET);
      // Tạo chuỗi giá trị duy nhất đại diện cho giờ chạy hiện tại dạng YYYY-MM-DD:HH
      const uniqueValue = `${nowVN.getUTCFullYear()}-${nowVN.getUTCMonth()}-${nowVN.getUTCDate()}:${nowVN.getUTCHours()}`;

      // Giành quyền thực thi trong vòng 55 phút (3300 giây) bằng hàm ghi khóa Redis có cờ "NX" (chỉ ghi khi chưa tồn tại)
      const lockAcquired = await redis.set(
        // Khóa Redis
        lockKey,
        // Giá trị định danh độc nhất đại diện cho giờ chạy hiện tại
        uniqueValue,
        // Cờ cấu hình thời gian hết hạn EX (giây)
        "EX",
        // Thời gian hết hạn là 3300 giây (55 phút) để tự động giải phóng trước chu kỳ giờ tiếp theo
        3300,
        // Chỉ ghi khóa khi chưa tồn tại (NX - Not eXists)
        "NX",
      );

      // Nếu không giành được khóa (đã có một máy chủ khác ghi khóa giờ này trước)
      if (!lockAcquired) {
        // Ghi nhận log gỡ lỗi (debug) và dừng thực thi tác vụ ở máy chủ này
        logger.debug(
          "[CRON] Một thực thể ứng dụng khác đã giành quyền thực thi tác vụ hết hạn.",
        );
        return;
      }

      // Ghi log thông báo khóa phân tán đã giành quyền thực thi thành công
      logger.info(
        "[CRON] Khóa phân tán được thiết lập thành công. Tiến hành hết hạn hải sản tươi...",
      );

      const now = new Date();
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Thực hiện cập nhật hàng loạt các sản phẩm Fresh đang Active nhưng đã quá hạn bán
      const result = await productRepository.updateMany(
        {
          // Chỉ xét sản phẩm loại Fresh (tươi sống)
          type: "Fresh",
          // Đang hoạt động
          status: "Active",
          // Quá hạn: Có ngày hết hạn và đã qua ngày hết hạn, HOẶC catchTime > 72h, HOẶC createdAt > 48h nếu thiếu catchTime/expiryDate
          $or: [
            { expiryDate: { $lte: now } },
            { catchTime: { $lte: threeDaysAgo }, expiryDate: { $in: [null, undefined] } },
            {
              catchTime: { $in: [null, undefined] },
              expiryDate: { $in: [null, undefined] },
              createdAt: { $lte: twoDaysAgo }
            }
          ],
        },
        // Chuyển đổi trạng thái sản phẩm sang Expired (Hết hạn)
        { $set: { status: "Expired" } },
      );

      // Nếu có ít nhất một sản phẩm được cập nhật thành công
      if (result.modifiedCount > 0) {
        // Ghi log số lượng mẻ hàng đã bị cập nhật hết hạn thành công
        logger.info(
          `⏰ [CRON] Đã hết hạn ${result.modifiedCount} bài hải sản tươi`,
        );
        // Tăng phiên bản bộ nhớ cache để client cập nhật danh sách hải sản tươi mới nhất
        await redis.incr("product:list:version:Fresh");
      }
    } catch (err: any) {
      // Ghi nhận log lỗi nếu quá trình cập nhật bị lỗi
      logger.error("[CRON] Lỗi khi expire sản phẩm tươi:", err);
    }
  };

  // Thiết lập lịch trình chạy định kỳ tác vụ expireTask vào phút thứ 0 của mỗi giờ (0 * * * *)
  cron.schedule("0 * * * *", expireTask);

  // Kích hoạt chạy thử tác vụ expireTask ngay khi khởi chạy backend để đồng bộ nhanh dữ liệu ban đầu
  expireTask().catch((err) =>
    // Ghi log lỗi nếu chạy thử ban đầu thất bại
    logger.error("[CRON-BOOT] Lỗi đồng bộ ban đầu:", err),
  );

  // Ghi log thông báo tiến trình lập lịch hết hạn hải sản tươi đã khởi chạy thành công
  logger.info("⏰ Cronjob expire hải sản tươi đã khởi động (mỗi giờ)");
}
