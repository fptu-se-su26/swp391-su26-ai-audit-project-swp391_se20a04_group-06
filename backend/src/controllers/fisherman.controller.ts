import { Request, Response } from "express";
import { fishermanService } from "../services/fisherman.service";
import { sendServerError } from "../helpers/response.helper";

export async function listFishermen(req: Request, res: Response) {
  try {
    const result = await fishermanService.list(req.query);
    return res.json(result);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Lỗi server khi tải danh sách ngư dân" });
  }
}

export async function getFishermanProfile(req: Request, res: Response) {
  try {
    const profile = await fishermanService.getProfile(req.params.id);
    return res.json(profile);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return res
      .status(500)
      .json({ message: "Lỗi server khi tải hồ sơ ngư dân" });
  }
}

export async function getFishermanProducts(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page, limit, includeExpired } = req.query as any;
    const {
      products,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getProducts(id, page, limit, includeExpired);
    return res.json({
      data: products,
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getFishermanRecipes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const {
      recipes,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getRecipes(id, page, limit);
    return res.json({
      data: recipes,
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getFishermanPosts(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const {
      posts,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getPosts(id, page, limit);
    return res.json({
      data: posts,
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getFishermanBoatLogs(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const {
      boatLogs,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getBoatLogs(id, page, limit);
    return res.json({
      data: boatLogs,
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}
