import { z } from "zod";

const productBodyFields = {
  type: z.enum(["Fresh", "Dried"] as const, {
    message: "Loại hải sản tươi hoặc khô là bắt buộc",
  }),
  category: z.enum(
    ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"] as const,
    { message: "Nhãn phân loại chi tiết là bắt buộc" },
  ),
  name: z
    .string({ message: "Tên mẻ hàng bắt buộc nhập" })
    .min(2, "Tên quá ngắn")
    .max(150, "Tên quá dài"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Đơn giá phải lớn hơn 0"),
  ),
  totalWeight: z.preprocess(
    (val) => Number(val),
    z.number().positive("Khối lượng phải lớn hơn 0"),
  ),
  salesType: z.enum(["Retail", "Wholesale"] as const).optional(),
  description: z.string().optional(),
  catchTime: z.string().optional().nullable(),

  // KHẮC PHỤC LỖI FALSY ZERO: Đảm bảo số 0 vẫn được parse chính xác thay vì bị chuyển thành undefined
  lat: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-90).max(90).optional(),
  ),
  lng: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-180).max(180).optional(),
  ),
  catchLat: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-90).max(90).optional(),
  ),
  catchLng: z.preprocess(
    (val) =>
      val !== undefined && val !== "" && val !== null ? Number(val) : undefined,
    z.number().min(-180).max(180).optional(),
  ),

  origin: z.string().optional(),
  expiryDate: z.string().optional(),
  remainingWeight: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().positive("Khối lượng còn lại phải lớn hơn 0").optional(),
  ),
  status: z.enum(["Active", "Expired", "Deleted"] as const).optional(),
  images: z.array(z.string()).optional(),
};

// KHẮC PHỤC LỖI MEDIUM: Ràng buộc so khớp logic khối lượng còn lại không thể lớn hơn tổng khối lượng
export const productCreateSchema = z.object({
  body: z.object(productBodyFields).refine(
    (data) => {
      if (data.remainingWeight !== undefined) {
        return data.remainingWeight <= data.totalWeight;
      }
      return true;
    },
    {
      message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
      path: ["remainingWeight"],
    },
  ),
});

export const productUpdateSchema = z.object({
  body: z
    .object(productBodyFields)
    .partial()
    .refine(
      (data) => {
        if (
          data.remainingWeight !== undefined &&
          data.totalWeight !== undefined
        ) {
          return data.remainingWeight <= data.totalWeight;
        }
        return true;
      },
      {
        message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
        path: ["remainingWeight"],
      },
    ),
});
