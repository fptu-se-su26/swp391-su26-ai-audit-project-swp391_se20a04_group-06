import mongoose, { Types } from "mongoose";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { recipeRepository } from "../repositories/recipe.repository";
import { postRepository } from "../repositories/post.repository";
import { boatLogRepository } from "../repositories/boatlog.repository";
import { reviewRepository } from "../repositories/review.repository";
import { HttpError } from "../errors/HttpError";
import { parsePagination } from "../utils/pagination";

function escapeRegExp(string: string): string {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export const fishermanService = {
  async list(query: {
    page?: string;
    limit?: string;
    verified?: string;
    hasActive?: string;
    search?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(Math.max(1, parseInt(query.limit || "20", 10)), 50);
    const offset = (page - 1) * limit;

    const verified = query.verified === "true";
    const hasActive = query.hasActive !== "false";

    let sellerIdFilter: any = {};
    if (hasActive) {
      const activeSellerIds = await productRepository.distinct("sellerId", {
        status: "Active",
      });
      if (activeSellerIds.length === 0)
        return { data: [], page, limit, total: 0, totalPages: 0 };
      sellerIdFilter = { _id: { $in: activeSellerIds } };
    }

    const filter: any = {
      ...sellerIdFilter,
      isActive: true,
      role: { $ne: "Admin" },
    };
    if (verified) filter.isVerified = true;
    if (query.search)
      filter.name = { $regex: escapeRegExp(query.search), $options: "i" };

    const total = await userRepository.countDocuments(filter);
    const users = await userRepository.find(
      filter,
      { isPremium: -1, isVerified: -1, createdAt: -1 },
      offset,
      limit,
    );

    if (users.length === 0)
      return { data: [], page, limit, total, totalPages: 0 };

    const ids = users.map((u: any) => u._id);

    const [productCounts, reviewStats] = await Promise.all([
      productRepository.aggregate([
        { $match: { sellerId: { $in: ids }, status: "Active" } },
        { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      ]),
      reviewRepository.aggregate([
        { $match: { sellerId: { $in: ids } } },
        {
          $group: {
            _id: "$sellerId",
            avg: { $avg: "$rating" },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const productMap = new Map(
      productCounts.map((p: any) => [p._id.toString(), p.count]),
    );
    const reviewMap = new Map(
      reviewStats.map((r: any) => [r._id.toString(), r]),
    );

    const data = users.map((u: any) => {
      const rv = reviewMap.get(u._id.toString());
      return {
        id: u._id,
        name: u.name,
        avatar: u.avatar ?? null,
        isVerified: u.isVerified ?? false,
        isPremium: u.isPremium ?? false,
        badges: u.badges ?? [],
        activeProducts: productMap.get(u._id.toString()) ?? 0,
        avgRating: rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount: rv?.total ?? 0,
        memberSince: u.createdAt,
      };
    });

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  },

  async getProfile(rawId: string) {
    if (!mongoose.Types.ObjectId.isValid(rawId))
      throw new HttpError(400, "ID ngư dân không hợp lệ");
    const id = new Types.ObjectId(rawId);

    // [FIX PERFORMANCE 1] Sử dụng countDocuments thay vì pull document
    const [
      user,
      prodCount,
      recipeCount,
      postCount,
      boatLogCount,
      reviewAgg,
      followersCount,
      recentProducts,
      recentRecipes,
      recentPosts,
    ] = await Promise.all([
      userRepository.findRawById(rawId),
      productRepository.countDocuments({ sellerId: id, status: "Active" }),
      recipeRepository.countDocuments({ authorId: id }),
      postRepository.countDocuments({ userId: id }),
      boatLogRepository.countDocuments({ userId: id }),
      reviewRepository.aggregate([
        { $match: { sellerId: id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),
      userRepository.countDocuments({ following: id }),
      productRepository.find(
        { sellerId: id, status: "Active" },
        {
          name: 1,
          price: 1,
          type: 1,
          category: 1,
          images: 1,
          remainingWeight: 1,
          bumpedAt: 1,
        },
        { sort: { bumpedAt: -1, createdAt: -1 }, limit: 4 },
      ),
      recipeRepository.findAll({ authorId: id }, 0, 3),
      postRepository.findAll({ userId: id }, 0, 3),
    ]);

    if (!user) throw new HttpError(404, "Không tìm thấy ngư dân này");

    const rv = (reviewAgg as any[])[0];

    return {
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar ?? null,
        isVerified: user.isVerified ?? false,
        isPremium: user.isPremium ?? false,
        badges: user.badges ?? [],
        memberSince: user.createdAt,
      },
      stats: {
        activeProducts: prodCount,
        totalRecipes: recipeCount,
        totalPosts: postCount,
        totalBoatLogs: boatLogCount,
        avgRating: rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount: rv?.total ?? 0,
        followersCount,
      },
      recentProducts: recentProducts.map((p: any) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        type: p.type,
        category: p.category,
        coverImg: p.images?.[0] ?? null,
        remainingWeight: p.remainingWeight,
        bumpedAt: p.bumpedAt,
      })),
      recentRecipes: recentRecipes.recipes,
      recentPosts: recentPosts.posts,
    };
  },

  async getProducts(
    sellerId: string,
    pageStr?: string,
    limitStr?: string,
    includeExpired?: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(sellerId))
      throw new HttpError(400, "ID người bán không hợp lệ");
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 50);
    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    if (includeExpired !== "true") filter.status = "Active";
    const total = await productRepository.countDocuments(filter);
    const products = await productRepository.find(
      filter,
      {},
      { sort: { bumpedAt: -1, createdAt: -1 }, skip: offset, limit },
    );
    return { products, total, page, limit };
  },

  async getRecipes(authorId: string, pageStr?: string, limitStr?: string) {
    if (!mongoose.Types.ObjectId.isValid(authorId))
      throw new HttpError(400, "ID tác giả không hợp lệ");
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    const { recipes, total } = await recipeRepository.findAll(
      { authorId: new Types.ObjectId(authorId) },
      offset,
      limit,
    );
    return { recipes, total, page, limit };
  },

  async getPosts(userId: string, pageStr?: string, limitStr?: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new HttpError(400, "ID người dùng không hợp lệ");
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    const { posts, total } = await postRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      offset,
      limit,
    );
    return { posts, total, page, limit };
  },

  async getBoatLogs(userId: string, pageStr?: string, limitStr?: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new HttpError(400, "ID người dùng không hợp lệ");
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    const { boatLogs, total } = await boatLogRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      offset,
      limit,
    );
    return { boatLogs, total, page, limit };
  },
};
