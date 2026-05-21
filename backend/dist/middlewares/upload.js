"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/* Lưu file vào memory (buffer) trước, rồi stream lên Cloudinary */
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype))
        cb(null, true);
    else
        cb(new Error('Chỉ chấp nhận ảnh JPEG, PNG, WEBP'));
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB / ảnh
});
/* Upload 1 buffer lên Cloudinary, trả về { url, publicId } */
function uploadToCloudinary(buffer, folder = 'seafood') {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' }, (err, result) => {
            if (err || !result)
                return reject(err ?? new Error('Upload thất bại'));
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        streamifier_1.default.createReadStream(buffer).pipe(stream);
    });
}
/* Xoá ảnh khỏi Cloudinary */
function deleteFromCloudinary(publicId) {
    return cloudinary_1.v2.uploader.destroy(publicId).then(() => undefined);
}
