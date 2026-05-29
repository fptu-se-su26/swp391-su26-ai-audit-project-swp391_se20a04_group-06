import { Request, Response } from "express";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Message } from "../models/Message";
import { sendServerError, parseId } from "../helpers/response.helper";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { fillDays } from "../utils/fillDays";
import { logger } from "../utils/logger";

export async function getStats(_req: Request, res: Response) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      verifiedUsers,
      activeFresh,
      activeDried,
      expiredTotal,
      reviewStats,
      totalMessages,
      followStats,
      postsPerDayRaw,
      usersPerDayRaw,
      topSellers,
    ] = (await Promise.all([
      User.countDocuments({ role: { $ne: "Admin" } }),
      User.countDocuments({ isVerified: true, role: { $ne: "Admin" } }),
      Product.countDocuments({ status: "Active", type: "Fresh" }),
      Product.countDocuments({ status: "Active", type: "Dried" }),
      Product.countDocuments({ status: "Expired" }),
      Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
      ]),
      Message.countDocuments({}),
      User.aggregate([
        {
          $project: {
            followingCount: {
              $cond: {
                if: { $isArray: "$following" },
                then: { $size: "$following" },
                else: 0,
              },
            },
          },
        },
        { $group: { _id: null, totalFollows: { $sum: "$followingCount" } } },
      ]),
      Product.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $match: { createdAt: { $gte: sevenDaysAgo }, role: { $ne: "Admin" } },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // TỐI ƯU HÓA: Tìm 5 seller có nhiều bài đăng nhất trước, sau đó mới kết hợp các bảng khác
      Product.aggregate([
        { $match: { status: { $ne: "Deleted" } } },
        { $group: { _id: "$sellerId", postCount: { $sum: 1 } } },
        { $sort: { postCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "sellerId",
            as: "reviewsList",
          },
        },
        {
          $project: {
            id: "$_id",
            name: "$user.name",
            isVerified: { $cond: ["$user.isVerified", 1, 0] },
            postCount: 1,
            avgRating: { $ifNull: [{ $avg: "$reviewsList.rating" }, 0] },
          },
        },
      ]),
    ])) as any[];

    const formattedPostsPerDay = postsPerDayRaw.map((p: any) => ({
      date: p._id,
      count: p.count,
    }));
    const formattedUsersPerDay = usersPerDayRaw.map((u: any) => ({
      date: u._id,
      count: u.count,
    }));

    return res.json({
      totalUsers,
      verifiedUsers,
      activeFresh,
      activeDried,
      expiredTotal,
      totalReviews: reviewStats[0]?.totalReviews || 0,
      avgRating: reviewStats[0]?.avgRating
        ? Math.round(reviewStats[0].avgRating * 10) / 10
        : 0,
      totalMessages,
      totalFollows: followStats[0]?.totalFollows || 0,
      postsPerDay: fillDays(formattedPostsPerDay as any),
      usersPerDay: fillDays(formattedUsersPerDay as any),
      topSellers,
    });
  } catch (err) {
    logger.error(`getStats error: ${err instanceof Error ? err.message : err}`);
    return sendServerError(res, err);
  }
}

export async function listUsers(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const search = ((req.query.search as string) || "").trim();

  try {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const userIds = users.map((u) => u._id);
    const postCountAgg = await Product.aggregate([
      { $match: { sellerId: { $in: userIds } } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]);
    const postCountMap = new Map<string, number>(
      postCountAgg.map((p: any) => [p._id.toString(), p.count as number]),
    );

    const formattedRows = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive ? 1 : 0,
      isVerified: u.isVerified ? 1 : 0,
      postCount: postCountMap.get(u._id.toString()) || 0,
    }));

    return res.json(paginatedResponse(formattedRows, total, page, limit));
  } catch (err) {
    logger.error(
      `listUsers error: ${err instanceof Error ? err.message : err}`,
    );
    return sendServerError(res, err);
  }
}

export async function toggleUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id)
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });

  try {
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`Admin toggled UserID=${id} active state to ${user.isActive}`);
    return res.json({ isActive: user.isActive });
  } catch (err) {
    logger.error(
      `toggleUser error: ${err instanceof Error ? err.message : err}`,
    );
    return sendServerError(res, err);
  }
}

export async function verifyUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id)
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });

  try {
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.isVerified = !user.isVerified;
    await user.save();

    logger.info(
      `Admin toggled UserID=${id} verification state to ${user.isVerified}`,
    );
    return res.json({
      isVerified: user.isVerified,
      message: user.isVerified
        ? "Đã xác minh tài khoản"
        : "Đã thu hồi xác minh",
    });
  } catch (err) {
    logger.error(
      `verifyUser error: ${err instanceof Error ? err.message : err}`,
    );
    return sendServerError(res, err);
  }
}

export async function listAllProducts(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const search = ((req.query.search as string) || "").trim();
  const status = (req.query.status as string) || "";

  try {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
      })
        .select("_id")
        .limit(100);
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sellerId: { $in: userIds } },
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const rows = products.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      type: p.type,
      status: p.status,
      price: p.price,
      remainingWeight: p.remainingWeight,
      createdAt: p.createdAt,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerEmail: p.sellerId?.email || "",
      coverImg: p.images[0] || null,
    }));

    return res.json(paginatedResponse(rows, total, page, limit));
  } catch (err) {
    logger.error(
      `listAllProducts error: ${err instanceof Error ? err.message : err}`,
    );
    return sendServerError(res, err);
  }
}

export async function adminDeleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const product = await Product.findByIdAndUpdate(id, {
      $set: { status: "Deleted" },
    });
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    logger.info(`Admin soft deleted ProductID=${id}`);
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    logger.error(
      `adminDeleteProduct error: ${err instanceof Error ? err.message : err}`,
    );
    return sendServerError(res, err);
  }
}
