import { Request, Response } from "express";
import { User } from "../models/User";
import { sendServerError } from "../helpers/response.helper";
import mongoose from "mongoose";

export async function toggleFollow(req: Request, res: Response) {
  const { userId } = req.user;
  const sellerId = req.params.sellerId;

  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "ID người bán không hợp lệ" });
  }
  if (userId.toString() === sellerId) {
    return res.status(400).json({ message: "Không thể tự follow chính mình" });
  }

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const sellerObjId = new mongoose.Types.ObjectId(sellerId);
    const isFollowing = user.following.some((id) => id.toString() === sellerId);

    if (isFollowing) {
      await User.findByIdAndUpdate(userId, {
        $pull: { following: sellerObjId },
      });
      return res.json({ message: "Đã hủy theo dõi", isFollowing: false });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { following: sellerObjId },
    });
    return res.json({ message: "Đã theo dõi thành công", isFollowing: true });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function checkFollow(req: Request, res: Response) {
  const { userId } = req.user;
  const sellerId = req.params.sellerId;

  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "ID người bán không hợp lệ" });
  }

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isFollowing = user.following.some((id) => id.toString() === sellerId);
    return res.json({ isFollowing });
  } catch (err) {
    return sendServerError(res, err);
  }
}
