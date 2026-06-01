import { Request, Response } from "express";
import { User } from "../models/User";
import { sendServerError } from "../helpers/response.helper";
import mongoose from "mongoose";
import { Product } from "../models/Product";

export async function getMyFavorites(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: { path: "sellerId", select: "name isVerified" },
    });

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const formatted = (user.favorites as any[]).map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      type: p.type,
      status: p.status,
      remainingWeight: p.remainingWeight,
      viewCount: p.viewCount,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
      coverImg: p.images?.[0] || null,
      savedAt: p.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getMyFavoriteIds(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId);
    return res.json(user ? user.favorites : []);
  } catch (err) {
    return sendServerError(res, err);
  }
}

// Trong tệp: backend/src/controllers/favorite.controller.ts

export async function toggleFavorite(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = req.params.productId;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const prodObjId = new mongoose.Types.ObjectId(productId);
    const isFavorited = user.favorites.some(
      (id) => id.toString() === productId,
    );

    // 🌟 GIẢI PHÁP BẢO MẬT: Chặn không cho phép yêu thích nếu sản phẩm không tồn tại hoặc đã bị xóa mềm
    if (!isFavorited) {
      const productExists = await Product.exists({
        _id: prodObjId,
        status: { $ne: "Deleted" }
      });
      if (!productExists) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại hoặc đã bị xóa vĩnh viễn" });
      }
    }

    if (isFavorited) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== productId,
      );
      await user.save();
      return res.json({ favorited: false });
    }

    user.favorites.push(prodObjId as any);
    await user.save();
    return res.json({ favorited: true });
  } catch (err) {
    return sendServerError(res, err);
  }
}
