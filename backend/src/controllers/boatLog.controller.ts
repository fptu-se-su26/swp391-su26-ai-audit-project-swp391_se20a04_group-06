import { Request, Response } from "express";
import { boatLogService } from "../services/boatLog.service";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getBoatLogs(req: Request, res: Response) {
  try {
    const result = await boatLogService.list(req.query as any);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function createBoatLog(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const log = await boatLogService.create(userId, req.body);
    return res
      .status(201)
      .json({ message: "Đăng nhật ký cabin thành công", boatLog: log });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function toggleLikeBoatLog(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    const result = await boatLogService.toggleLike(id, userId);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deleteBoatLog(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    await boatLogService.delete(id, userId, role);
    return res.json({ message: "Xóa nhật ký cabin thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}
