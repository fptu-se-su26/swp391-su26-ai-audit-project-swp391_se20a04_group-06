import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { reviewRepository } from "../repositories/review.repository";
import { messageRepository } from "../repositories/message.repository";
import { fillDays } from "../utils/fillDays";
import { HttpError } from "../errors/HttpError";
import { productService } from "./product.service";

// Thêm Model User phục vụ gom luồng giải quyết N+1 queries
import { User } from "../models/User";

// Hàm xử lý an toàn hóa từ khóa Regex phòng chống tấn công từ chối dịch vụ ReDoS
function escapeRegExp(string: string): string {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export const adminService = {
  async getDashboardStats() {
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
      userRepository.countDocuments({ role: { $ne: "Admin" } }),
      userRepository.countDocuments({
        isVerified: true,
        role: { $ne: "Admin" },
      }),
      productRepository.countDocuments({ status: "Active", type: "Fresh" }),
      productRepository.countDocuments({ status: "Active", type: "Dried" }),
      productRepository.countDocuments({ status: "Expired" }),
      reviewRepository.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
      ]),
      messageRepository.countDocuments({}),
      userRepository.aggregate([
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
      productRepository.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      userRepository.aggregate([
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
      productRepository.aggregate([
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

    return {
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
    };
  },

  async listUsers(search: string, offset: number, limit: number) {
    const filter: any = {};
    if (search) {
      // KHẮC PHỤC LỖI REDOS: Khử độc hại từ khóa tìm kiếm regex đầu vào
      const safeSearch = escapeRegExp(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await userRepository.countDocuments(filter);
    const users = await userRepository.find(
      filter,
      { createdAt: -1 },
      offset,
      limit,
    );

    const userIds = users.map((u) => u._id);
    const postCountAgg = await productRepository.aggregate([
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

    return { formattedRows, total };
  },

  async toggleUserActive(userId: string) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const updated = await userRepository.updateActiveStatus(
      userId,
      !user.isActive,
    );
    return updated?.isActive;
  },

  async toggleUserVerification(userId: string) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const updated = await userRepository.updateVerificationStatus(
      userId,
      !user.isVerified,
    );
    return updated?.isVerified;
  },

  async listAllProducts(
    search: string,
    status: string,
    offset: number,
    limit: number,
  ) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      // KHẮC PHỤC LỖI REDOS: Khử độc hại từ khóa tìm kiếm regex đầu vào
      const safeSearch = escapeRegExp(search);
      const matchingUsers = await userRepository.find(
        { name: { $regex: safeSearch, $options: "i" } },
        {},
        0,
        100,
      );
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sellerId: { $in: userIds } },
      ];
    }

    const total = await productRepository.countDocuments(filter);
    const products = await productRepository.find(
      filter,
      {},
      {
        sort: { createdAt: -1 },
        skip: offset,
        limit: limit,
      },
    );

    // KHẮC PHỤC LỖI N+1 QUERIES: Thu thập toàn bộ IDs người bán và truy vấn duy nhất 1 lần trong RAM
    const sellerIds = Array.from(
      new Set(products.map((p) => p.sellerId.toString())),
    );
    const sellers = await User.find({ _id: { $in: sellerIds } }).lean();
    const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));

    const rows = products.map((p: any) => {
      const seller = sellerMap.get(p.sellerId.toString());
      return {
        id: p._id.toString(),
        name: p.name,
        type: p.type,
        status: p.status,
        price: p.price,
        remainingWeight: p.remainingWeight,
        createdAt: p.createdAt,
        sellerName: seller?.name || "Một ngư dân",
        sellerEmail: seller?.email || "",
        coverImg: p.images[0] || null,
      };
    });

    return { rows, total };
  },

  async adminDeleteProduct(productId: string, adminId: string) {
    await productService.delete(productId, adminId, "Admin");
  },
};
