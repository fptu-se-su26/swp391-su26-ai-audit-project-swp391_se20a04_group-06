import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Lý do báo cáo không được để trống"),
  }),
});

export const handleReportSchema = z.object({
  body: z.object({
    action: z.enum(["resolve", "dismiss"] as const),
    adminNote: z.string().optional(),
  }),
});
