import { Product, IProduct } from "../models/Product";
import { User } from "../models/User";
import { redis } from "../config/redis";
import { haversineKm, MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { notifyFollowersNewProduct } from "./notification.service";
import { logger } from "../utils/logger";

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const productService = {
  async list(query: Record<string, string | undefined>) {
    let listVersion = await redis.get("product:list:version");
    if (!listVersion) {
      listVersion = "1";
      await redis.set("product:list:version", "1");
    }

    const cacheKey = `product:list:v${listVersion}:${JSON.stringify(query)}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const {
      type,
      category,
      search,
      lat,
      lng,
      page: rawPage,
      limit: rawLimit,
    } = query;
    const { page, limit } = parsePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    const filter: any = { status: "Active" };

    if (type === "Fresh" || type === "Dried") {
      filter.type = type;
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // 🌟 Thay thế $nearSphere bằng $geoWithin + $centerSphere để tương thích hoàn toàn với countDocuments()
    if (type === "Fresh" && lat && lng) {
      const latVal = parseFloat(lat);
      const lngVal = parseFloat(lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        filter.location = {
          $geoWithin: {
            $centerSphere: [
              [lngVal, latVal], // [Kinh độ, Vĩ độ] - chuẩn GeoJSON bắt buộc
              MAX_FRESH_DISTANCE_KM / 6378.1, // Chuyển đổi bán kính km sang đơn vị radian (Bán kính Trái Đất ~6378.1 km)
            ],
          },
        };
      }
    }

    // Truy vấn dữ liệu đồng thời populate (JOIN) thông tin User
    const total = await Product.countDocuments(filter);
    const rows = await Product.find(filter)
      .populate("sellerId", "name isVerified")
      .skip(skip)
      .limit(limit);

    // Ánh xạ lại dữ liệu sang cấu trúc cũ bảo toàn tính tương thích cho Frontend
    const formattedRows = rows.map((p: any) => ({
      id: p._id,
      sellerId: p.sellerId?._id || null,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
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
      lat: p.location?.coordinates[1] || null,
      lng: p.location?.coordinates[0] || null,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      coverImg: p.images[0] || null,
      imgCount: p.images.length,
    }));

    const finalResponse = paginatedResponse(formattedRows, total, page, limit);

    await redis.set(cacheKey, JSON.stringify(finalResponse), "EX", 600);
    return finalResponse;
  },

  async getById(id: string) {
    const detailCacheKey = `product:detail:${id}`;
    const cachedDetail = await redis.get(detailCacheKey);
    if (cachedDetail) {
      Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => {});
      return JSON.parse(cachedDetail);
    }

    const p: any = await Product.findById(id).populate(
      "sellerId",
      "name isVerified",
    );
    if (!p) throw new HttpError(404, "Không tìm thấy sản phẩm");

    Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => {});

    const finalDetail = {
      id: p._id,
      sellerId: p.sellerId?._id,
      sellerName: p.sellerId?.name || "Một ngư dân",
      sellerIsVerified: p.sellerId?.isVerified ? 1 : 0,
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
      lat: p.location?.coordinates[1] || null,
      lng: p.location?.coordinates[0] || null,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      images: p.images.map((img: string, idx: number) => ({
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
    } = body;

    const newProduct = new Product({
      sellerId: userId,
      type,
      category,
      name: name.trim(),
      description,
      price: parseInt(price, 10),
      salesType: salesType ?? "Retail",
      totalWeight: parseFloat(totalWeight),
      remainingWeight: parseFloat(totalWeight),
      catchTime,
      origin,
      expiryDate,
      ...(lat && lng
        ? {
            location: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
          }
        : {}),
    });

    await newProduct.save();

    await redis.incr("product:list:version");

    return { productId: newProduct._id.toString() };
  },

  async update(
    id: string,
    userId: string,
    role: string,
    body: Record<string, any>,
  ): Promise<void> {
    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa bài đăng này");

    const newPrice = body.price ? parseInt(body.price, 10) : undefined;
    const updateFields: any = {};

    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined)
      updateFields.description = body.description;
    if (body.origin !== undefined) updateFields.origin = body.origin;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.salesType !== undefined) updateFields.salesType = body.salesType;
    if (body.status !== undefined) updateFields.status = body.status;

    if (body.price !== undefined) {
      updateFields.price = parseInt(body.price, 10);
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

    if (newPrice !== undefined && newPrice !== currentProduct.price) {
      await Product.findByIdAndUpdate(id, {
        $push: {
          priceHistory: {
            oldPrice: currentProduct.price,
            newPrice: newPrice,
            changedAt: new Date(),
          },
        },
      });
      logger.info(`Price change logged in MongoDB for ProductID=${id}`);
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

    await Product.findByIdAndUpdate(id, { $set: updateFields });

    await redis.del(`product:detail:${id}`);
    await redis.incr("product:list:version");
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền xoá bài đăng này");

    await Product.findByIdAndUpdate(id, { $set: { status: "Deleted" } });

    await redis.del(`product:detail:${id}`);
    await redis.incr("product:list:version");
  },

  async bump(id: string, userId: string): Promise<void> {
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
    await redis.incr("product:list:version");
  },
};
