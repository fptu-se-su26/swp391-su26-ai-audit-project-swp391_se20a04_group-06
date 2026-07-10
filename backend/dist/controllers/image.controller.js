"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadContentImages = uploadContentImages;
exports.uploadImages = uploadImages;
exports.getUploadSignature = getUploadSignature;
exports.deleteImage = deleteImage;
// Import productRepository để thao tác với cơ sở dữ liệu của Sản phẩm
const product_repository_1 = require("../repositories/product.repository");
// Import hàm helper tải ảnh lên và xóa ảnh khỏi Cloudinary từ middleware upload
const upload_1 = require("../middlewares/upload");
// Import các hàm phản hồi lỗi chuẩn hóa từ response helper
const response_helper_1 = require("../helpers/response.helper");
// Import cấu hình Cloudinary dạng singleton đã cài đặt trước đó
const cloudinary_1 = require("../config/cloudinary");
// Import công cụ logger ghi log vết lỗi hệ thống
const logger_1 = require("../utils/logger");
// Import hàm trích xuất Public ID từ URL Cloudinary
const cloudinary_2 = require("../utils/cloudinary");
// Quy định số lượng ảnh tối đa được phép tải lên cho mỗi sản phẩm là 5 ảnh
const MAX_IMAGES = 5;
const CONTENT_UPLOAD_FOLDERS = {
    "boat-logs": "boat_logs",
    "landing-batches": "landing_batches",
    posts: "community_posts",
    recipes: "recipes",
};
/**
 * Upload ảnh nội dung trước khi tạo/cập nhật bản ghi.
 * Chỉ trả về URL Cloudinary bền vững; frontend không được lưu blob/object URL.
 */
async function uploadContentImages(req, res) {
    const files = req.files;
    const scope = req.params.scope;
    const folder = CONTENT_UPLOAD_FOLDERS[scope];
    if (!folder) {
        return res.status(400).json({ message: "Loại nội dung upload không hợp lệ" });
    }
    if (!files?.length) {
        return res.status(400).json({ message: "Chưa chọn ảnh nào" });
    }
    try {
        const uploaded = await Promise.all(files.map((file) => (0, upload_1.uploadToCloudinary)(file.buffer, folder)));
        return res.status(201).json({
            urls: uploaded.map((item) => item.url),
            images: uploaded.map((item) => ({
                url: item.url,
                publicId: item.publicId,
            })),
        });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM TẢI LÊN NHIỀU HÌNH ẢNH CHO MỘT SẢN PHẨM
 */
async function uploadImages(req, res) {
    // Lấy ID người dùng và vai trò (role) từ token xác thực
    const { userId, role } = req.user;
    // Trích xuất và phân tích cú pháp ID sản phẩm từ tham số URL (:id)
    const productId = (0, response_helper_1.parseId)(req.params.id);
    // Lấy mảng tệp tin ảnh gửi từ client thông qua middleware Multer
    const files = req.files;
    // Kiểm tra tính hợp lệ của ID sản phẩm
    if (!productId)
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    // Kiểm tra xem client đã chọn và gửi file ảnh lên chưa
    if (!files || files.length === 0)
        return res.status(400).json({ message: "Chưa chọn ảnh nào" });
    try {
        // Tìm kiếm sản phẩm trong database theo ID
        const prod = await product_repository_1.productRepository.findById(productId);
        // Nếu sản phẩm không tồn tại, trả về lỗi 404
        if (!prod)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        // Kiểm tra quyền sở hữu: chỉ có chủ bài đăng (sellerId) hoặc tài khoản Admin mới được tải ảnh lên
        if (prod.sellerId.toString() !== userId && role !== "Admin")
            return res
                .status(403)
                .json({ message: "Không có quyền tải ảnh cho bài đăng này" });
        // Lấy số lượng ảnh hiện có của sản phẩm
        const currentCount = prod.images.length;
        // Tính toán số lượng ảnh còn được phép tải lên thêm
        const canAdd = MAX_IMAGES - currentCount;
        // Nếu đã đạt hoặc vượt quá giới hạn 5 ảnh, chặn tải lên
        if (canAdd <= 0)
            return res.status(400).json({
                message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.`,
            });
        // Cắt mảng files để chỉ lấy đúng số lượng ảnh được phép tải thêm
        const toUpload = files.slice(0, canAdd);
        // Thực hiện tải đồng thời các ảnh lên Cloudinary thư mục 'seafood'
        const uploadedResults = await Promise.all(toUpload.map((file) => (0, upload_1.uploadToCloudinary)(file.buffer, "seafood")));
        // Lấy ra danh sách các URL ảnh mới tải lên thành công
        const newUrls = uploadedResults.map((item) => item.url);
        // Cập nhật cơ sở dữ liệu: đẩy các URL ảnh mới vào mảng images của sản phẩm
        await product_repository_1.productRepository.findByIdAndUpdate(productId, {
            $push: { images: { $each: newUrls } },
        });
        // Định dạng lại danh sách ảnh vừa upload để phản hồi về cho Client hiển thị
        const uploaded = uploadedResults.map((item, index) => ({
            id: currentCount + index,
            url: item.url,
        }));
        // Trả về mã thành công 201 kèm số lượng ảnh đã upload và danh sách ảnh mới
        return res
            .status(201)
            .json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
    }
    catch (err) {
        // Trả về lỗi server nếu có ngoại lệ xảy ra
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM TẠO CHỮ KÝ BẢO MẬT (SIGNATURE) ĐỂ CLIENT TỰ UPLOAD TRỰC TIẾP LÊN CLOUDINARY
 */
async function getUploadSignature(req, res) {
    try {
        // Tạo timestamp dạng giây hiện tại
        const timestamp = Math.round(new Date().getTime() / 1000);
        // Các tham số cấu hình gửi lên Cloudinary (thời gian và thư mục chứa ảnh)
        const params = { timestamp, folder: "seafood" };
        // Sử dụng SDK Cloudinary ký chữ ký bảo mật bằng API Secret ở Backend để bảo mật thông tin tài khoản
        const signature = cloudinary_1.cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
        // Trả về chữ ký bảo mật và các tham số cần thiết để Client gọi API của Cloudinary trực tiếp
        return res.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: "seafood",
        });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM XÓA MỘT HÌNH ẢNH CỦA SẢN PHẨM KHỎI DATABASE VÀ CLOUDINARY
 */
async function deleteImage(req, res) {
    // Lấy ID người dùng và vai trò để kiểm tra quyền
    const { userId, role } = req.user;
    // Lấy ID ảnh từ tham số đường dẫn (:id)
    const imageId = req.params.id;
    if (!imageId)
        return res.status(400).json({ message: "ID ảnh không hợp lệ" });
    try {
        let targetUrl = imageId;
        // Nếu ID ảnh gửi lên không bắt đầu bằng "http" (thường Client sẽ mã hóa URL ảnh bằng Base64 trước khi truyền lên URL)
        if (!targetUrl.startsWith("http")) {
            try {
                // Giải mã Base64 để lấy lại URL ảnh gốc dạng http
                targetUrl = Buffer.from(imageId, "base64").toString("utf-8");
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ message: "Định dạng ID ảnh không hợp lệ" });
            }
        }
        // Tìm kiếm sản phẩm sở hữu URL ảnh cần xóa
        const prod = await product_repository_1.productRepository.findOne({
            images: targetUrl,
        });
        // Nếu không tìm thấy sản phẩm nào liên kết với ảnh này, trả về lỗi 404
        if (!prod)
            return res
                .status(404)
                .json({ message: "Không tìm thấy ảnh liên kết với sản phẩm" });
        // Kiểm tra quyền: chỉ chủ sản phẩm hoặc Admin mới có quyền xóa ảnh
        if (prod.sellerId.toString() !== userId && role !== "Admin")
            return res.status(403).json({ message: "Không có quyền xoá ảnh này" });
        // Tìm URL ảnh chính xác trong danh sách ảnh của sản phẩm
        const imageUrl = prod.images.find((img) => img === targetUrl);
        if (imageUrl) {
            // Trích xuất publicId (ví dụ: seafood/abc123xyz) từ URL ảnh Cloudinary
            const publicId = (0, cloudinary_2.extractPublicId)(imageUrl);
            if (publicId) {
                // Thực hiện xóa ảnh vật lý trên Cloudinary, không để lỗi này chặn luồng xóa DB
                await (0, upload_1.deleteFromCloudinary)(publicId).catch((cloudinaryErr) => {
                    logger_1.logger.error(`Cloudinary deletion failed for publicId ${publicId}: ${cloudinaryErr.message}`);
                });
            }
            // Lọc bỏ URL ảnh khỏi danh sách ảnh của sản phẩm
            prod.images = prod.images.filter((img) => img !== imageUrl);
            // Lưu lại thay đổi vào MongoDB
            await prod.save();
        }
        // Phản hồi kết quả xóa ảnh thành công về cho Client
        return res.json({ message: "Đã xoá ảnh thành công" });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
