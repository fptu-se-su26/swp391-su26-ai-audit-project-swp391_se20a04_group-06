import mongoose from "mongoose";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { HttpError } from "../errors/HttpError";

export const favoriteService = {
  async getMyFavorites(userId: string) {
    const user = await userRepository.findFavoritesPopulated(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    return (user.favorites as any[]).map((p) => ({
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
  },

  async toggleFavorite(userId: string, productId: string) {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "ID không hợp lệ");
    }

    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const isFavorited = user.favorites.some(
      (id) => id.toString() === productId,
    );

    if (!isFavorited) {
      const productExists = await productRepository.exists({
        _id: productId,
        status: { $ne: "Deleted" },
      });
      if (!productExists) {
        throw new HttpError(404, "Sản phẩm không tồn tại hoặc đã bị xóa");
      }
      await userRepository.addFavorite(userId, productId);
      return { favorited: true };
    }

    await userRepository.removeFavorite(userId, productId);
    return { favorited: false };
  },
};
