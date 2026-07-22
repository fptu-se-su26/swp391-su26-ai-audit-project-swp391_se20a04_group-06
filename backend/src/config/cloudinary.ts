// Import thư viện quản lý ảnh/video Cloudinary phiên bản v2
import { v2 as cloudinary } from 'cloudinary';
import { Writable } from 'stream';

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("⚠️ [Cloudinary] API keys are not configured in .env. Mock fallback activated.");

  // Mock upload_stream
  cloudinary.uploader.upload_stream = function (options: any, callback: any) {
    const cb = typeof options === 'function' ? options : callback;
    const folder = typeof options === 'object' ? options.folder : 'seafood';
    
    const mockStream = new Writable({
      write(chunk, encoding, next) {
        next();
      }
    });

    mockStream.on('finish', () => {
      process.nextTick(() => {
        if (cb) {
          const isAvatar = folder === 'avatars';
          const mockUrl = isAvatar
            ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
            : "https://images.unsplash.com/photo-1534080391025-a87b998a23e4?auto=format&fit=crop&w=600&q=80";
          
          cb(null, {
            secure_url: mockUrl,
            url: mockUrl,
            public_id: "mock_cloudinary_placeholder"
          });
        }
      });
    });

    return mockStream as any;
  } as any;

  // Mock destroy
  cloudinary.uploader.destroy = function () {
    return Promise.resolve({ result: "ok" });
  } as any;

  // Mock api.delete_resources
  (cloudinary as any).api = {
    delete_resources: function () {
      return Promise.resolve({ deleted: {} });
    }
  } as any;
}

// Xuất (export) thực thể cloudinary đã cấu hình để các Service/Controller khác import sử dụng trực tiếp
export { cloudinary };
