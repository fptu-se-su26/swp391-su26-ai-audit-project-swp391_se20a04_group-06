"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productUpdateSchema = exports.productCreateSchema = void 0;
// Import thư viện Zod để xây dựng cấu trúc schemas xác thực dữ liệu đầu vào cho sản phẩm mẻ hàng
const zod_1 = require("zod");
// Định nghĩa các trường dữ liệu chung của sản phẩm mẻ hàng phục vụ tái sử dụng ở nhiều schema
const productBodyFields = {
    // Loại hải sản: Chỉ chấp nhận "Fresh" (Tươi sống) hoặc "Dried" (Đồ khô) với thông báo lỗi đi kèm
    type: zod_1.z.enum(["Fresh", "Dried"], {
        message: "Loại hải sản tươi hoặc khô là bắt buộc",
    }),
    // Danh mục cụ thể: Chỉ chấp nhận các giá trị quy định sẵn đại diện cho các dòng hải sản khác nhau
    category: zod_1.z.enum(["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"], { message: "Nhãn phân loại chi tiết là bắt buộc" }),
    // Tên mẻ hàng: Phải là chuỗi ký tự có độ dài từ 2 đến 150 ký tự
    name: zod_1.z
        .string({ message: "Tên mẻ hàng bắt buộc nhập" })
        .min(2, "Tên quá ngắn")
        .max(150, "Tên quá dài"),
    // Đơn giá bán: Tiền xử lý (preprocess) chuyển đổi đầu vào sang kiểu số và bắt buộc phải là số dương lớn hơn 0
    price: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive("Đơn giá phải lớn hơn 0")),
    // Tổng khối lượng: Tiền xử lý chuyển đổi đầu vào sang số và bắt buộc là số dương lớn hơn 0
    totalWeight: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive("Khối lượng phải lớn hơn 0")),
    // Hình thức bán: Tùy chọn (Retail - Bán lẻ, Wholesale - Bán buôn)
    salesType: zod_1.z.enum(["Retail", "Wholesale"]).optional(),
    // Mô tả sản phẩm: Trường văn bản tùy chọn
    description: zod_1.z.string().optional(),
    // Thời điểm đánh bắt: Định dạng chuỗi ngày tháng tùy chọn và cho phép nhận giá trị null
    catchTime: zod_1.z.string().optional().nullable(),
    // KHẮC PHỤC LỖI FALSY ZERO: Đảm bảo số 0 vẫn được parse chính xác thay vì bị chuyển thành undefined
    // Vĩ độ GPS bán hàng: Tiền xử lý an toàn để giữ lại giá trị số 0, giới hạn khoảng từ -90 đến 90 vĩ độ
    lat: zod_1.z.preprocess((val) => val !== undefined && val !== "" && val !== null ? Number(val) : undefined, zod_1.z.number().min(-90).max(90).optional()),
    // Kinh độ GPS bán hàng: Tiền xử lý an toàn giữ giá trị số 0, giới hạn khoảng từ -180 đến 180 kinh độ
    lng: zod_1.z.preprocess((val) => val !== undefined && val !== "" && val !== null ? Number(val) : undefined, zod_1.z.number().min(-180).max(180).optional()),
    // Vĩ độ GPS vùng đánh bắt hải sản: Giới hạn khoảng vĩ độ hợp lệ
    catchLat: zod_1.z.preprocess((val) => val !== undefined && val !== "" && val !== null ? Number(val) : undefined, zod_1.z.number().min(-90).max(90).optional()),
    // Kinh độ GPS vùng đánh bắt hải sản: Giới hạn khoảng kinh độ hợp lệ
    catchLng: zod_1.z.preprocess((val) => val !== undefined && val !== "" && val !== null ? Number(val) : undefined, zod_1.z.number().min(-180).max(180).optional()),
    // Nguồn gốc xuất xứ: Trường văn bản tùy chọn
    origin: zod_1.z.string().optional(),
    // Ngày hết hạn: Trường văn bản tùy chọn
    expiryDate: zod_1.z.string().optional(),
    // Khối lượng còn lại: Tiền xử lý chuyển đổi số, phải không âm và là tùy chọn
    remainingWeight: zod_1.z.preprocess((val) => (val !== undefined ? Number(val) : undefined), zod_1.z.number().nonnegative("Khối lượng còn lại không được nhỏ hơn 0").optional()),
    // Trạng thái mẻ hàng: Chỉ chấp nhận "Active", "Expired" hoặc "Deleted"
    status: zod_1.z.enum(["Active", "Expired", "Deleted"]).optional(),
    // Danh sách mảng hình ảnh mẻ hàng: Tùy chọn
    images: zod_1.z.array(zod_1.z.string()).optional(),
    // Kích thước hải sản: Tùy chọn
    productSize: zod_1.z.enum(["LARGE", "MEDIUM", "SMALL"]).optional(),
};
// KHẮC PHỤC LỖI MEDIUM: Ràng buộc so khớp logic khối lượng còn lại không thể lớn hơn tổng khối lượng
// Xuất ra schema kiểm thực dữ liệu khi tạo mới sản phẩm mẻ hàng
exports.productCreateSchema = zod_1.z.object({
    body: zod_1.z
        .object(productBodyFields)
        .refine((data) => {
        const hasLat = data.lat !== undefined;
        const hasLng = data.lng !== undefined;
        return hasLat === hasLng;
    }, {
        message: "Vĩ độ (lat) và kinh độ (lng) phải đi kèm cùng nhau",
        path: ["lng"],
    })
        .refine((data) => {
        const hasCatchLat = data.catchLat !== undefined;
        const hasCatchLng = data.catchLng !== undefined;
        return hasCatchLat === hasCatchLng;
    }, {
        message: "Vĩ độ đánh bắt (catchLat) và kinh độ đánh bắt (catchLng) phải đi kèm cùng nhau",
        path: ["catchLng"],
    })
        .refine((data) => {
        if (data.remainingWeight !== undefined) {
            return data.remainingWeight <= data.totalWeight;
        }
        return true;
    }, {
        message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
        path: ["remainingWeight"],
    }),
});
// Xuất ra schema kiểm thực dữ liệu khi cập nhật thông tin sản phẩm mẻ hàng
exports.productUpdateSchema = zod_1.z.object({
    body: zod_1.z
        .object(productBodyFields)
        .partial()
        .refine((data) => {
        const hasLat = data.lat !== undefined;
        const hasLng = data.lng !== undefined;
        return hasLat === hasLng;
    }, {
        message: "Vĩ độ (lat) và kinh độ (lng) phải đi kèm cùng nhau",
        path: ["lng"],
    })
        .refine((data) => {
        const hasCatchLat = data.catchLat !== undefined;
        const hasCatchLng = data.catchLng !== undefined;
        return hasCatchLat === hasCatchLng;
    }, {
        message: "Vĩ độ đánh bắt (catchLat) và kinh độ đánh bắt (catchLng) phải đi kèm cùng nhau",
        path: ["catchLng"],
    })
        .refine((data) => {
        if (data.remainingWeight !== undefined &&
            data.totalWeight !== undefined) {
            return data.remainingWeight <= data.totalWeight;
        }
        return true;
    }, {
        message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
        path: ["remainingWeight"],
    }),
});
