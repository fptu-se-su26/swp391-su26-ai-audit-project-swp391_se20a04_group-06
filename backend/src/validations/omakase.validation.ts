import { z } from "zod";

export const createOmakaseSchema = z.object({
  body: z.object({
    plan: z.enum(["Weekly", "Monthly"]),
    deliveryAddress: z
      .string()
      .min(10, "Địa chỉ giao hàng tối thiểu 10 ký tự")
      .max(300),
    phone: z
      .string()
      .regex(/^(?:\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  }),
});
