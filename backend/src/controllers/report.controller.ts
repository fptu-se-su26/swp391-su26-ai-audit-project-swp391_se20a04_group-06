import { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { sendServerError } from "../helpers/response.helper";
import { parsePagination } from "../utils/pagination";

export async function createReport(req: Request, res: Response) {
  const { userId } = req.user;
  const { productId } = req.params;
  const { reason } = req.body;

  try {
    await reportService.createReport(userId, productId, reason);
    return res.json({ message: "Báo cáo đã gửi thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getReports(req: Request, res: Response) {
  const queryStatus = (req.query.status as string) || "Pending";
  if (!["Pending", "Resolved", "Dismissed"].includes(queryStatus)) {
    return res.status(400).json({ message: "Trạng thái báo cáo không hợp lệ" });
  }

  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
    100,
  );

  try {
    const { formattedRows, total } = await reportService.listReports(
      queryStatus as any,
      offset,
      limit,
    );

    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function handleReport(req: Request, res: Response) {
  const reportId = req.params.id;
  const { action, adminNote } = req.body;
  const adminId = req.user.userId;

  try {
    await reportService.handleReport(reportId, action, adminNote, adminId);
    return res.json({
      message: "Đã xử lý báo cáo và dọn dẹp tài nguyên thành công!",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}
