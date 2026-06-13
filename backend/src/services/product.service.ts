import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { reportRepository } from "../repositories/report.repository";
import { redis } from "../config/redis";
import { MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { notifyFollowersNewProduct } from "./notification.service";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { HttpError } from "../errors/HttpError";
import { cloudinary } from "../config/cloudinary";
import { updateUserBadges } from "./badge.service";
import { extractPublicId } from "../utils/cloudinary";
import { User } from "../models/User";
import crypto from "crypto";

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

export const productService = {
  async list(query: Record<string, string | undefined>) {
    const queryType = query.type;

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

    const normalizedQuery: any = { ...query };
    if (normalizedQuery.lat)
      normalizedQuery.lat = parseFloat(normalizedQuery.lat).toFixed(3);
    if (normalizedQuery.lng)
      normalizedQuery.lng = parseFloat(normalizedQuery.lng).toFixed(3);

    const queryHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalizedQuery))
      .digest("hex");

    const cacheKey = `product:list:v${listVersion}:${queryHash}`;
    const isSearching = !!(query.search && query.search.trim());

    if (!isSearching) {
      const cached = await redisGet(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }

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

    const total = await productRepository.countDocuments(filter);
    const rows = await productRepository.find(filter, projection, {
      skip,
      limit,
      sort: sortOption,
    });

    const sellerIds = Array.from(
      new Set(rows.map((p) => p.sellerId.toString())),
    );
    const sellers = await User.find({ _id: { $in: sellerIds } }).lean();
    const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));

    const formattedRows = rows.map((p: any) => {
      const seller: any = sellerMap.get(p.sellerId.toString());
      return {
        id: p._id,
        sellerId: seller?._id?.toString() || null,
        sellerName: seller?.name || "Một ngư dân",
        sellerIsVerified: seller?.isVerified ? 1 : 0,
        sellerIsPremium: seller?.isPremium ? 1 : 0,
        sellerBadges: seller?.badges || [],
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
      };
    });

    const finalResponse = paginatedResponse(formattedRows, total, page, limit);

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

    const cachedDetail = await redisGet(detailCacheKey);
    if (cachedDetail) {
      try {
        const parsed = JSON.parse(cachedDetail);

        productRepository
          .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
          .catch(() => {});

        const rawViews = await withTimeout(
          redis.incr(viewsCacheKey).catch(() => null),
        );
        if (rawViews !== null) parsed.viewCount = rawViews;

        return parsed;
      } catch {}
    }

    const p: any = await productRepository.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );

    if (!p || p.status === "Deleted") {
      throw new HttpError(
        404,
        "Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa",
      );
    }

    const seller = await userRepository.findById(p.sellerId.toString());

    const finalDetail = {
      id: p._id,
      sellerId: p.sellerId,
      sellerName: seller?.name || "Một ngư dân",
      sellerIsVerified: seller?.isVerified ? 1 : 0,
      sellerIsPremium: seller?.isPremium ? 1 : 0,
      sellerBadges: seller?.badges || [],
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

    redisSet(viewsCacheKey, p.viewCount, "EX", 1800).catch(() => {});
    redisSet(detailCacheKey, JSON.stringify(finalDetail), "EX", 1800).catch(
      () => {},
    );

    return finalDetail;
  },

  // Sửa đổi phương thức này để giải quyết triệt để lỗi TS2339
  async getProducts(sellerId: string, pageStr?: string, limitStr?: string) {
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 50);
    const { data, total } = await productRepository.findByOwner(
      sellerId,
      offset,
      limit,
    );
    return { products: data, total, page, limit };
  },

  async getTodayCount(userId: string) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    const limitKey = `product:limit:${userId}:${dateKey}`;

    const countStr = await redis.get(limitKey);
    const count = countStr ? parseInt(countStr, 10) : 0;

    return {
      count,
      max: 5,
      isPremium: !!user.isPremium,
    };
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

    if (type === "Fresh" && (lat == null || lng == null)) {
      throw new HttpError(
        400,
        "Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!",
      );
    }

    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    const limitKey = `product:limit:${userId}:${dateKey}`;

    if (!user.isPremium && user.role !== "Admin") {
      const currentCount = await redis.incr(limitKey);
      if (currentCount === 1) {
        await redis.expire(limitKey, 24 * 3600);
      }

      if (currentCount > 5) {
        await redis.decr(limitKey);
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
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      throw new HttpError(400, "Thông tin giá cả hoặc khối lượng không hợp lệ");
    }

    const coordinates =
      lat != null && lng != null
        ? [
            typeof lng === "number" ? lng : parseFloat(lng),
            typeof lat === "number" ? lat : parseFloat(lat),
          ]
        : undefined;
    const catchCoordinates =
      body.catchLat != null && body.catchLng != null
        ? [
            typeof body.catchLng === "number"
              ? body.catchLng
              : parseFloat(body.catchLng),
            typeof body.catchLat === "number"
              ? body.catchLat
              : parseFloat(body.catchLat),
          ]
        : undefined;

    let savedProduct;
    try {
      savedProduct = await productRepository.create({
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
        location: coordinates ? { type: "Point", coordinates } : undefined,
        catchLocation: catchCoordinates
          ? { type: "Point", coordinates: catchCoordinates }
          : undefined,
      });
    } catch (saveErr) {
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      throw saveErr;
    }

    updateUserBadges(userId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${userId}: ${err.message}`,
      );
    });
    await redisIncr(`product:list:version:${type}`);

    userRepository
      .findRawById(userId)
      .then((seller: any) =>
        notifyFollowersNewProduct(
          userId,
          seller?.name || "Một ngư dân",
          savedProduct._id.toString(),
          savedProduct.name,
        ),
      )
      .catch((err: any) =>
        logger.error(
          `[Notify] notifyFollowersNewProduct failed: ${err.message}`,
        ),
      );

    return { productId: savedProduct._id.toString() };
  },

  async update(
    id: string,
    userId: string,
    role: string,
    body: Record<string, any>,
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID mẻ hàng không hợp lệ");
    }

    const currentProduct = await productRepository.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa bài đăng này");

    const finalTotalWeight =
      body.totalWeight !== undefined
        ? parseFloat(body.totalWeight)
        : currentProduct.totalWeight;
    const finalRemainingWeight =
      body.remainingWeight !== undefined
        ? parseFloat(body.remainingWeight)
        : currentProduct.remainingWeight;

    if (finalRemainingWeight > finalTotalWeight) {
      throw new HttpError(
        400,
        "Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.",
      );
    }

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

    if (targetType === "Fresh" && (targetLat == null || targetLng == null)) {
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
    const unsetFields: any = {};

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
                `Cloudinary cleanup failed during update: ${err.message}`,
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

    if (body.lat === null || body.lng === null) {
      unsetFields.location = "";
    } else if (body.lat != null && body.lng != null) {
      const latVal = parseFloat(body.lat);
      const lngVal = parseFloat(body.lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        updateFields.location = {
          type: "Point",
          coordinates: [lngVal, latVal],
        };
      }
    }

    if (body.catchLocation === null || body.catchLng === null) {
      unsetFields.catchLocation = "";
    } else if (body.catchLat != null && body.catchLng != null) {
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
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    await productRepository.findByIdAndUpdate(id, updateQuery);
    updateUserBadges(currentProduct.sellerId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${currentProduct.sellerId}: ${err.message}`,
      );
    });

    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await productRepository.findById(id);
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
            `Cloudinary cleanup failed during deletion: ${err.message}`,
          );
        });
      }
    }

    await productRepository.findByIdAndUpdate(id, {
      $set: { status: "Deleted" },
    });
    updateUserBadges(currentProduct.sellerId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${currentProduct.sellerId}: ${err.message}`,
      );
    });

    await notificationRepository.deleteByProductId(id);
    await userRepository.updateMany({}, { $pull: { favorites: id as any } });
    await reportRepository.deleteByProductId(id as any);

    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },

  async bump(id: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    const currentProduct = await productRepository.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Không có quyền");

    const cutoffTime = new Date(Date.now() - 24 * 3600 * 1000);

    const updated = await productRepository.findOneAndUpdate(
      {
        _id: id,
        sellerId: userId,
        $or: [
          { bumpedAt: { $lte: cutoffTime } },
          { bumpedAt: { $exists: false } },
        ],
      },
      { $set: { bumpedAt: new Date() } },
    );

    if (!updated) {
      throw new HttpError(
        429,
        `Sản phẩm này đã được đẩy lên gần đây. Vui lòng đẩy tin lại sau.`,
      );
    }

    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },
};
