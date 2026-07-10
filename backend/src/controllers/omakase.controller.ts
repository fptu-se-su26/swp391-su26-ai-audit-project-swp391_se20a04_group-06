import { NextFunction, Request, Response } from "express";
import { omakaseService } from "../services/omakase.service";

export async function getMyOmakase(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subscription = await omakaseService.getMine(req.user.userId);
    return res.json({ subscription });
  } catch (error) {
    next(error);
  }
}

export async function subscribeOmakase(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subscription = await omakaseService.subscribe(
      req.user.userId,
      req.body,
    );
    return res.status(201).json({
      message: "Đăng ký Omakase thành công",
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelOmakase(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subscription = await omakaseService.cancel(req.user.userId);
    return res.json({ message: "Đã hủy gói Omakase", subscription });
  } catch (error) {
    next(error);
  }
}
