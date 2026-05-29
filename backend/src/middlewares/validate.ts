import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Middleware kiểm duyệt Schema Zod v4 tập trung
export const validateSchema = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ép kiểu tường minh về dạng đối tượng chứa body/query/params để vượt qua kiểm tra nghiêm ngặt
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: any; query?: any; params?: any };

      // Cập nhật lại dữ liệu đã qua tiền xử lý, ép kiểu từ Zod vào Request
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Dữ liệu đầu vào không hợp lệ",
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
