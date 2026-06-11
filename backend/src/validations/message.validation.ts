import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const sendMessageSchema = z.object({
  body: z.object({
    productId: z.string().regex(objectIdRegex, "ID sản phẩm không hợp lệ"),
    receiverId: z.string().regex(objectIdRegex, "ID người nhận không hợp lệ"),
    content: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
      })
      .optional()
      .nullable(),
  }),
});
