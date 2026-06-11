import { z } from "zod";

export const createBoatLogSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Nội dung nhật ký cabin không được để trống"),
    images: z.array(z.string()).optional(),
  }),
});
