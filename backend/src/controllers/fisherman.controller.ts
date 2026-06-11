import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";

import { User }     from "../models/User";
import { Product }  from "../models/Product";
import { Recipe }   from "../models/Recipe";
import { Post }     from "../models/Post";
import { BoatLog }  from "../models/BoatLog";
import { Review }   from "../models/Review";

// ─── Helper: parse & clamp pagination ────────────────────────
function parsePagination(pageStr: string, limitStr: string, maxLimit = 50) {
  const page   = Math.max(1, parseInt(pageStr) || 1);
  const limit  = Math.min(Math.max(1, parseInt(limitStr) || 20), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── Helper: format product preview (dùng trong profile response) ─
function formatProductPreview(p: any) {
  return {
    id:               p._id ?? p.id,
    name:             p.name,
    price:            p.price,
    type:             p.type,
    category:         p.category,
    coverImg:         p.images?.[0] ?? p.coverImg ?? null,
    remainingWeight:  p.remainingWeight,
    bumpedAt:         p.bumpedAt,
  };
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen
// Danh sách ngư dân có phân trang + batch stats
// Query: page, limit, verified, hasActive (default true)
// ═══════════════════════════════════════════════════════════
export async function listFishermen(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
      50
    );
    const verified  = req.query.verified === "true";
    const hasActive = req.query.hasActive !== "false"; // default true

    // Bước 1: Lấy sellerId của ngư dân có sản phẩm Active (nếu hasActive=true)
    let sellerIdFilter: any = {};
    if (hasActive) {
      const activeSellerIds = await Product.distinct("sellerId", { status: "Active" });
      if (activeSellerIds.length === 0) {
        return res.json({ data: [], page, limit, total: 0, totalPages: 0 });
      }
      sellerIdFilter = { _id: { $in: activeSellerIds } };
    }

    // Bước 2: Build user filter
    const filter: any = {
      ...sellerIdFilter,
      isActive: true,
      role:     { $ne: "Admin" },
    };
    if (verified) filter.isVerified = true;

    const search = req.query.search as string;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("name avatar isVerified isPremium badges createdAt")
      .sort({ isPremium: -1, isVerified: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    if (users.length === 0) {
      return res.json({ data: [], page, limit, total, totalPages: Math.ceil(total / limit) });
    }

    // Bước 3: Batch stats (1 aggregate — không N+1 query)
    const ids = users.map((u: any) => u._id);

    const [productCounts, reviewStats] = await Promise.all([
      Product.aggregate([
        { $match: { sellerId: { $in: ids }, status: "Active" } },
        { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { sellerId: { $in: ids } } },
        { $group: { _id: "$sellerId", avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),
    ]);

    const productMap = new Map(productCounts.map((p: any) => [p._id.toString(), p.count]));
    const reviewMap  = new Map(reviewStats.map((r: any) => [r._id.toString(), r]));

    const data = users.map((u: any) => {
      const rv = reviewMap.get(u._id.toString());
      return {
        id:             u._id,
        name:           u.name,
        avatar:         u.avatar ?? null,
        isVerified:     u.isVerified ?? false,
        isPremium:      u.isPremium ?? false,
        badges:         u.badges ?? [],
        activeProducts: productMap.get(u._id.toString()) ?? 0,
        avgRating:      rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount:    rv?.total ?? 0,
        memberSince:    u.createdAt,
      };
    });

    return res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[listFishermen]", err);
    return res.status(500).json({ message: "Lỗi server khi tải danh sách ngư dân" });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/profile
// Hồ sơ tổng hợp 1 lần gọi — tất cả chạy song song Promise.all
// ═══════════════════════════════════════════════════════════
export async function getFishermanProfile(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "ID ngư dân không hợp lệ" });
    }
    const id = new Types.ObjectId(rawId);

    // Tất cả query chạy song song — tránh waterfall
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
      User.findOne({ _id: id, isActive: true })
          .select("name avatar isVerified isPremium badges createdAt")
          .lean(),

      Product.countDocuments({ sellerId: id, status: "Active" }),
      Recipe.countDocuments({ authorId: id }),
      Post.countDocuments({ userId: id }),
      BoatLog.countDocuments({ userId: id }),

      Review.aggregate([
        { $match: { sellerId: id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),

      User.countDocuments({ following: id }),

      Product.find({ sellerId: id, status: "Active" })
             .sort({ bumpedAt: -1, createdAt: -1 })
             .limit(4)
             .select("name price type category images remainingWeight bumpedAt")
             .lean(),

      Recipe.find({ authorId: id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title imageUrl difficulty cookingTime servings likes viewCount createdAt")
            .lean(),

      Post.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("title images likes comments viewCount createdAt")
          .lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy ngư dân này" });
    }

    const rv = (reviewAgg as any[])[0];

    return res.json({
      user: {
        id:          (user as any)._id,
        name:        (user as any).name,
        avatar:      (user as any).avatar ?? null,
        isVerified:  (user as any).isVerified ?? false,
        isPremium:   (user as any).isPremium ?? false,
        badges:      (user as any).badges ?? [],
        memberSince: (user as any).createdAt,
      },
      stats: {
        activeProducts: prodCount,
        totalRecipes:   recipeCount,
        totalPosts:     postCount,
        totalBoatLogs:  boatLogCount,
        avgRating:      rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount:    rv?.total ?? 0,
        followersCount,
      },
      recentProducts: (recentProducts as any[]).map(formatProductPreview),
      recentRecipes,
      recentPosts,
    });
  } catch (err: any) {
    console.error("[getFishermanProfile]", err);
    return res.status(500).json({ message: "Lỗi server khi tải hồ sơ ngư dân" });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/products
// ═══════════════════════════════════════════════════════════
export async function getFishermanProducts(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 50
    );
    const sellerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    if (req.query.includeExpired !== "true") {
      filter.status = "Active";
    }
    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ bumpedAt: -1, createdAt: -1 })
      .skip(offset).limit(limit).lean();
    return res.json({
      data: products,
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/recipes
// ═══════════════════════════════════════════════════════════
export async function getFishermanRecipes(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const authorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { authorId: new Types.ObjectId(authorId) };
    const total   = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit)
      .populate("authorId", "name avatar isVerified")
      .lean();
    const totalPages = Math.ceil(total / limit);
    return res.json({
      data: recipes,
      recipes,
      page,
      limit,
      total,
      totalPages,
      pages: totalPages,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/posts
// ═══════════════════════════════════════════════════════════
export async function getFishermanPosts(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { userId: new Types.ObjectId(userId) };
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
    const totalPages = Math.ceil(total / limit);
    return res.json({
      data: posts,
      posts,
      page,
      limit,
      total,
      totalPages,
      pages: totalPages,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/boat-logs
// ═══════════════════════════════════════════════════════════
export async function getFishermanBoatLogs(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { userId: new Types.ObjectId(userId) };
    const total    = await BoatLog.countDocuments(filter);
    const boatLogs = await BoatLog.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
    const totalPages = Math.ceil(total / limit);
    return res.json({
      data: boatLogs,
      boatLogs,
      page,
      limit,
      total,
      totalPages,
      pages: totalPages,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
