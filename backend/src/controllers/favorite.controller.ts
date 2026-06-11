import { Request, Response } from "express";
import { favoriteService } from "../services/favorite.service";
import { userRepository } from "../repositories/user.repository";
import { sendServerError } from "../helpers/response.helper";

export async function getMyFavorites(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const favorites = await favoriteService.getMyFavorites(userId);
    return res.json(favorites);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getMyFavoriteIds(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const user = await userRepository.findRawById(userId);
    return res.json(user ? user.favorites : []);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function toggleFavorite(req: Request, res: Response) {
  const { userId } = req.user;
  const { productId } = req.params;

  try {
    const result = await favoriteService.toggleFavorite(userId, productId);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}
