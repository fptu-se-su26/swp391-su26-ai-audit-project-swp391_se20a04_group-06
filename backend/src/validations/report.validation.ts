// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu báo cáo vi phạm
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo báo cáo vi phạm
export const createReportSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Lý do báo cáo reason phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
    reason: z.string().min(1, "Lý do báo cáo không được để trống"),
  }),
});

// Xuất ra schema định nghĩa quy tắc kiểm thực khi Admin xử lý báo cáo vi phạm
export const handleReportSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Hành động xử lý: Chỉ chấp nhận một trong hai lựa chọn cố định là "resolve" hoặc "dismiss"
    action: z.enum(["resolve", "dismiss"] as const),
    // Ghi chú giải trình của quản trị viên: Trường văn bản tùy chọn (optional)
    adminNote: z.string().optional(),
  }),
});
