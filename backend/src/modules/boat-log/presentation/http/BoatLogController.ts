import { Request, Response, NextFunction } from "express";
import { parseId } from "../../../../helpers/response.helper";
import { boatLogService } from "../../../../services/boatLog.service";

// DDD Components
import { MongooseBoatLogRepository } from "../../infrastructure/persistence/mongoose/MongooseBoatLogRepository";
import { CreateBoatLogUseCase } from "../../application/use-cases/CreateBoatLogUseCase";
import { DeleteBoatLogUseCase } from "../../application/use-cases/DeleteBoatLogUseCase";
import { ToggleLikeBoatLogUseCase } from "../../application/use-cases/ToggleLikeBoatLogUseCase";

const boatLogRepository = new MongooseBoatLogRepository();
const createBoatLogUseCase = new CreateBoatLogUseCase(boatLogRepository);
const deleteBoatLogUseCase = new DeleteBoatLogUseCase(boatLogRepository);
const toggleLikeBoatLogUseCase = new ToggleLikeBoatLogUseCase(boatLogRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────

/**
 * Lấy danh sách các Nhật ký Cabin (hỗ trợ phân trang, lọc theo userId).
 */
export async function getBoatLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await boatLogService.list(req.query as any);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────

/**
 * Tạo mới một Nhật ký Cabin.
 */
export async function createBoatLog(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.user;
  try {
    const log = await createBoatLogUseCase.execute(userId, req.body);
    return res.status(201).json({
      message: "Đăng nhật ký cabin thành công",
      boatLog: log.toProps(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Thích hoặc bỏ thích Nhật ký Cabin.
 */
export async function toggleLikeBoatLog(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    const result = await toggleLikeBoatLogUseCase.execute(id, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa một Nhật ký Cabin.
 */
export async function deleteBoatLog(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    await deleteBoatLogUseCase.execute(id, userId, role);
    return res.json({ message: "Xóa nhật ký cabin thành công" });
  } catch (err) {
    next(err);
  }
}
