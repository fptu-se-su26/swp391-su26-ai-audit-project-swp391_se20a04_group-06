import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getUserPublicProfile(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const profile = await userService.getPublicProfile(id);
    return res.json(profile);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getFishermanLeaderboard(req: Request, res: Response) {
  try {
    const leaderboard = await userService.getFishermanLeaderboard();
    return res.json(leaderboard);
  } catch (err) {
    return sendServerError(res, err);
  }
}
