import { Request, Response } from "express";
import { User } from "../models/User";
import { sendServerError } from "../helpers/response.helper";
import mongoose from "mongoose";

// Trong tệp: backend/src/controllers/follow.controller.ts

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

    // 🌟 GIẢI PHÁP BẢO MẬT: Chặn không cho phép theo dõi nếu người bán không tồn tại hoặc bị khóa tài khoản
    if (!isFollowing) {
      const sellerExists = await User.exists({
        _id: sellerObjId,
        isActive: true
      });
      if (!sellerExists) {
        return res.status(404).json({ message: "Người bán không tồn tại hoặc tài khoản đã bị vô hiệu hóa." });
      }
    }

    if (isFollowing) {
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

// Trong tệp: backend/src/controllers/follow.controller.ts (hàm checkFollow)

export async function checkFollow(req: Request, res: Response) {
  const { userId } = req.user;
  const sellerId = req.params.sellerId;

  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "ID người bán không hợp lệ" });
  }

  try {
    // 🌟 GIẢI PHÁP HIỆU NĂNG: Chỉ truy vấn duy nhất mảng "following" của người dùng để kiểm tra
    const user = await User.findById(userId).select("following");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isFollowing = user.following.some((id) => id.toString() === sellerId);
    return res.json({ isFollowing });
  } catch (err) {
    return sendServerError(res, err);
  }
}