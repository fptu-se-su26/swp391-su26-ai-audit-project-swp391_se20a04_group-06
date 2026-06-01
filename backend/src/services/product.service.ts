import { Product, IProduct } from "../models/Product";
import { User } from "../models/User";
import { redis } from "../config/redis";
import { MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { notifyFollowersNewProduct } from "./notification.service";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { HttpError } from "../errors/HttpError";

export const productService = {
  async list(query: Record<string, string | undefined>) {
    const queryType = query.type;
    const freshVer = await redis.get("product:list:version:Fresh") || "1";
    const driedVer = await redis.get("product:list:version:Dried") || "1";
    const listVersion = queryType === "Fresh" ? freshVer : queryType === "Dried" ? driedVer : `${freshVer}_${driedVer}`;

    // 1. TỐI ƯU CACHE KEY: Tránh Cache Pollution do GPS và Search
    const normalizedQuery: any = { ...query };
    if (normalizedQuery.lat) normalizedQuery.lat = parseFloat(normalizedQuery.lat).toFixed(3); // Làm tròn ~110m
    if (normalizedQuery.lng) normalizedQuery.lng = parseFloat(normalizedQuery.lng).toFixed(3);

    const cacheKey = `product:list:v${listVersion}:${JSON.stringify(normalizedQuery)}`;

    // Chỉ đọc cache nếu KHÔNG có từ khóa tìm kiếm (vì tìm kiếm có độ tùy biến rất lớn)
    const isSearching = !!(query.search && query.search.trim());
    if (!isSearching) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const {
      type,
      category,
      search,
      lat,
      lng,
      page: rawPage,
      limit: rawLimit,
      sellerId,
    } = query;
    const { page, limit } = parsePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    const filter: any = { status: "Active" };

    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      filter.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    if (type === "Fresh" || type === "Dried") {
      filter.type = type;
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    let sortOption: any = { bumpedAt: -1, createdAt: -1 };
    let projection: any = {};

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
      projection = { score: { $meta: "textScore" } };
      sortOption = { score: { $meta: "textScore" } };
    }

    if (type === "Fresh" && lat && lng) {
      const latVal = parseFloat(lat);
      const lngVal = parseFloat(lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        filter.location = {
          $geoWithin: {
            $centerSphere: [[lngVal, latVal], MAX_FRESH_DISTANCE_KM / 6378.1],
          },
        };
      }
    }

    const total = await Product.countDocuments(filter);
    const rows = await Product.find(filter, projection)
      .populate("sellerId", "name isVerified isPremium")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const formattedRows = rows.map((p: any) => ({
      id: p._id,
      sellerId: p.sellerId?._id || null,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
      sellerIsPremium: p.sellerId?.isPremium ? 1 : 0,
      type: p.type,
      category: p.category,
      name: p.name,
      description: p.description,
      price: p.price,
      salesType: p.salesType,
      totalWeight: p.totalWeight,
      remainingWeight: p.remainingWeight,
      status: p.status,
      catchTime: p.catchTime,
      lat: p.location?.coordinates?.[1] || null,
      lng: p.location?.coordinates?.[0] || null,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      // FIX LỖI: Sử dụng Optional Chaining cho mảng images để tránh API bị sập khi images là undefined
      coverImg: p.images?.[0] || null,
      imgCount: p.images?.length || 0,
    }));

    const finalResponse = paginatedResponse(formattedRows, total, page, limit);

    // Không lưu cache nếu đang tìm kiếm để tránh tràn bộ nhớ Redis
    if (!isSearching) {
      await redis.set(cacheKey, JSON.stringify(finalResponse), "EX", 600);
    }

    return finalResponse;
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const detailCacheKey = `product:detail:${id}`;
    const cachedDetail = await redis.get(detailCacheKey);

    if (cachedDetail) {
      Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => { });
      return JSON.parse(cachedDetail);
    }

    const p: any = await Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate("sellerId", "name isVerified isPremium");

    if (!p) throw new HttpError(404, "Không tìm thấy sản phẩm");

    const finalDetail = {
      id: p._id,
      sellerId: p.sellerId?._id,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
      sellerIsPremium: p.sellerId?.isPremium ? 1 : 0,
      type: p.type,
      category: p.category,
      name: p.name,
      description: p.description,
      price: p.price,
      salesType: p.salesType,
      totalWeight: p.totalWeight,
      remainingWeight: p.remainingWeight,
      status: p.status,
      catchTime: p.catchTime,
      lat: p.location?.coordinates?.[1] || null,
      lng: p.location?.coordinates?.[0] || null,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      images: (p.images || []).map((img: string, idx: number) => ({
        id: idx,
        url: img,
      })),
    };

    await redis.set(detailCacheKey, JSON.stringify(finalDetail), "EX", 1800);
    return finalDetail;
  },

  async create(
    userId: string,
    body: Record<string, any>,
  ): Promise<{ productId: string }> {
    const {
      type,
      category,
      name,
      description,
      price,
      salesType,
      totalWeight,
      catchTime,
      lat,
      lng,
      origin,
      expiryDate,
      images, // Nhận thêm images từ body (nếu có)
    } = body;

    const user = await User.findById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    if (!user.isPremium && user.role !== "Admin") {
      // FIX LỆCH MÚI GIỜ: Chuyển đổi về 0h ngày hôm nay theo giờ Việt Nam (UTC+7)
      const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      nowVN.setUTCHours(0, 0, 0, 0);
      const startOfDay = new Date(nowVN.getTime() - 7 * 60 * 60 * 1000);

      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const countToday = await Product.countDocuments({
        sellerId: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "Deleted" },
      });

      if (countToday >= 5) {
        throw new HttpError(
          403,
          "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!"
        );
      }
    }

    const cleanDesc = description
      ? description.trim().replace(/<[^>]*>/g, "").slice(0, 2000)
      : null;

    const parsedPrice = typeof price === "number" ? price : parseInt(price, 10);
    const parsedWeight = typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight);

    if (isNaN(parsedPrice) || isNaN(parsedWeight)) {
      throw new HttpError(400, "Thông tin giá cả hoặc khối lượng không hợp lệ");
    }

    const newProduct = new Product({
      sellerId: userId,
      type,
      category,
      name: name.trim(),
      description: cleanDesc,
      price: parsedPrice,
      salesType: salesType ?? "Retail",
      totalWeight: parsedWeight,
      remainingWeight: parsedWeight,
      catchTime,
      origin,
      expiryDate,
      images: Array.isArray(images) ? images : [],
      ...(lat && lng
        ? {
          location: {
            type: "Point",
            coordinates: [
              typeof lng === "number" ? lng : parseFloat(lng),
              typeof lat === "number" ? lat : parseFloat(lat),
            ],
          },
        }
        : {}),
    });

    await newProduct.save();
    await redis.incr(`product:list:version:${newProduct.type}`);

    User.findById(userId)
      .select("name")
      .lean()
      .then((seller: any) =>
        notifyFollowersNewProduct(
          userId,
          seller?.name || "Một ngư dân",
          newProduct._id.toString(),
          newProduct.name,
        ),
      )
      .catch((err: any) =>
        logger.error(
          `[Notify] notifyFollowersNewProduct failed: ${err.message}`,
        ),
      );

    return { productId: newProduct._id.toString() };
  },

  async update(
    id: string,
    userId: string,
    role: string,
    body: Record<string, any>,
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa bài đăng này");

    // FIX LỖI 0-VALUE: So sánh trực tiếp với undefined
    const newPrice = body.price !== undefined ? parseInt(body.price, 10) : undefined;
    if (newPrice !== undefined && isNaN(newPrice)) {
      throw new HttpError(400, "Giá sản phẩm mới không hợp lệ");
    }

    const updateFields: any = {};

    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined)
      updateFields.description = body.description
        ? body.description.trim().replace(/<[^>]*>/g, "").slice(0, 2000)
        : null;
    if (body.origin !== undefined) updateFields.origin = body.origin;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.salesType !== undefined) updateFields.salesType = body.salesType;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.images !== undefined && Array.isArray(body.images)) updateFields.images = body.images;

    if (newPrice !== undefined) {
      updateFields.price = newPrice;
    }
    if (body.totalWeight !== undefined) {
      updateFields.totalWeight = parseFloat(body.totalWeight);
    }
    if (body.remainingWeight !== undefined) {
      updateFields.remainingWeight = parseFloat(body.remainingWeight);
    }

    if (body.catchTime !== undefined) {
      updateFields.catchTime = body.catchTime ? new Date(body.catchTime) : null;
    }
    if (body.expiryDate !== undefined) {
      updateFields.expiryDate = body.expiryDate
        ? new Date(body.expiryDate)
        : null;
    }

    if (
      body.lat !== undefined &&
      body.lng !== undefined &&
      body.lat !== null &&
      body.lng !== null
    ) {
      const latVal = parseFloat(body.lat);
      const lngVal = parseFloat(body.lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        updateFields.location = {
          type: "Point",
          coordinates: [lngVal, latVal],
        };
      }
    }

    // TỐI ƯU HOÁ: Gộp toán tử $set và $push vào 1 lượt ghi cơ sở dữ liệu duy nhất
    const updateQuery: any = { $set: updateFields };

    if (newPrice !== undefined && newPrice !== currentProduct.price) {
      updateQuery.$push = {
        priceHistory: {
          oldPrice: currentProduct.price,
          newPrice: newPrice,
          changedAt: new Date(),
        },
      };
      logger.info(`Price change logged for ProductID=${id}`);
    }

    await Product.findByIdAndUpdate(id, updateQuery);

    await redis.del(`product:detail:${id}`);
    await redis.incr(`product:list:version:${currentProduct.type}`);
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền xoá bài đăng này");

    await Product.findByIdAndUpdate(id, { $set: { status: "Deleted" } });

    await redis.del(`product:detail:${id}`);
    await redis.incr(`product:list:version:${currentProduct.type}`);
  },

  async bump(id: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Không có quyền");

    if (currentProduct.bumpedAt) {
      const diffMs = Date.now() - new Date(currentProduct.bumpedAt).getTime();
      if (diffMs < 24 * 3600 * 1000) {
        const remaining = Math.ceil((24 * 3600 * 1000 - diffMs) / 3600000);
        throw new HttpError(429, `Đẩy tin lại sau ${remaining} giờ nữa`);
      }
    }

    await Product.findByIdAndUpdate(id, { $set: { bumpedAt: new Date() } });

    await redis.del(`product:detail:${id}`);
    await redis.incr(`product:list:version:${currentProduct.type}`);
  },
};