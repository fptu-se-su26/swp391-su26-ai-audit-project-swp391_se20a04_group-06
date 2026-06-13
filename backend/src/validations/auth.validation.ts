import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Tên phải từ 2 đến 100 ký tự").max(100),
    email: z.string().email("Email không hợp lệ").optional(),
  }),
});
