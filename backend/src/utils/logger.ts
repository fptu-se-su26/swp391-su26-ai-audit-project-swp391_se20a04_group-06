// Import thư viện winston để thực hiện ghi chép lịch sử hoạt động (logging)
import winston from "winston";
// Import lớp DailyRotateFile để tự động tạo file log mới theo ngày và dọn dẹp file cũ
import DailyRotateFile from "winston-daily-rotate-file";

// Giải nén các phương thức định dạng log từ winston.format để sử dụng trực tiếp
const { combine, timestamp, printf, colorize, json } = winston.format;

// Định dạng hiển thị chuỗi log trực quan cho Console trong môi trường phát triển
const consoleLogFormat = printf(
  // Nhận vào đối tượng chứa cấp độ lỗi (level), nội dung log (message), thời điểm (timestamp) và siêu dữ liệu bổ sung (metadata)
  ({ level, message, timestamp, ...metadata }) => {
    // Ghép thời gian, cấp độ lỗi và nội dung log thành một chuỗi
    let msg = `${timestamp} [${level}]: ${message}`;
    // Nếu có thêm siêu dữ liệu metadata đi kèm trong log
    if (Object.keys(metadata).length > 0) {
      // Chuyển đổi siêu dữ liệu sang chuỗi JSON và ghép thêm vào sau thông báo log
      msg += ` ${JSON.stringify(metadata)}`;
    }
    // Trả về chuỗi thông báo log hoàn chỉnh
    return msg;
  },
);

// Khởi tạo và xuất đối tượng logger được cấu hình đầy đủ để sử dụng ghi log toàn hệ thống
export const logger = winston.createLogger({
  // Thiết lập mức độ log tối thiểu để ghi nhận, lấy từ biến môi trường LOG_LEVEL hoặc mặc định là "info"
  level: process.env.LOG_LEVEL || "info",
  // Kết hợp các phương thức định dạng log
  format: combine(
    // Thêm mốc thời gian dạng "YYYY-MM-DD HH:mm:ss" vào mỗi bản ghi log
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // Lưu log dạng JSON phục vụ các hệ thống phân tích như ELK Stack
    json(),
  ),
  // Cấu hình các kênh vận chuyển và ghi log (transports)
  transports: [
    // Kênh in log ra màn hình Console có tô màu sắc theo cấp độ log
    new winston.transports.Console({
      // Kết hợp tô màu chữ (colorize) và định dạng hiển thị tùy chỉnh (consoleLogFormat)
      format: combine(colorize(), consoleLogFormat),
    }),
    // Kênh xoay vòng file lưu trữ lỗi (error log) riêng biệt
    new DailyRotateFile({
      // Tên file log bao gồm biến ngày %DATE% để tự phân tách
      filename: "logs/error-%DATE%.log",
      // Định dạng ngày dùng cho biến %DATE%
      datePattern: "YYYY-MM-DD",
      // Chỉ ghi nhận log từ mức độ lỗi "error" trở lên
      level: "error",
      // Tự động xóa các file log cũ đã tồn tại quá 14 ngày
      maxFiles: "14d",
    }),
    // Kênh xoay vòng file lưu toàn bộ log hệ thống (kết hợp cả info, warn, error)
    new DailyRotateFile({
      // Tên file log hệ thống chung
      filename: "logs/combined-%DATE%.log",
      // Định dạng ngày phân tách file
      datePattern: "YYYY-MM-DD",
      // Tự động xóa các file log combined cũ đã quá 14 ngày
      maxFiles: "14d",
    }),
  ],
});
