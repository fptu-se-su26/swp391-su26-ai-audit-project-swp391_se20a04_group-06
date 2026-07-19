// Import thư viện Zod để xây dựng cấu trúc schemas xác thực dữ liệu đầu vào cho sản phẩm mẻ hàng
import { z } from "zod";

// Định nghĩa các trường dữ liệu chung của sản phẩm mẻ hàng phục vụ tái sử dụng ở nhiều schema
const productBodyFields = {
  // Loại hải sản: Chỉ chấp nhận "Fresh" (Tươi sống) hoặc "Dried" (Đồ khô) với thông báo lỗi đi kèm
  type: z.enum(["Fresh", "Dried"] as const, {
    message: "Loại hải sản tươi hoặc khô là bắt buộc",
  }),
  // Danh mục cụ thể: Chỉ chấp nhận các giá trị quy định sẵn đại diện cho các dòng hải sản khác nhau
  category: z.enum(
    ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"] as const,
    { message: "Nhãn phân loại chi tiết là bắt buộc" },
  ),
  // Tên mẻ hàng: Phải là chuỗi ký tự có độ dài từ 2 đến 150 ký tự
  name: z
    .string({ message: "Tên mẻ hàng bắt buộc nhập" })
    .min(2, "Tên quá ngắn")
    .max(150, "Tên quá dài"),
  // Đơn giá bán: Tiền xử lý (preprocess) chuyển đổi đầu vào sang kiểu số và bắt buộc phải là số dương lớn hơn 0
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Đơn giá phải lớn hơn 0"),
  ),
  // Tổng khối lượng: Tiền xử lý chuyển đổi đầu vào sang số và bắt buộc là số dương lớn hơn 0
  totalWeight: z.preprocess(
    (val) => Number(val),
    z.number().positive("Khối lượng phải lớn hơn 0"),
  ),
  // Hình thức bán: Tùy chọn (Retail - Bán lẻ, Wholesale - Bán buôn)
  salesType: z.enum(["Retail", "Wholesale"] as const).optional(),
  // Mô tả sản phẩm: Trường văn bản tùy chọn
  description: z.string().optional(),
  // Thời điểm đánh bắt: Định dạng chuỗi ngày tháng tùy chọn và cho phép nhận giá trị null
  catchTime: z.string().optional().nullable(),

  // KHẮC PHỤC LỖI FALSY ZERO: Đảm bảo số 0 vẫn được parse chính xác thay vì bị chuyển thành undefined
  // Vĩ độ GPS bán hàng: Tiền xử lý an toàn để giữ lại giá trị số 0, giới hạn khoảng từ -90 đến 90 vĩ độ
  lat: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-90).max(90).optional(),
  ),
  // Kinh độ GPS bán hàng: Tiền xử lý an toàn giữ giá trị số 0, giới hạn khoảng từ -180 đến 180 kinh độ
  lng: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-180).max(180).optional(),
  ),
  // Vĩ độ GPS vùng đánh bắt hải sản: Giới hạn khoảng vĩ độ hợp lệ
  catchLat: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-90).max(90).optional(),
  ),
  // Kinh độ GPS vùng đánh bắt hải sản: Giới hạn khoảng kinh độ hợp lệ
  catchLng: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-180).max(180).optional(),
  ),

  // Nguồn gốc xuất xứ: Trường văn bản tùy chọn
  origin: z.string().optional(),
  // Ngày hết hạn: Trường văn bản tùy chọn
  expiryDate: z.string().optional(),
  // Khối lượng còn lại: Tiền xử lý chuyển đổi số, phải không âm và là tùy chọn
  remainingWeight: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().nonnegative("Khối lượng còn lại không được nhỏ hơn 0").optional(),
  ),
  // Trạng thái mẻ hàng: Chỉ chấp nhận "Active", "Expired" hoặc "Deleted"
  status: z.enum(["Active", "Expired", "Deleted"] as const).optional(),
  // Danh sách mảng hình ảnh mẻ hàng: Tùy chọn
  images: z.array(z.string()).optional(),
  // Kích thước hải sản: Tùy chọn
  productSize: z.enum(["LARGE", "MEDIUM", "SMALL"] as const).optional(),
};

// KHẮC PHỤC LỖI MEDIUM: Ràng buộc so khớp logic khối lượng còn lại không thể lớn hơn tổng khối lượng
// Xuất ra schema kiểm thực dữ liệu khi tạo mới sản phẩm mẻ hàng
export const productCreateSchema = z.object({
  // Kiểm thực đối tượng body sử dụng bộ trường chung đã định nghĩa
  body: z.object(productBodyFields).refine(
    // Hàm sàng lọc (refine) kiểm tra tính hợp lý giữa khối lượng còn lại và tổng khối lượng
    (data) => {
      // Nếu khối lượng còn lại được cung cấp
      if (data.remainingWeight !== undefined) {
        // Trả về true nếu khối lượng còn lại nhỏ hơn hoặc bằng tổng khối lượng ban đầu
        return data.remainingWeight <= data.totalWeight;
      }
      // Trả về true nếu không cung cấp thuộc tính này
      return true;
    },
    {
      // Thông báo lỗi tùy chỉnh hiển thị khi điều kiện sàng lọc thất bại
      message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
      // Đường dẫn lỗi ánh xạ tới thuộc tính remainingWeight
      path: ["remainingWeight"],
    },
  ),
});

// Xuất ra schema kiểm thực dữ liệu khi cập nhật thông tin sản phẩm mẻ hàng
export const productUpdateSchema = z.object({
  // Lấy các trường chung và chuyển đổi chúng sang dạng tùy chọn toàn bộ bằng partial()
  body: z
    .object(productBodyFields)
    .partial()
    // Hàm sàng lọc kiểm tra chéo tương tự schema tạo mới
    .refine(
      (data) => {
        // Chỉ tiến hành so sánh nếu cả hai thuộc tính khối lượng đều được gửi lên cập nhật
        if (
          data.remainingWeight !== undefined &&
          data.totalWeight !== undefined
        ) {
          // Khối lượng còn lại phải nhỏ hơn hoặc bằng tổng khối lượng
          return data.remainingWeight <= data.totalWeight;
        }
        // Trả về true nếu thiếu 1 trong 2 thuộc tính để so sánh
        return true;
      },
      {
        // Thông điệp báo lỗi cụ thể
        message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
        // Đường dẫn trả lỗi
        path: ["remainingWeight"],
      },
    ),
});
