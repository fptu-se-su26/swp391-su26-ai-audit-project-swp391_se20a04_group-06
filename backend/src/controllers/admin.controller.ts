import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { sendServerError } from "../helpers/response.helper";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { logger } from "../utils/logger";

export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await adminService.getDashboardStats();
    return res.json(stats);
  } catch (err) {
    logger.error(`getStats error: ${err instanceof Error ? err.message : err}`);
    return sendServerError(res, err);
  }
}

export async function listAllProducts(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const search = ((req.query.search as string) || "").trim();
  const status = (req.query.status as string) || "";

  try {
    const { rows, total } = await adminService.listAllProducts(
      search,
      status,
      offset,
      limit,
    );
    return res.json(paginatedResponse(rows, total, page, limit));
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function listUsers(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const search = ((req.query.search as string) || "").trim();

  try {
    const { formattedRows, total } = await adminService.listUsers(
      search,
      offset,
      limit,
    );
    return res.json(paginatedResponse(formattedRows, total, page, limit));
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function toggleUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const isActive = await adminService.toggleUserActive(id);
    return res.json({ isActive });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function verifyUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const isVerified = await adminService.toggleUserVerification(id);
    return res.json({
      isVerified,
      message: isVerified ? "Đã xác minh tài khoản" : "Đã thu hồi xác minh",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function adminDeleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  const adminId = req.user.userId;
  try {
    await adminService.adminDeleteProduct(id, adminId);
    return res.json({ message: "Admin đã xóa bài đăng thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}
