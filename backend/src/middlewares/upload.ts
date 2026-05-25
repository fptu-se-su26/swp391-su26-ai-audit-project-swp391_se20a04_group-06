import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response, NextFunction } from 'express';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Lưu file vào memory (buffer) trước, rồi stream lên Cloudinary */
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ chấp nhận ảnh JPEG, PNG, WEBP'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB / ảnh — hard limit
    files: 5,                    // Tối đa 5 ảnh / request
  },
});

/**
 * Middleware xử lý lỗi multer — đặt sau upload middleware.
 * Trả về 400 thay vì 500 khi file quá lớn hoặc sai format.
 */
export function handleUploadError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File ảnh quá lớn. Tối đa 5MB mỗi ảnh.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Tối đa 5 ảnh mỗi lần upload.' });
    }
    return res.status(400).json({ message: `Upload lỗi: ${err.message}` });
  }
  if (err?.message?.includes('Chỉ chấp nhận')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
}

/* Upload 1 buffer lên Cloudinary, trả về { url, publicId } */
export function uploadToCloudinary(
  buffer: Buffer,
  folder = 'seafood',
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',        // Cloudinary tự chọn quality tốt nhất
        fetch_format: 'auto',   // Tự chuyển sang WebP/AVIF nếu browser hỗ trợ
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload thất bại'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* Xoá ảnh khỏi Cloudinary */
export function deleteFromCloudinary(publicId: string): Promise<void> {
  return cloudinary.uploader.destroy(publicId).then(() => undefined);
}
