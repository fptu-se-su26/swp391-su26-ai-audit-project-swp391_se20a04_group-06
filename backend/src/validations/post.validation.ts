import { z } from "zod";

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    content: z.string().min(1, "Nội dung không được để trống"),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Nội dung bình luận không được để trống")
      .max(1000, "Bình luận tối đa 1000 ký tự"),
  }),
});
