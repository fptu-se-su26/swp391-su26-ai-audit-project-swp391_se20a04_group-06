import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "ID sản phẩm không được để trống"),
    sellerId: z.string().min(1, "ID người bán không được để trống"),
    rating: z.preprocess(
      (val) => Number(val),
      z
        .number()
        .min(1, "Đánh giá tối thiểu 1 sao")
        .max(5, "Đánh giá tối đa 5 sao"),
    ),
    comment: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
  }),
});
