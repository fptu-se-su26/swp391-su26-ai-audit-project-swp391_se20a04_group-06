/// <reference path="../types/streamifier.d.ts" />
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import streamifier from "streamifier";
import { cloudinary } from "../config/cloudinary";

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ chấp nhận ảnh JPEG, PNG, WEBP"));
};

// [FIX HIGH] Giảm dung lượng từ 5MB xuống 2MB để tránh OOM (Out of Memory) trên máy chủ
// YÊU CẦU: Frontend (React/Next) NÊN nén ảnh (compress) trước khi gọi API upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Tối đa 2 MB / ảnh (Ngăn Nodejs ngốn RAM)
    files: 5, // Tối đa 5 ảnh / request
  },
});

/** Middleware xử lý lỗi multer — trả về 400 thay vì 500 */
export function handleUploadError(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({
          message:
            "File ảnh quá lớn. Tối đa 2MB mỗi ảnh. Vui lòng thu nhỏ ảnh.",
        });
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ message: "Tối đa 5 ảnh mỗi lần upload." });
    return res.status(400).json({ message: `Upload lỗi: ${err.message}` });
  }
  if (err?.message?.includes("Chỉ chấp nhận"))
    return res.status(400).json({ message: err.message });
  next(err);
}

/** Upload một buffer lên Cloudinary, trả về { url, publicId } kèm cơ chế Timeout */
export function uploadToCloudinary(
  buffer: Buffer,
  folder = "seafood",
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    // Ngắt luồng tải lên nếu vượt quá 15 giây
    const timeout = setTimeout(() => {
      reject(
        new Error("Tải lên Cloudinary thất bại do hết thời gian chờ (Timeout)"),
      );
    }, 15000);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
      },
      (err, result) => {
        clearTimeout(timeout);
        if (err || !result) return reject(err ?? new Error("Upload thất bại"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/** Xoá ảnh khỏi Cloudinary */
export function deleteFromCloudinary(publicId: string): Promise<void> {
  return cloudinary.uploader.destroy(publicId).then(() => undefined);
}
