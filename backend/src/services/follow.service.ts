import mongoose from "mongoose";
import { userRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/HttpError";

export const followService = {
  async toggleFollow(userId: string, sellerId: string) {
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new HttpError(400, "ID người bán không hợp lệ");
    }
    if (userId === sellerId) {
      throw new HttpError(400, "Không thể tự theo dõi chính mình");
    }

    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const isFollowing = await userRepository.isFollowing(userId, sellerId);

    if (!isFollowing) {
      const sellerExists = await userRepository.exists({
        _id: sellerId,
        isActive: true,
      });
      if (!sellerExists) {
        throw new HttpError(404, "Người bán không tồn tại hoặc đã bị khóa");
      }
      await userRepository.followSeller(userId, sellerId);
      return { isFollowing: true, message: "Đã theo dõi thành công" };
    }

    await userRepository.unfollowSeller(userId, sellerId);
    return { isFollowing: false, message: "Đã hủy theo dõi" };
  },
};
