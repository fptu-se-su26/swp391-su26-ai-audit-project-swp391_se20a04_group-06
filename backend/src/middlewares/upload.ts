/// <reference path="../types/streamifier.d.ts" />
// Import thư viện multer để xử lý tải lên tệp tin dạng multipart/form-data
import multer from "multer";
// Import các kiểu dữ liệu của Express
import { Request, Response, NextFunction } from "express";
// Import thư viện streamifier để chuyển đổi bộ đệm Buffer thành luồng đọc dữ liệu (Read Stream)
import streamifier from "streamifier";
// Import cấu hình Cloudinary để tải ảnh lên máy chủ đám mây
import { cloudinary } from "../config/cloudinary";

// Cấu hình lưu trữ bộ đệm ảnh trong RAM (Memory Storage) để dễ dàng chuyển tiếp lên Cloudinary mà không cần lưu tạm ở ổ cứng máy chủ
const storage = multer.memoryStorage();

/**
 * BỘ LỌC ĐỊNH DẠNG TỆP TIN: Chỉ cho phép tải lên các định dạng ảnh JPEG, PNG, WEBP phổ biến
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  // Nếu loại tệp tin (mimetype) nằm trong danh sách cho phép, gọi callback(null, true)
  if (allowed.includes(file.mimetype)) cb(null, true);
  // Ngược lại, trả về lỗi báo định dạng không được hỗ trợ
  else cb(new Error("Chỉ chấp nhận ảnh JPEG, PNG, WEBP"));
};

// [FIX HIGH] Giảm dung lượng từ 5MB xuống 2MB để tránh OOM (Out of Memory) trên máy chủ Node.js khi xử lý đồng thời nhiều ảnh lớn
// YÊU CẦU: Phía Frontend (React/Next) NÊN nén ảnh (compress) trước khi gửi yêu cầu gọi API upload để tối ưu hóa băng thông
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Giới hạn kích thước tối đa 2 MB mỗi file ảnh (Ngăn Nodejs ngốn RAM đột biến)
    files: 5,                  // Giới hạn tối đa 5 file ảnh trong mỗi yêu cầu gửi lên
  },
});

/** 
 * MIDDLEWARE XỬ LÝ LỖI PHÁT SINH TỪ MULTER (Xử lý các lỗi vượt giới hạn tệp tin hoặc số lượng)
 * Chuyển các lỗi này về định dạng HTTP 400 Bad Request kèm thông điệp tiếng Việt dễ hiểu
 */
export function handleUploadError(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // Nếu lỗi thuộc nhóm lỗi của thư viện Multer
  if (err instanceof multer.MulterError) {
    // Lỗi tệp tin vượt quá dung lượng 2MB cấu hình ở trên
    if (err.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({
          message:
            "File ảnh quá lớn. Tối đa 2MB mỗi ảnh. Vui lòng thu nhỏ ảnh.",
        });
    // Lỗi số lượng tệp tin gửi vượt quá 5 ảnh
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ message: "Tối đa 5 ảnh mỗi lần upload." });
    // Các lỗi Multer khác
    return res.status(400).json({ message: `Upload lỗi: ${err.message}` });
  }
  // Nếu lỗi do bộ lọc định dạng ảnh fileFilter ném ra
  if (err?.message?.includes("Chỉ chấp nhận"))
    return res.status(400).json({ message: err.message });
  // Chuyển các lỗi không xác định khác cho middleware xử lý lỗi tiếp theo
  next(err);
}

/** 
 * HÀM TIỆN ÍCH TẢI LÊN MỘT BUFFER ẢNH LÊN CLOUDINARY (TRẢ VỀ HỨA HẸN PROMISE URL VÀ PUBLICID)
 * Tích hợp cơ chế Timeout tự động ngắt kết nối nếu thời gian tải lên quá lâu
 */
export function uploadToCloudinary(
  buffer: Buffer,
  folder = "seafood",
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    // Thiết lập cơ chế tự động ngắt (Timeout): ngắt luồng tải lên và ném lỗi nếu quá 15 giây mà chưa hoàn tất
    const timeout = setTimeout(() => {
      reject(
        new Error("Tải lên Cloudinary thất bại do hết thời gian chờ (Timeout)"),
      );
    }, 15000);

    // Khởi tạo luồng tải lên (Upload Stream) của SDK Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,                      // Thư mục chứa ảnh trên Cloudinary
        resource_type: "image",      // Loại tài nguyên là hình ảnh
        quality: "auto",             // Tự động tối ưu hóa chất lượng nén ảnh
        fetch_format: "auto",        // Tự động chuyển đổi định dạng ảnh phù hợp với thiết bị người dùng (như WEBP)
      },
      (err, result) => {
        // Hủy bỏ bộ đếm thời gian Timeout khi nhận được phản hồi (thành công hoặc thất bại)
        clearTimeout(timeout);
        // Nếu xảy ra lỗi hoặc kết quả trống, ném lỗi từ chối Promise
        if (err || !result) return reject(err ?? new Error("Upload thất bại"));
        // Trả về kết quả gồm URL ảnh bảo mật (secure_url) và mã định danh ảnh (public_id) trên Cloudinary
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    // Chuyển bộ đệm Buffer trong bộ nhớ thành một luồng đọc và truyền (pipe) dữ liệu trực tiếp vào luồng tải lên của Cloudinary
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/** 
 * HÀM TIỆN ÍCH XÓA ẢNH KHỎI MÁY CHỦ CLOUDINARY QUA PUBLIC ID
 */
export function deleteFromCloudinary(publicId: string): Promise<void> {
  // Gọi SDK Cloudinary thực thi lệnh destroy để xóa tài nguyên và trả về promise rỗng
  return cloudinary.uploader.destroy(publicId).then(() => undefined);
}

