import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, json } = winston.format;

// Định dạng log hiển thị trực quan ngoài console phát triển
const consoleLogFormat = printf(
  ({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  },
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(), // Lưu log dạng JSON phục vụ các hệ thống phân tích như ELK Stack
  ),
  transports: [
    // In ra Console có màu sắc sắc nét
    new winston.transports.Console({
      format: combine(colorize(), consoleLogFormat),
    }),
    // Xoay vòng file lưu trữ lỗi riêng biệt
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
    }),
    // Xoay vòng file lưu thông tin hệ thống chung
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
    }),
  ],
});
