import { z } from "zod";

const vietnamesePhoneRegex = /^(0|84|\+84)(3|5|7|8|9)\d{8}$/;

export const createSubscriptionSchema = z.object({
  body: z.object({
    packageType: z.enum(["Small", "Medium", "Large"], {
      message: "Gói đăng ký phải là Small, Medium hoặc Large",
    }),
    frequency: z.enum(["Weekly", "BiWeekly", "Monthly"], {
      message: "Tần suất giao hàng phải là Weekly, BiWeekly hoặc Monthly",
    }),
    preferredDay: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], {
      message: "Ngày nhận hàng mong muốn không hợp lệ",
    }),
    shippingAddress: z.string().min(5, "Địa chỉ nhận hàng phải từ 5 ký tự trở lên").max(500, "Địa chỉ quá dài"),
    phone: z.string().regex(vietnamesePhoneRegex, "Số điện thoại Việt Nam không hợp lệ (ví dụ: 0912345678)"),
    note: z.string().max(1000, "Ghi chú không quá 1000 ký tự").optional().nullable(),
  }),
});
