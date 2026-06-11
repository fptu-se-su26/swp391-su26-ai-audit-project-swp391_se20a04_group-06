import { Request, Response } from "express";
import { followService } from "../services/follow.service";
import { userRepository } from "../repositories/user.repository";
import { sendServerError } from "../helpers/response.helper";
import mongoose from "mongoose";

/**
 * Bật/tắt theo dõi một người bán
 */
export async function toggleFollow(req: Request, res: Response) {
  const { userId } = req.user;
  const { sellerId } = req.params;

  try {
    const result = await followService.toggleFollow(userId, sellerId);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * Kiểm tra trạng thái theo dõi hiện tại
 */
export async function checkFollow(req: Request, res: Response) {
  const { userId } = req.user;
  const { sellerId } = req.params;

  try {
    const isFollowing = await userRepository.isFollowing(userId, sellerId);
    return res.json({ isFollowing });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * Lấy danh sách những người dùng mà tài khoản hiện tại đang theo dõi
 */
export async function getFollowing(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const user = await userRepository.findRawById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const followingUsers = await userRepository.find({
      _id: { $in: user.following },
    });
    const data = followingUsers.map((u) => ({
      UserID: u._id.toString(),
      Name: u.name,
      AvatarURL: u.avatar,
      IsSeller: u.role === "User",
    }));
    return res.json(data);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * Lấy danh sách những người dùng đang theo dõi tài khoản hiện tại
 */
export async function getFollowers(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const followersUsers = await userRepository.find({
      following: new mongoose.Types.ObjectId(userId),
    });
    const data = followersUsers.map((u) => ({
      UserID: u._id.toString(),
      Name: u.name,
      AvatarURL: u.avatar,
      IsSeller: u.role === "User",
    }));
    return res.json(data);
  } catch (err) {
    return sendServerError(res, err);
  }
}
