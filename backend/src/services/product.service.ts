import { Product, IProduct } from "../models/Product";
import { User } from "../models/User";
import { redis } from "../config/redis";
import { MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { notifyFollowersNewProduct } from "./notification.service";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { HttpError } from "../errors/HttpError";
import { extractPublicId } from "../controllers/image.controller";
import { cloudinary } from "../config/cloudinary";
import { Report } from "../models/Report";
import { Notification } from "../models/Notification";
import { updateUserBadges } from "./badge.service";

// ─────────────────────────────────────────────────────────────────────────────
// 🛡️ REDIS RESILIENCE HELPERS
//
// ROOT CAUSE của 502: ioredis mặc định bật enableOfflineQueue=true, nghĩa là
// khi Redis không kết nối được, mọi lệnh bị QUEUE vô thời hạn thay vì throw.
// Request treo → Nginx/proxy timeout → 502.
//
// Fix: Bọc mọi lệnh redis trong Promise.race với timeout 1500ms.
// Nếu Redis chậm / down → fallback về null/void, service vẫn chạy từ DB.
// ─────────────────────────────────────────────────────────────────────────────

const REDIS_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), REDIS_TIMEOUT_MS),
    ),
  ]);
}

async function redisGet(key: string): Promise<string | null> {
  try {
    return await withTimeout(redis.get(key));
  } catch {
    logger.warn(`[Redis] GET failed: ${key}`);
    return null;
  }
}

async function redisSet(
  key: string,
  value: string | number,
  mode?: "EX",
  ttl?: number,
): Promise<void> {
  try {
    const p =
      mode && ttl ? redis.set(key, value, mode, ttl) : redis.set(key, value);
    await withTimeout(p as Promise<any>);
  } catch {
    logger.warn(`[Redis] SET failed: ${key}`);
  }
}

async function redisIncr(key: string): Promise<void> {
  try {
    await withTimeout(redis.incr(key));
  } catch {
    logger.warn(`[Redis] INCR failed: ${key}`);
  }
}

async function redisDel(key: string): Promise<void> {
  try {
    await withTimeout(redis.del(key) as Promise<any>);
  } catch {
    logger.warn(`[Redis] DEL failed: ${key}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const productService = {
  async list(query: Record<string, string | undefined>) {
    const queryType = query.type;

    // 🛡️ Redis resilient — trả "0" nếu timeout/down
    const [freshVer, driedVer] = await Promise.all([
      redisGet("product:list:version:Fresh").then((v) => v ?? "0"),
      redisGet("product:list:version:Dried").then((v) => v ?? "0"),
    ]);

    const listVersion =
      queryType === "Fresh"
        ? freshVer
        : queryType === "Dried"
          ? driedVer
          : `${freshVer}_${driedVer}`;

    // Làm tròn GPS ~110m để tránh cache pollution
    const normalizedQuery: any = { ...query };
    if (normalizedQuery.lat)
      normalizedQuery.lat = parseFloat(normalizedQuery.lat).toFixed(3);
    if (normalizedQuery.lng)
      normalizedQuery.lng = parseFloat(normalizedQuery.lng).toFixed(3);

    const cacheKey = `product:list:v${listVersion}:${JSON.stringify(normalizedQuery)}`;
    const isSearching = !!(query.search && query.search.trim());

    // 🛡️ Safe cache read
    if (!isSearching) {
      const cached = await redisGet(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // Dữ liệu cache bị corrupt → tiếp tục query DB
        }
      }
    }

    // Ép kiểu tường minh để ngăn NoSQL Injection
    const type = typeof query.type === "string" ? query.type : undefined;
    const category =
      typeof query.category === "string" ? query.category : undefined;
    const search = typeof query.search === "string" ? query.search : undefined;
    const lat = typeof query.lat === "string" ? query.lat : undefined;
    const lng = typeof query.lng === "string" ? query.lng : undefined;
    const rawPage = typeof query.page === "string" ? query.page : undefined;
    const rawLimit = typeof query.limit === "string" ? query.limit : undefined;
    const sellerId =
      typeof query.sellerId === "string" ? query.sellerId : undefined;

    const { page, limit } = parsePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    const filter: any = { status: "Active" };

    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      filter.sellerId = new mongoose.Types.ObjectId(sellerId);
    }
    if (type === "Fresh" || type === "Dried") filter.type = type;
    if (category && category !== "All") filter.category = category;

    const sortOption: any = { bumpedAt: -1, createdAt: -1 };
    const projection: any = {};

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
      projection.score = { $meta: "textScore" };
      // Sort by relevance score first when searching
      sortOption.score = { $meta: "textScore" };
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
      .populate("sellerId", "name isVerified isPremium badges")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const formattedRows = rows.map((p: any) => ({
      id: p._id,
      sellerId: p.sellerId?._id || null,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
      sellerIsPremium: p.sellerId?.isPremium ? 1 : 0,
      sellerBadges: p.sellerId?.badges || [],
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
      catchLat: p.catchLocation?.coordinates?.[1] || null,
      catchLng: p.catchLocation?.coordinates?.[0] || null,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      coverImg: p.images?.[0] || null,
      imgCount: p.images?.length || 0,
    }));

    const finalResponse = paginatedResponse(formattedRows, total, page, limit);

    // 🛡️ Safe cache write — không block response nếu Redis down
    if (!isSearching) {
      redisSet(cacheKey, JSON.stringify(finalResponse), "EX", 600).catch(
        () => {},
      );
    }

    return finalResponse;
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const detailCacheKey = `product:detail:${id}`;
    const viewsCacheKey = `product:views:count:${id}`;

    // 🛡️ Safe cache read
    const cachedDetail = await redisGet(detailCacheKey);
    if (cachedDetail) {
      try {
        const parsed = JSON.parse(cachedDetail);

        // Tăng lượt xem ngầm trong MongoDB (fire-and-forget)
        Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(
          () => {},
        );

        // 🛡️ Tăng view count trong Redis an toàn
        const rawViews = await withTimeout(
          redis.incr(viewsCacheKey).catch(() => null),
        );
        if (rawViews !== null) parsed.viewCount = rawViews;

        return parsed;
      } catch {
        // Cache corrupt → tiếp tục query DB
      }
    }

    const p: any = await Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate("sellerId", "name isVerified isPremium badges");

    if (!p || p.status === "Deleted") {
      throw new HttpError(
        404,
        "Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa",
      );
    }

    const finalDetail = {
      id: p._id,
      sellerId: p.sellerId?._id,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
      sellerIsPremium: p.sellerId?.isPremium ? 1 : 0,
      sellerBadges: p.sellerId?.badges || [],
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
      catchLat: p.catchLocation?.coordinates?.[1] || null,
      catchLng: p.catchLocation?.coordinates?.[0] || null,
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

    // 🛡️ Safe cache writes — fire-and-forget, không block response
    redisSet(viewsCacheKey, p.viewCount, "EX", 1800).catch(() => {});
    redisSet(detailCacheKey, JSON.stringify(finalDetail), "EX", 1800).catch(
      () => {},
    );

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
      images,
    } = body;

    if (type === "Fresh" && (!lat || !lng)) {
      throw new HttpError(
        400,
        "Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!",
      );
    }

    const user = await User.findById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    if (!user.isPremium && user.role !== "Admin") {
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
          "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!",
        );
      }
    }

    const cleanDesc = description
      ? description
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 2000)
      : null;

    const parsedPrice = typeof price === "number" ? price : parseInt(price, 10);
    const parsedWeight =
      typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight);

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
      ...(body.catchLat && body.catchLng
        ? {
            catchLocation: {
              type: "Point",
              coordinates: [
                typeof body.catchLng === "number" ? body.catchLng : parseFloat(body.catchLng),
                typeof body.catchLat === "number" ? body.catchLat : parseFloat(body.catchLat),
              ],
            },
          }
        : {}),
    });

    await newProduct.save();
    updateUserBadges(userId).catch(() => {});

    // 🛡️ Safe cache invalidation
    await redisIncr(`product:list:version:${newProduct.type}`);

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

    const targetType =
      body.type !== undefined ? body.type : currentProduct.type;
    const targetLat =
      body.lat !== undefined
        ? body.lat
        : currentProduct.location?.coordinates?.[1];
    const targetLng =
      body.lng !== undefined
        ? body.lng
        : currentProduct.location?.coordinates?.[0];

    if (targetType === "Fresh" && (!targetLat || !targetLng)) {
      throw new HttpError(
        400,
        "Tọa độ GPS vị trí mẻ hàng là bắt buộc đối với hải sản tươi sống!",
      );
    }

    const newPrice =
      body.price !== undefined ? parseInt(body.price, 10) : undefined;
    if (newPrice !== undefined && isNaN(newPrice)) {
      throw new HttpError(400, "Giá sản phẩm mới không hợp lệ");
    }

    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined)
      updateFields.description = body.description
        ? body.description
            .trim()
            .replace(/<[^>]*>/g, "")
            .slice(0, 2000)
        : null;
    if (body.origin !== undefined) updateFields.origin = body.origin;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.salesType !== undefined) updateFields.salesType = body.salesType;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.images !== undefined && Array.isArray(body.images)) {
      updateFields.images = body.images;
      const removedImages = (currentProduct.images || []).filter(
        (img) => !body.images.includes(img),
      );
      if (removedImages.length > 0) {
        const removedPublicIds = removedImages
          .map(extractPublicId)
          .filter((id): id is string => !!id);
        if (removedPublicIds.length > 0) {
          cloudinary.api
            .delete_resources(removedPublicIds)
            .catch((err: any) => {
              logger.error(
                `Cloudinary cleanup failed during product update: ${err.message}`,
              );
            });
        }
      }
    }
    if (newPrice !== undefined) updateFields.price = newPrice;
    if (body.totalWeight !== undefined)
      updateFields.totalWeight = parseFloat(body.totalWeight);
    if (body.remainingWeight !== undefined)
      updateFields.remainingWeight = parseFloat(body.remainingWeight);
    if (body.catchTime !== undefined)
      updateFields.catchTime = body.catchTime ? new Date(body.catchTime) : null;
    if (body.expiryDate !== undefined)
      updateFields.expiryDate = body.expiryDate
        ? new Date(body.expiryDate)
        : null;
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

    if (
      body.catchLat !== undefined &&
      body.catchLng !== undefined &&
      body.catchLat !== null &&
      body.catchLng !== null
    ) {
      const cLatVal = parseFloat(body.catchLat);
      const cLngVal = parseFloat(body.catchLng);
      if (!isNaN(cLatVal) && !isNaN(cLngVal)) {
        updateFields.catchLocation = {
          type: "Point",
          coordinates: [cLngVal, cLatVal],
        };
      }
    }

    const updateQuery: any = { $set: updateFields };
    if (newPrice !== undefined && newPrice !== currentProduct.price) {
      updateQuery.$push = {
        priceHistory: {
          oldPrice: currentProduct.price,
          newPrice,
          changedAt: new Date(),
        },
      };
      logger.info(`Price change logged for ProductID=${id}`);
    }

    await Product.findByIdAndUpdate(id, updateQuery);
    updateUserBadges(currentProduct.sellerId).catch(() => {});

    // 🛡️ Safe cache invalidation
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền xoá bài đăng này");

    if (currentProduct.images && currentProduct.images.length > 0) {
      const publicIds = currentProduct.images
        .map(extractPublicId)
        .filter((id): id is string => !!id);
      if (publicIds.length > 0) {
        cloudinary.api.delete_resources(publicIds).catch((err: any) => {
          logger.error(
            `Cloudinary cleanup failed during product deletion: ${err.message}`,
          );
        });
      }
    }

    await Product.findByIdAndUpdate(id, { $set: { status: "Deleted" } });
    updateUserBadges(currentProduct.sellerId).catch(() => {});
    await Notification.deleteMany({ productId: id as any });
    await User.updateMany({}, { $pull: { favorites: id as any } });
    await Report.deleteMany({ productId: id as any });

    // 🛡️ Safe cache invalidation
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
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

    // 🛡️ Safe cache invalidation
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },
};
