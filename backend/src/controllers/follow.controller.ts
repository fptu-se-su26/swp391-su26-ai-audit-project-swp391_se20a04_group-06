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
      // Tối ưu hóa: Cắt giảm lượt truy vấn cơ sở dữ liệu dư thừa
      user.following = user.following.filter(
        (id) => id.toString() !== sellerId,
      );
      await user.save();
      return res.json({ message: "Đã hủy theo dõi", isFollowing: false });
    }

    user.following.push(sellerObjId as any);
    await user.save();
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
