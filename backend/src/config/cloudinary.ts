import { v2 as cloudinary } from 'cloudinary';

/**
 * Singleton Cloudinary config.
 * Pattern: Singleton — một điểm cấu hình duy nhất cho toàn app.
 *
 * BEFORE: cloudinary.config() bị gọi 2 lần ở 2 chỗ:
 *   - auth.controller.ts
 *   - middlewares/upload.ts
 * AFTER: chỉ export một instance đã cấu hình tại đây.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
