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
      sellerId,
    } = query;
    const { page, limit } = parsePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    const filter: any = { status: "Active" };

    // BUG FIX: sellerId bị bỏ qua trước đây → SellerProfilePage luôn lấy TẤT CẢ sản phẩm
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
      // Ưu tiên hiển thị mẻ hàng khớp với từ khóa tìm kiếm nhất
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
      .populate("sellerId", "name isVerified")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

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
      // 💡 GIẢI THÍCH CHO TEAM (Optional Chaining cho Mảng):
      // Sử dụng optional chaining dạng `?.[chỉ_mục]` bên dưới là cực kỳ quan trọng để đảm bảo an toàn.
      // Với sản phẩm không có tọa độ GPS (như hải sản khô "Dried"), `location` hoặc `coordinates` sẽ là undefined.
      // Nếu truy cập trực tiếp `coordinates[1]`, JavaScript sẽ báo lỗi nghiêm trọng "TypeError: Cannot read properties of undefined" và làm treo API.
      // Dùng cú pháp `?.[1]` và `?.[0]` giúp Node.js tự động trả về giá trị an toàn (null) nếu mảng không tồn tại mà không bao giờ bị crash!
      lat: p.location?.coordinates?.[1] || null,
      lng: p.location?.coordinates?.[0] || null,
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
      // NOTE: Tăng viewCount bất đồng bộ dưới DB để tránh block request chính.
      // Trả về dữ liệu chi tiết từ cache (viewCount có thể stale nhẹ nhưng latency tối ưu).
      Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => {});
      return JSON.parse(cachedDetail);
    }

    const p: any = await Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate("sellerId", "name isVerified");

    if (!p) throw new HttpError(404, "Không tìm thấy sản phẩm");

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
      // 💡 GIẢI THÍCH CHO TEAM (Optional Chaining cho Mảng):
      // Sử dụng optional chaining dạng `?.[chỉ_mục]` bên dưới là cực kỳ quan trọng để đảm bảo an toàn.
      // Với sản phẩm không có tọa độ GPS (như hải sản khô "Dried"), `location` hoặc `coordinates` sẽ là undefined.
      // Nếu truy cập trực tiếp `coordinates[1]`, JavaScript sẽ báo lỗi nghiêm trọng "TypeError: Cannot read properties of undefined" và làm treo API.
      // Dùng cú pháp `?.[1]` và `?.[0]` giúp Node.js tự động trả về giá trị an toàn (null) nếu mảng không tồn tại mà không bao giờ bị crash!
      lat: p.location?.coordinates?.[1] || null,
      lng: p.location?.coordinates?.[0] || null,
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

    const cleanDesc = description
      ? description.trim().replace(/<[^>]*>/g, "").slice(0, 2000)
      : null;

    const newProduct = new Product({
      sellerId: userId,
      type,
      category,
      name: name.trim(),
      description: cleanDesc,
      price: typeof price === "number" ? price : parseInt(price, 10),
      salesType: salesType ?? "Retail",
      totalWeight:
        typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight),
      remainingWeight:
        typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight),
      catchTime,
      origin,
      expiryDate,
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
    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa bài đăng này");

    const newPrice = body.price ? parseInt(body.price, 10) : undefined;
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
      logger.info(`Price change logged for ProductID=${id}`);
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
    await redis.incr(`product:list:version:${currentProduct.type}`);
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền xoá bài đăng này");

    await Product.findByIdAndUpdate(id, { $set: { status: "Deleted" } });

    await redis.del(`product:detail:${id}`);
    await redis.incr(`product:list:version:${currentProduct.type}`);
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
    await redis.incr(`product:list:version:${currentProduct.type}`);
  },
};
