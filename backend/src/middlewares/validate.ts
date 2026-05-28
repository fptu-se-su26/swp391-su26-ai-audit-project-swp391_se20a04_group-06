import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod"; // 🌟 Dùng ZodType và loại bỏ ZodSchema đã bị deprecated

// Middleware kiểm duyệt Schema Zod v4 tập trung
export const validateSchema = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Dữ liệu đầu vào không hợp lệ",
          // 🌟 Sửa đổi .errors thành .issues cho Zod v4
          errors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
