import mongoose from "mongoose";
import { redis } from "../config/redis";
import { HttpError } from "../errors/HttpError";
import { BoatLog } from "../models/BoatLog";
import {
  ILandingBatch,
  LandingBatch,
  LandingBatchStatus,
} from "../models/LandingBatch";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { notifyFollowersNewLandingBatch } from "./notification.service";

type Actor = {
  userId: string;
  role: "User" | "Admin";
};

type BatchStats = {
  productCount: number;
  totalWeight: number;
  remainingWeight: number;
  soldWeight: number;
  minPrice: number | null;
  maxPrice: number | null;
  categories: string[];
};

const emptyStats = (): BatchStats => ({
  productCount: 0,
  totalWeight: 0,
  remainingWeight: 0,
  soldWeight: 0,
  minPrice: null,
  maxPrice: null,
  categories: [],
});

function ensureObjectId(id: string, label = "ID vựa cá") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} không hợp lệ`);
  }
}

function cleanOptional(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || undefined;
}

function normalizeLocation(body: Record<string, any>) {
  let lng: number | undefined;
  let lat: number | undefined;

  if (
    body.location?.type === "Point" &&
    Array.isArray(body.location.coordinates) &&
    body.location.coordinates.length === 2
  ) {
    lng = Number(body.location.coordinates[0]);
    lat = Number(body.location.coordinates[1]);
  } else if (body.lat !== undefined && body.lng !== undefined) {
    lng = Number(body.lng);
    lat = Number(body.lat);
  }

  if (lng !== undefined && lat !== undefined) {
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new HttpError(400, "Tọa độ địa lý không hợp lệ (Kinh độ [-180, 180], Vĩ độ [-90, 90])");
    }
    return {
      type: "Point" as const,
      coordinates: [lng, lat] as [number, number],
    };
  }
  return undefined;
}

function toBatchPayload(body: Record<string, any>) {
  const payload: Record<string, any> = {};
  const textFields: Array<[string, number]> = [
    ["title", 160],
    ["description", 3000],
    ["boatName", 120],
    ["catchArea", 200],
    ["origin", 200],
  ];

  for (const [field, maxLength] of textFields) {
    if (body[field] !== undefined) {
      payload[field] = cleanOptional(body[field], maxLength) ?? null;
    }
  }
  for (const field of ["catchTime", "landingTime"]) {
    if (body[field] !== undefined) {
      payload[field] = body[field] ? new Date(body[field]) : undefined;
    }
  }
  if (
    body.lat !== undefined ||
    body.lng !== undefined ||
    body.location !== undefined
  ) {
    payload.location = normalizeLocation(body);
  }
  if (Array.isArray(body.images)) payload.images = body.images.slice(0, 8);
  if (body.status === "Active" || body.status === "Closed") {
    payload.status = body.status;
  }
  if (body.boatLogId) {
    ensureObjectId(body.boatLogId, "ID nhật ký");
    payload.boatLogId = body.boatLogId;
  }
  return payload;
}

async function getStatsByBatchIds(ids: mongoose.Types.ObjectId[]) {
  if (ids.length === 0) return new Map<string, BatchStats>();
  const rows = await Product.aggregate([
    {
      $match: {
        batchId: { $in: ids },
        status: { $ne: "Deleted" },
      },
    },
    {
      $group: {
        _id: "$batchId",
        productCount: { $sum: 1 },
        totalWeight: { $sum: "$totalWeight" },
        remainingWeight: { $sum: "$remainingWeight" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        categories: { $addToSet: "$category" },
      },
    },
  ]);

  return new Map(
    rows.map((row) => {
      const totalWeight = Number(row.totalWeight || 0);
      const remainingWeight = Number(row.remainingWeight || 0);
      return [
        row._id.toString(),
        {
          productCount: Number(row.productCount || 0),
          totalWeight,
          remainingWeight,
          soldWeight: Math.max(0, totalWeight - remainingWeight),
          minPrice: row.minPrice ?? null,
          maxPrice: row.maxPrice ?? null,
          categories: row.categories || [],
        },
      ];
    }),
  );
}

function formatProduct(product: any) {
  return {
    id: product._id.toString(),
    sellerId: product.sellerId.toString(),
    batchId: product.batchId?.toString() || null,
    type: product.type,
    category: product.category,
    name: product.name,
    description: product.description,
    price: product.price,
    salesType: product.salesType,
    totalWeight: product.totalWeight,
    remainingWeight: product.remainingWeight,
    status: product.status,
    catchTime: product.catchTime,
    origin: product.origin,
    expiryDate: product.expiryDate,
    images: product.images || [],
    coverImg: product.images?.[0] || null,
    lat: product.location?.coordinates?.[1] ?? null,
    lng: product.location?.coordinates?.[0] ?? null,
    createdAt: product.createdAt,
    viewCount: product.viewCount || 0,
  };
}

function getFreshnessLabel(batch: any) {
  if (batch.status !== "Active") return null;
  const reference = batch.landingTime || batch.createdAt;
  if (!reference) return "Đang bán";
  const referenceTime = new Date(reference).getTime();
  if (!Number.isFinite(referenceTime)) return "Đang bán";

  const ageHours = (Date.now() - referenceTime) / 3_600_000;
  if (ageHours < -1) return "Sắp cập bến";
  if (ageHours <= 24) return "Mới cập bến";
  if (ageHours <= 72) return "Vừa cập bến";
  return "Đang bán";
}

function formatBatch(
  batch: any,
  stats: BatchStats,
  seller?: any,
  topProducts: any[] = [],
) {
  return {
    id: batch._id.toString(),
    sellerId: batch.sellerId.toString(),
    sellerName: seller?.name || "Một ngư dân",
    sellerAvatar: seller?.avatar || null,
    sellerIsVerified: Boolean(seller?.isVerified),
    sellerIsPremium: Boolean(seller?.isPremium),
    title: batch.title,
    description: batch.description || "",
    boatName: batch.boatName || "",
    catchArea: batch.catchArea || "",
    catchTime: batch.catchTime || null,
    landingTime: batch.landingTime || null,
    origin: batch.origin || "",
    lat: batch.location?.coordinates?.[1] ?? null,
    lng: batch.location?.coordinates?.[0] ?? null,
    images: batch.images || [],
    coverImg: batch.images?.[0] || topProducts[0]?.coverImg || null,
    status: batch.status,
    freshnessLabel: getFreshnessLabel(batch),
    boatLogId: batch.boatLogId?.toString() || null,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    ...stats,
    priceRange:
      stats.minPrice == null
        ? null
        : { min: stats.minPrice, max: stats.maxPrice ?? stats.minPrice },
    topProducts,
  };
}

async function assertCanManage(id: string, actor: Actor) {
  ensureObjectId(id);
  const batch = await LandingBatch.findById(id);
  if (!batch) throw new HttpError(404, "Không tìm thấy vựa cá");
  if (
    actor.role !== "Admin" &&
    batch.sellerId.toString() !== actor.userId
  ) {
    throw new HttpError(403, "Bạn không có quyền quản lý vựa cá này");
  }
  return batch;
}

async function listBatches(
  filter: Record<string, any>,
  page: number,
  limit: number,
  includeTopProducts = false,
) {
  const skip = (page - 1) * limit;
  const [batches, total] = await Promise.all([
    LandingBatch.find(filter)
      .sort({ landingTime: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LandingBatch.countDocuments(filter),
  ]);
  const batchIds = batches.map((batch) => batch._id);
  const sellerIds = [...new Set(batches.map((batch) => batch.sellerId.toString()))];
  const [statsMap, sellers] = await Promise.all([
    getStatsByBatchIds(batchIds),
    User.find({ _id: { $in: sellerIds } })
      .select("name avatar isVerified isPremium")
      .lean(),
  ]);
  const sellerMap = new Map(sellers.map((seller) => [seller._id.toString(), seller]));
  const productMap = new Map<string, any[]>();

  if (includeTopProducts && batchIds.length > 0) {
    const products = await Product.find({
      batchId: { $in: batchIds },
      status: "Active",
    })
      .sort({ bumpedAt: -1, createdAt: -1 })
      .lean();
    for (const product of products) {
      const key = product.batchId?.toString();
      if (!key) continue;
      const current = productMap.get(key) || [];
      if (current.length < 3) current.push(formatProduct(product));
      productMap.set(key, current);
    }
  }

  return {
    data: batches.map((batch) => {
      const id = batch._id.toString();
      return formatBatch(
        batch,
        statsMap.get(id) || emptyStats(),
        sellerMap.get(batch.sellerId.toString()),
        productMap.get(id) || [],
      );
    }),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export const landingBatchService = {
  async listPublic(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const filter: Record<string, any> = {
      status: query.status === "Closed" ? "Closed" : "Active",
    };
    if (query.sellerId) {
      ensureObjectId(query.sellerId, "ID người bán");
      filter.sellerId = query.sellerId;
    }
    if (typeof query.origin === "string" && query.origin.trim()) {
      filter.origin = { $regex: query.origin.trim(), $options: "i" };
    }
    return listBatches(filter, page, limit, Boolean(query.marketplace));
  },

  async listMarketplace(query: Record<string, any>) {
    return this.listPublic({ ...query, marketplace: true, status: "Active" });
  },

  async listMine(userId: string, query: Record<string, any>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    return listBatches(
      { sellerId: userId, status: { $ne: "Deleted" } },
      page,
      limit,
      true,
    );
  },

  async listAdmin(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const filter: Record<string, any> = {};
    if (["Active", "Closed", "Deleted"].includes(query.status)) {
      filter.status = query.status;
    }
    return listBatches(filter, page, limit, true);
  },

  async getById(id: string) {
    ensureObjectId(id);
    const batch = await LandingBatch.findOne({
      _id: id,
      status: { $ne: "Deleted" },
    }).lean();
    if (!batch) throw new HttpError(404, "Không tìm thấy vựa cá");

    const [statsMap, seller, products, boatLog] = await Promise.all([
      getStatsByBatchIds([batch._id]),
      User.findById(batch.sellerId)
        .select("name avatar isVerified isPremium badges")
        .lean(),
      Product.find({ batchId: batch._id, status: { $ne: "Deleted" } })
        .sort({ status: 1, bumpedAt: -1, createdAt: -1 })
        .lean(),
      batch.boatLogId ? BoatLog.findById(batch.boatLogId).lean() : null,
    ]);
    const formattedProducts = products.map((product) => ({
      ...formatProduct(product),
      sellerName: seller?.name || "Một ngư dân",
      sellerIsVerified: Boolean(seller?.isVerified),
      sellerIsPremium: Boolean(seller?.isPremium),
      batchTitle: batch.title,
    }));

    return {
      ...formatBatch(
        batch,
        statsMap.get(batch._id.toString()) || emptyStats(),
        seller,
      ),
      products: formattedProducts,
      boatLog: boatLog
        ? {
            id: boatLog._id.toString(),
            content: boatLog.content,
            images: boatLog.images || [],
            createdAt: boatLog.createdAt,
          }
        : null,
    };
  },

  async create(userId: string, body: Record<string, any>) {
    const payload = toBatchPayload(body);
    if (!payload.title) throw new HttpError(400, "Tên vựa cá là bắt buộc");
    const batch = await LandingBatch.create({
      ...payload,
      sellerId: userId,
      status: "Active",
      images: payload.images || [],
    });
    if (payload.boatLogId) {
      await BoatLog.updateOne(
        { _id: payload.boatLogId, userId },
        { $set: { batchId: batch._id } },
      );
    }
    return { id: batch._id.toString(), message: "Tạo vựa cá thành công" };
  },

  async update(id: string, actor: Actor, body: Record<string, any>) {
    const batch = await assertCanManage(id, actor);
    const payload = toBatchPayload(body);
    delete payload.boatLogId;
    Object.assign(batch, payload);
    await batch.save();
    return { message: "Cập nhật vựa cá thành công" };
  },

  async softDelete(id: string, actor: Actor) {
    const batch = await assertCanManage(id, actor);
    batch.status = "Deleted";
    await batch.save();
    return { message: "Đã ẩn vựa cá" };
  },

  async addProducts(
    id: string,
    actor: Actor,
    rows: Array<Record<string, any>>,
  ) {
    const batch = await assertCanManage(id, actor);
    if (batch.status !== "Active") {
      throw new HttpError(409, "Chỉ có thể thêm sản phẩm vào vựa đang mở");
    }

    const documents = rows.map((row) => {
      const totalWeight = Number(row.totalWeight);
      const remainingWeight =
        row.remainingWeight === undefined
          ? totalWeight
          : Number(row.remainingWeight);
      const rowLocation =
        row.lat !== undefined && row.lng !== undefined
          ? {
              type: "Point" as const,
              coordinates: [Number(row.lng), Number(row.lat)],
            }
          : batch.location;

      if (row.type === "Fresh" && !rowLocation) {
        throw new HttpError(
          400,
          `Sản phẩm tươi "${row.name}" cần vị trí GPS của vựa hoặc sản phẩm`,
        );
      }
      if (remainingWeight > totalWeight) {
        throw new HttpError(
          400,
          `Khối lượng còn lại của "${row.name}" vượt quá tổng khối lượng`,
        );
      }

      return {
        sellerId: batch.sellerId,
        batchId: batch._id,
        type: row.type,
        category: row.category,
        name: cleanOptional(row.name, 150),
        description: cleanOptional(row.description, 2000) || null,
        price: Number(row.price),
        salesType: row.salesType || "Retail",
        totalWeight,
        remainingWeight,
        status: "Active",
        location: rowLocation,
        catchTime: row.catchTime
          ? new Date(row.catchTime)
          : batch.catchTime,
        origin:
          cleanOptional(row.origin, 200) ||
          batch.origin ||
          batch.catchArea,
        expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
        images:
          Array.isArray(row.images) && row.images.length > 0
            ? row.images.slice(0, 5)
            : batch.images.slice(0, 5),
        bumpedAt: new Date(),
      };
    });

    const products = await Product.insertMany(documents, { ordered: true });
    await LandingBatch.updateOne(
      { _id: batch._id },
      { $set: { updatedAt: new Date() } },
    );
    await Promise.all(
      [...new Set(documents.map((document) => document.type))].map((type) =>
        redis.incr(`product:list:version:${type}`).catch(() => null),
      ),
    );

    if (!batch.notificationSentAt) {
      const seller = await User.findById(batch.sellerId).select("name").lean();
      await notifyFollowersNewLandingBatch({
        sellerId: batch.sellerId.toString(),
        sellerName: seller?.name || "Một ngư dân",
        landingBatchId: batch._id.toString(),
        productCount: await Product.countDocuments({
          batchId: batch._id,
          status: { $ne: "Deleted" },
        }),
      });
      batch.notificationSentAt = new Date();
      await batch.save();
    }

    return {
      message: "Đã thêm sản phẩm vào vựa cá",
      productIds: products.map((product) => product._id.toString()),
    };
  },

  async createFromBoatLog(logId: string, actor: Actor) {
    ensureObjectId(logId, "ID nhật ký");
    const log = await BoatLog.findById(logId);
    if (!log) throw new HttpError(404, "Không tìm thấy nhật ký cabin");
    if (actor.role !== "Admin" && log.userId.toString() !== actor.userId) {
      throw new HttpError(403, "Bạn không có quyền dùng nhật ký này");
    }
    if (log.batchId) {
      throw new HttpError(409, "Nhật ký này đã liên kết với một vựa cá");
    }

    const titleDate = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(log.createdAt);
    const batch = await LandingBatch.create({
      sellerId: log.userId,
      title: log.boatName
        ? `Phiên cập bến - ${log.boatName}`
        : `Phiên cập bến ngày ${titleDate}`,
      description: log.content,
      boatName: log.boatName,
      catchArea: log.catchArea,
      landingTime: log.landingTime,
      origin: log.origin,
      images: log.images || [],
      status: "Active",
      boatLogId: log._id,
    });
    log.batchId = batch._id;
    await log.save();
    return {
      id: batch._id.toString(),
      message: "Đã tạo vựa cá từ nhật ký cabin",
    };
  },
};
