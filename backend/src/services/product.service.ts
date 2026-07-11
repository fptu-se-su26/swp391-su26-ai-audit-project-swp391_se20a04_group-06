// Import đối tượng productRepository để thực thi các nghiệp vụ Mongoose trên sản phẩm hải sản
import { productRepository } from "../repositories/product.repository";
// Import đối tượng userRepository để lấy thông tin tài khoản người bán và cập nhật huy hiệu
import { userRepository } from "../repositories/user.repository";
// Import đối tượng notificationRepository để xóa thông tin thông báo khi sản phẩm bị xóa
import { notificationRepository } from "../repositories/notification.repository";
// Import đối tượng reportRepository để xóa các báo cáo vi phạm liên quan đến sản phẩm
import { reportRepository } from "../repositories/report.repository";
// Import đối tượng kết nối redis để thực hiện caching
import { redis } from "../config/redis";
// Import hằng số giới hạn khoảng cách tìm hải sản tươi sống tối đa (tính bằng km)
import { MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
// Import các hàm helper phân trang dữ liệu từ thư mục utils
import { parsePagination, paginatedResponse } from "../utils/pagination";
// Import nghiệp vụ gửi thông báo đẩy đến người theo dõi khi có sản phẩm mới
import { notifyFollowersNewProduct } from "./notification.service";
// Import đối tượng logger phục vụ ghi log hệ thống
import { logger } from "../utils/logger";
// Import thư viện mongoose để ép kiểu hoặc validate các ID dạng ObjectId
import mongoose from "mongoose";
// Import lớp lỗi HttpError phục vụ ném lỗi kèm mã trạng thái HTTP
import { HttpError } from "../errors/HttpError";
// Import đối tượng cấu hình cloudinary để dọn dẹp hình ảnh sản phẩm đã xóa
import { cloudinary } from "../config/cloudinary";
// Import hàm updateUserBadges để tính toán tự động trao danh hiệu cho ngư dân
import { updateUserBadges } from "./badge.service";
// Import hàm extractPublicId để lấy ID ảnh trên Cloudinary từ đường dẫn URL
import { extractPublicId } from "../utils/cloudinary";
// Import mô hình Mongoose User phục vụ truy xuất thông tin tài khoản ngư dân hàng loạt
import { User } from "../models/User";
import { LandingBatch } from "../models/LandingBatch";
// Import thư viện crypto để mã hóa sinh mã băm chuỗi query phục vụ key cache
import crypto from "crypto";

// Thời gian chờ tối đa cho các lệnh gọi Redis (1.5 giây) để tránh tắc nghẽn ứng dụng khi Redis gặp sự cố
const REDIS_TIMEOUT_MS = 1500;

// Hàm bao bọc tác vụ bất đồng bộ kèm cơ chế timeout
function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    // Tạo một Promise tự động phản hồi null sau khi hết REDIS_TIMEOUT_MS
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), REDIS_TIMEOUT_MS),
    ),
  ]);
}

// Lấy dữ liệu từ Redis an toàn kèm cơ chế timeout
async function redisGet(key: string): Promise<string | null> {
  try {
    return await withTimeout(redis.get(key));
  } catch {
    logger.warn(`[Redis] GET failed: ${key}`);
    return null;
  }
}

// Lưu dữ liệu vào Redis an toàn kèm cấu hình thời gian sống TTL và cơ chế timeout
async function redisSet(
  key: string,
  value: string | number,
  mode?: "EX",
  ttl?: number,
): Promise<void> {
  try {
    // Nếu có truyền mode EX và ttl thì set kèm ttl, ngược lại set vĩnh viễn
    const p =
      mode && ttl ? redis.set(key, value, mode, ttl) : redis.set(key, value);
    await withTimeout(p as Promise<any>);
  } catch {
    logger.warn(`[Redis] SET failed: ${key}`);
  }
}

// Tăng giá trị của một khóa trong Redis (dùng để quản lý số phiên bản version list nhằm xóa cache hàng loạt)
async function redisIncr(key: string): Promise<void> {
  try {
    await withTimeout(redis.incr(key));
  } catch {
    logger.warn(`[Redis] INCR failed: ${key}`);
  }
}

// Xóa một khóa trong Redis
async function redisDel(key: string): Promise<void> {
  try {
    await withTimeout(redis.del(key) as Promise<any>);
  } catch {
    logger.warn(`[Redis] DEL failed: ${key}`);
  }
}

// Xuất đối tượng productService chứa toàn bộ nghiệp vụ quản lý sản phẩm hải sản
export const productService = {
  // Lấy danh sách sản phẩm trên hệ thống có lọc khoảng cách GPS (nếu là Fresh), phân loại, và có cache Redis
  async list(query: Record<string, string | undefined>) {
    // Trích xuất kiểu sản phẩm (Fresh/Dried)
    const queryType = query.type;

    // Lấy số phiên bản danh sách hiện tại của Fresh và Dried trong Redis để đảm bảo cache không bị cũ (Stale Cache)
    const [freshVer, driedVer] = await Promise.all([
      redisGet("product:list:version:Fresh").then((v) => v ?? "0"),
      redisGet("product:list:version:Dried").then((v) => v ?? "0"),
    ]);

    // Lấy version phù hợp tùy theo kiểu sản phẩm cần truy vấn
    const listVersion =
      queryType === "Fresh"
        ? freshVer
        : queryType === "Dried"
          ? driedVer
          : `${freshVer}_${driedVer}`;

    // Chuẩn hóa và làm tròn tọa độ GPS đến 3 chữ số thập phân (để gom nhóm cache theo khu vực nhỏ, tránh phình to bộ nhớ)
    const normalizedQuery: any = { ...query };
    if (normalizedQuery.lat)
      normalizedQuery.lat = parseFloat(normalizedQuery.lat).toFixed(3);
    if (normalizedQuery.lng)
      normalizedQuery.lng = parseFloat(normalizedQuery.lng).toFixed(3);

    // Tạo mã băm SHA-256 từ chuỗi query đã chuẩn hóa
    const queryHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalizedQuery))
      .digest("hex");

    // Xây dựng khóa cache động chứa version hiện tại
    const cacheKey = `product:list:v${listVersion}:${queryHash}`;
    // Kiểm tra xem người dùng có đang thực hiện tìm kiếm từ khóa văn bản không
    const isSearching = !!(query.search && query.search.trim());

    // Nếu không tìm kiếm từ khóa, tiến hành tra cứu cache Redis để trả về ngay lập tức (giảm tải DB)
    if (!isSearching) {
      const cached = await redisGet(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }

    // Ép kiểu các tham số query đầu vào
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

    // Phân tích thông tin trang hiện tại và số phần tử giới hạn
    const { page, limit } = parsePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    // Thiết lập bộ lọc mặc định chỉ lấy sản phẩm có status là Active
    const filter: any = { status: "Active" };

    // Nếu lọc theo ID người bán
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      filter.sellerId = new mongoose.Types.ObjectId(sellerId);
    }
    // Nếu lọc theo loại Fresh/Dried
    if (type === "Fresh" || type === "Dried") filter.type = type;
    // Nếu lọc theo danh mục hải sản (loại trừ All)
    if (category && category !== "All") filter.category = category;

    // Tùy chọn sắp xếp mặc định: đẩy bài trước -> ngày tạo mới
    const sortOption: any = { bumpedAt: -1, createdAt: -1 };
    const projection: any = {};

    // Nếu có tìm kiếm từ khóa
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() }; // Sử dụng text search index
      projection.score = { $meta: "textScore" }; // Chiếu trường điểm số tương đồng
      sortOption.score = { $meta: "textScore" }; // Sắp xếp theo điểm tương đồng cao nhất
    }

    // Nếu là hải sản tươi sống (Fresh) và có truyền GPS tọa độ của người dùng xem
    if (type === "Fresh" && lat && lng) {
      const latVal = parseFloat(lat);
      const lngVal = parseFloat(lng);
      // Sử dụng toán tử $geoWithin để tìm sản phẩm nằm trong bán kính quy định (MAX_FRESH_DISTANCE_KM km)
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        filter.location = {
          $geoWithin: {
            // Đổi khoảng cách sang radian bằng cách chia bán kính Trái Đất (6378.1 km)
            $centerSphere: [[lngVal, latVal], MAX_FRESH_DISTANCE_KM / 6378.1],
          },
        };
      }
    }

    // Đếm tổng số bản ghi khớp bộ lọc phục vụ phân trang
    const total = await productRepository.countDocuments(filter);
    // Truy vấn danh sách bản ghi
    const rows = await productRepository.find(filter, projection, {
      skip,
      limit,
      sort: sortOption,
    });

    // KHẮC PHỤC LỖI N+1 QUERIES: Lấy danh sách ID người bán duy nhất từ kết quả và truy vấn duy nhất 1 lần trong RAM
    const sellerIds = Array.from(
      new Set(rows.map((p) => p.sellerId.toString())),
    );
    const sellers = await User.find({ _id: { $in: sellerIds } }).lean();
    const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));
    const batchIds = Array.from(
      new Set(
        rows
          .map((product: any) => product.batchId?.toString())
          .filter(Boolean),
      ),
    );
    const batches = batchIds.length
      ? await LandingBatch.find({
          _id: { $in: batchIds },
          status: { $ne: "Deleted" },
        })
          .select("title status")
          .lean()
      : [];
    const batchMap = new Map(
      batches.map((batch) => [batch._id.toString(), batch]),
    );

    // Định dạng cấu trúc dữ liệu trả về cho danh sách sản phẩm
    const formattedRows = rows.map((p: any) => {
      const seller: any = sellerMap.get(p.sellerId.toString());
      const batch: any = p.batchId
        ? batchMap.get(p.batchId.toString())
        : null;
      return {
        id: p._id,
        sellerId: seller?._id?.toString() || null,
        sellerName: seller?.name || "Một ngư dân",
        sellerIsVerified: seller?.isVerified ? 1 : 0,
        sellerIsPremium: seller?.isPremium ? 1 : 0,
        sellerBadges: seller?.badges || [],
        batchId: batch?._id?.toString() || null,
        batchTitle: batch?.title || null,
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
        lat: p.location?.coordinates?.[1] || null, // Vĩ độ mẻ hàng bán
        lng: p.location?.coordinates?.[0] || null, // Kinh độ mẻ hàng bán
        catchLat: p.catchLocation?.coordinates?.[1] || null, // Vĩ độ đánh bắt
        catchLng: p.catchLocation?.coordinates?.[0] || null, // Kinh độ đánh bắt
        origin: p.origin,
        expiryDate: p.expiryDate,
        createdAt: p.createdAt,
        viewCount: p.viewCount,
        bumpedAt: p.bumpedAt,
        images: p.images || [],
        coverImg: p.images?.[0] || null, // Ảnh đầu tiên làm ảnh bìa
        imgCount: p.images?.length || 0, // Tổng số lượng ảnh đính kèm
      };
    });

    // Gộp dữ liệu phân trang
    const finalResponse = paginatedResponse(formattedRows, total, page, limit);

    // Lưu kết quả vào Cache Redis nếu đây không phải tác vụ tìm kiếm từ khóa (cache tồn tại trong 10 phút)
    if (!isSearching) {
      redisSet(cacheKey, JSON.stringify(finalResponse), "EX", 600).catch(
        () => {},
      );
    }

    // Trả về kết quả cuối cùng
    return finalResponse;
  },

  // Lấy thông tin chi tiết một sản phẩm theo ID và tự động tăng lượt xem
  async getById(id: string) {
    // Xác minh ID sản phẩm có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    // Định nghĩa khóa cache cho chi tiết sản phẩm và số lượt xem
    const detailCacheKey = `product:detail:${id}`;
    const viewsCacheKey = `product:views:count:${id}`;

    // Thử truy vấn dữ liệu chi tiết sản phẩm từ Redis cache
    const cachedDetail = await redisGet(detailCacheKey);
    if (cachedDetail) {
      try {
        const parsed = JSON.parse(cachedDetail);

        // Chạy tác vụ nền cập nhật lượt xem trong DB để tránh nghẽn luồng
        productRepository
          .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
          .catch(() => {});

        // Đồng thời tăng số lượt xem trong Redis cache và cập nhật vào đối tượng phản hồi
        const rawViews = await withTimeout(
          redis.incr(viewsCacheKey).catch(() => null),
        );
        if (rawViews !== null) parsed.viewCount = rawViews;

        // Trả về kết quả từ cache
        return parsed;
      } catch {}
    }

    // Nếu không có cache, thực hiện tăng viewCount trực tiếp trong DB và lấy ra sản phẩm mới nhất
    const p: any = await productRepository.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );

    // Nếu không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa
    if (!p || p.status === "Deleted") {
      throw new HttpError(
        404,
        "Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa",
      );
    }

    // Lấy hồ sơ tài khoản người bán
    const seller = await userRepository.findById(p.sellerId.toString());
    const batch = p.batchId
      ? await LandingBatch.findOne({
          _id: p.batchId,
          status: { $ne: "Deleted" },
        })
          .select("title status")
          .lean()
      : null;

    // Chuẩn hóa cấu trúc chi tiết sản phẩm
    const finalDetail = {
      id: p._id,
      sellerId: p.sellerId,
      sellerName: seller?.name || "Một ngư dân",
      sellerIsVerified: seller?.isVerified ? 1 : 0,
      sellerIsPremium: seller?.isPremium ? 1 : 0,
      sellerBadges: seller?.badges || [],
      batchId: batch?._id?.toString() || null,
      batchTitle: batch?.title || null,
      type: p.type,
      category: p.category,
      name: p.name,
      description: p.description,
      price: p.price,
      priceHistory:
        p.priceHistory?.length
          ? p.priceHistory
          : [{ price: p.price, changedAt: p.createdAt }],
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
      // Chuyển mảng ảnh thành cấu trúc đối tượng có id
      images: (p.images || []).map((img: string, idx: number) => ({
        id: idx,
        url: img,
      })),
    };

    // Thiết lập cache cho số lượt xem và chi tiết sản phẩm trên Redis (lưu trong 30 phút)
    redisSet(viewsCacheKey, p.viewCount, "EX", 1800).catch(() => {});
    redisSet(detailCacheKey, JSON.stringify(finalDetail), "EX", 1800).catch(
      () => {},
    );

    // Trả về dữ liệu chi tiết
    return finalDetail;
  },

  // Lấy danh sách sản phẩm thuộc sở hữu của một người bán, có phân trang
  async getProducts(sellerId: string, pageStr?: string, limitStr?: string) {
    // Phân tích phân trang
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 50);
    // Gọi repository lấy danh sách và tổng số bản ghi
    const { data, total } = await productRepository.findByOwner(
      sellerId,
      offset,
      limit,
    );
    const batchIds = Array.from(
      new Set(data.map((product: any) => product.batchId).filter(Boolean)),
    );
    const batches = batchIds.length
      ? await LandingBatch.find({
          _id: { $in: batchIds },
          status: { $ne: "Deleted" },
        })
          .select("title status")
          .lean()
      : [];
    const batchMap = new Map(
      batches.map((batch) => [batch._id.toString(), batch]),
    );
    const products = data.map((product: any) => {
      const batch = product.batchId
        ? batchMap.get(String(product.batchId))
        : null;
      return {
        ...product,
        batchId: batch?._id?.toString() || null,
        batchTitle: batch?.title || null,
      };
    });
    // Trả về cấu trúc kết quả
    return { products, total, page, limit };
  },

  // Lấy số lượng bài đăng sản phẩm trong ngày hôm nay của người dùng để kiểm soát giới hạn tối đa
  async getTodayCount(userId: string) {
    // Tìm kiếm thông tin người dùng
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Lấy chuỗi ngày hôm nay theo múi giờ Việt Nam GMT+7
    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    // Xây dựng khóa đếm trong Redis
    const limitKey = `product:limit:${userId}:${dateKey}`;

    // Đọc số lượng bài đã đăng từ Redis
    const countStr = await redis.get(limitKey);
    const count = countStr ? parseInt(countStr, 10) : 0;

    // Trả về thông tin số lượng hiện tại, mức tối đa (5) và tình trạng gói Premium VIP
    return {
      count,
      max: 5,
      isPremium: !!user.isPremium,
    };
  },

  // Nghiệp vụ đăng bán một sản phẩm hải sản mới
  async create(
    userId: string, // ID người bán
    body: Record<string, any>, // Dữ liệu sản phẩm gửi lên
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

    // Yêu cầu bắt buộc phải truyền tọa độ GPS vị trí mẻ hàng đối với hải sản tươi sống (Fresh)
    if (type === "Fresh" && (lat == null || lng == null)) {
      throw new HttpError(
        400,
        "Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!",
      );
    }

    // Tìm kiếm thông tin tài khoản người dùng
    const user = await userRepository.findRawById(userId);
    // Nếu không tìm thấy, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Lấy chuỗi ngày GMT+7 và khóa đếm giới hạn
    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    const limitKey = `product:limit:${userId}:${dateKey}`;

    // Nếu người dùng không phải Premium và không phải Admin (bị giới hạn tối đa 5 bài/ngày)
    if (!user.isPremium && user.role !== "Admin") {
      // Tăng số lượng trong ngày lên 1 đơn vị
      const currentCount = await redis.incr(limitKey);
      // Thiết lập thời gian hết hạn khóa đếm là 24 giờ nếu đây là lượt đăng đầu tiên
      if (currentCount === 1) {
        await redis.expire(limitKey, 24 * 3600);
      }

      // Nếu số lượng vượt quá mức cho phép (5 bài đăng)
      if (currentCount > 5) {
        // Thực hiện giảm lại số lượng để hoàn tác và ném lỗi 403 từ chối quyền
        await redis.decr(limitKey);
        throw new HttpError(
          403,
          "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!",
        );
      }
    }

    // Làm sạch và khử HTML độc hại trong mô tả sản phẩm, giới hạn tối đa 2000 ký tự
    const cleanDesc = description
      ? description
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 2000)
      : null;

    // Ép kiểu các tham số số học
    const parsedPrice = typeof price === "number" ? price : parseInt(price, 10);
    const parsedWeight =
      typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight);

    // Nếu thông tin số liệu không hợp lệ
    if (isNaN(parsedPrice) || isNaN(parsedWeight)) {
      // Hoàn tác khóa giới hạn đăng bài nếu đã tăng trước đó
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      // Ném lỗi 400
      throw new HttpError(400, "Thông tin giá cả hoặc khối lượng không hợp lệ");
    }

    // Xây dựng mảng coordinates [lng, lat] cho vị trí mẻ hàng
    const coordinates =
      lat != null && lng != null
        ? [
            typeof lng === "number" ? lng : parseFloat(lng),
            typeof lat === "number" ? lat : parseFloat(lat),
          ]
        : undefined;
    // Xây dựng mảng coordinates cho vị trí đánh bắt hải sản (nếu có)
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
      // Gọi repository để lưu sản phẩm vào database
      savedProduct = await productRepository.create({
        sellerId: userId,
        type,
        category,
        name: name.trim(),
        description: cleanDesc,
        price: parsedPrice,
        salesType: salesType ?? "Retail", // Bán lẻ (Retail) / Bán sỉ (Wholesale)
        totalWeight: parsedWeight,
        remainingWeight: parsedWeight, // Khởi tạo khối lượng còn lại bằng tổng khối lượng
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
      // Hoàn tác khóa giới hạn đăng bài nếu xảy ra lỗi ghi DB
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      throw saveErr;
    }

    // Chạy tác vụ nền cập nhật trao danh hiệu cho ngư dân (nuốt lỗi nếu có)
    updateUserBadges(userId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${userId}: ${err.message}`,
      );
    });
    // Tăng phiên bản danh sách sản phẩm trong Redis để làm sạch cache danh sách thô tương ứng
    await redisIncr(`product:list:version:${type}`);

    // Chạy tác vụ nền thông báo cho những người theo dõi về sản phẩm mới
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

    // Trả về ID sản phẩm tạo thành công
    return { productId: savedProduct._id.toString() };
  },

  // Nghiệp vụ cập nhật thông tin sản phẩm
  async update(
    id: string, // ID sản phẩm
    userId: string, // ID người cập nhật
    role: string, // Vai trò người cập nhật
    body: Record<string, any>, // Dữ liệu cập nhật
  ): Promise<void> {
    // Kiểm tra tính hợp lệ của ID sản phẩm
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID mẻ hàng không hợp lệ");
    }

    // Tìm kiếm thông tin sản phẩm hiện tại
    const currentProduct = await productRepository.findById(id);
    // Nếu không tồn tại sản phẩm, ném lỗi 404
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    // Chặn quyền chỉnh sửa nếu người thực hiện không phải Admin và cũng không phải là chủ sản phẩm
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa bài đăng này");

    // Tính toán tổng khối lượng mới và khối lượng còn lại mới
    const finalTotalWeight =
      body.totalWeight !== undefined
        ? parseFloat(body.totalWeight)
        : currentProduct.totalWeight;
    const finalRemainingWeight =
      body.remainingWeight !== undefined
        ? parseFloat(body.remainingWeight)
        : currentProduct.remainingWeight;

    // Khối lượng còn lại không được phép vượt quá tổng khối lượng ban đầu
    if (finalRemainingWeight > finalTotalWeight) {
      throw new HttpError(
        400,
        "Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.",
      );
    }

    // Lấy thông tin kiểu sản phẩm và tọa độ GPS mới hoặc giữ nguyên cũ
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

    // Đối với hải sản tươi sống, bắt buộc phải có tọa độ GPS hợp lệ sau khi cập nhật
    if (targetType === "Fresh" && (targetLat == null || targetLng == null)) {
      throw new HttpError(
        400,
        "Tọa độ GPS vị trí mẻ hàng là bắt buộc đối với hải sản tươi sống!",
      );
    }

    // Ép kiểu giá bán
    const newPrice =
      body.price !== undefined ? parseInt(body.price, 10) : undefined;
    if (newPrice !== undefined && isNaN(newPrice)) {
      throw new HttpError(400, "Giá sản phẩm mới không hợp lệ");
    }

    // Khởi tạo các trường set và unset cho truy vấn MongoDB
    const updateFields: any = {};
    const unsetFields: any = {};

    // Cập nhật các trường văn bản và danh mục thông thường
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined)
      updateFields.description = body.description
        ? body.description
            .trim()
            .replace(/<[^>]*>/g, "") // Khử thẻ HTML
            .slice(0, 2000)
        : null;
    if (body.origin !== undefined) updateFields.origin = body.origin;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.salesType !== undefined) updateFields.salesType = body.salesType;
    if (body.status !== undefined) updateFields.status = body.status;

    // Xử lý cập nhật danh sách ảnh: xóa ảnh đã bị gỡ bỏ khỏi bài đăng trên Cloudinary CDN
    if (body.images !== undefined && Array.isArray(body.images)) {
      updateFields.images = body.images;
      // Lọc các URL ảnh cũ không còn tồn tại trong mảng ảnh mới
      const removedImages = (currentProduct.images || []).filter(
        (img) => !body.images.includes(img),
      );
      if (removedImages.length > 0) {
        // Trích xuất public ID của các ảnh này
        const removedPublicIds = removedImages
          .map(extractPublicId)
          .filter((id): id is string => !!id);
        if (removedPublicIds.length > 0) {
          // Gọi API Cloudinary xóa ảnh để giải phóng không gian lưu trữ
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

    // Cấu hình cập nhật tọa độ GPS vị trí bán
    if (body.lat === null || body.lng === null) {
      unsetFields.location = ""; // Gỡ bỏ trường vị trí nếu truyền giá trị null
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

    // Cấu hình cập nhật tọa độ GPS đánh bắt
    if (body.catchLocation === null || body.catchLng === null) {
      unsetFields.catchLocation = ""; // Gỡ bỏ trường vị trí đánh bắt nếu truyền null
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

    // Tổng hợp câu lệnh cập nhật
    const updateQuery: any = { $set: updateFields };
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    // Thực hiện cập nhật tài liệu sản phẩm
    await productRepository.findByIdAndUpdate(id, updateQuery);
    // Tính toán cập nhật lại danh hiệu ngư dân
    updateUserBadges(currentProduct.sellerId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${currentProduct.sellerId}: ${err.message}`,
      );
    });

    // Làm sạch bộ nhớ cache của sản phẩm này trong Redis và cập nhật số phiên bản để hết hạn cache danh sách thô
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },

  // Nghiệp vụ xóa mềm (Soft Delete) sản phẩm bằng cách chuyển status thành "Deleted"
  async delete(id: string, userId: string, role: string): Promise<void> {
    // Xác minh tính hợp lệ của ID sản phẩm
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    // Tìm kiếm thông tin sản phẩm
    const currentProduct = await productRepository.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    // Chặn quyền xóa nếu người thực hiện không phải Admin và cũng không phải là chủ sản phẩm
    if (role !== "Admin" && currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Bạn không có quyền xoá bài đăng này");

    // Xóa toàn bộ hình ảnh đính kèm sản phẩm trên Cloudinary CDN
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

    // Cập nhật trạng thái sản phẩm là Deleted
    await productRepository.findByIdAndUpdate(id, {
      $set: { status: "Deleted" },
    });
    // Tính toán lại danh hiệu người dùng
    updateUserBadges(currentProduct.sellerId).catch((err) => {
      logger.error(
        `[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${currentProduct.sellerId}: ${err.message}`,
      );
    });

    // Cascade Delete: Xóa toàn bộ thông báo, danh sách yêu thích và báo cáo vi phạm liên quan đến sản phẩm này
    await notificationRepository.deleteByProductId(id);
    await userRepository.updateMany({}, { $pull: { favorites: id as any } });
    await reportRepository.deleteByProductId(id as any);

    // Xóa cache chi tiết và tăng phiên bản trên Redis
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },

  // Nghiệp vụ đẩy bài đăng sản phẩm lên đầu trang tìm kiếm (cooldown 24h)
  async bump(id: string, userId: string): Promise<void> {
    // Xác minh ID sản phẩm
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "ID sản phẩm không hợp lệ");
    }

    // Tìm kiếm thông tin sản phẩm
    const currentProduct = await productRepository.findById(id);
    if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
    // Chỉ chủ nhân của mẻ hàng mới được phép đẩy bài
    if (currentProduct.sellerId.toString() !== userId)
      throw new HttpError(403, "Không có quyền");

    // Mốc thời gian giới hạn cooldown: lùi lại 24 giờ trước thời điểm hiện tại
    const cutoffTime = new Date(Date.now() - 24 * 3600 * 1000);

    // Thực hiện tìm kiếm và cập nhật thời gian đẩy bài (bumpedAt) về thời điểm hiện tại
    // Điều kiện: Sản phẩm thuộc người bán này và (đã đẩy bài cách đây hơn 24 giờ HOẶC chưa từng đẩy bài)
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

    // Nếu không cập nhật thành công (đồng nghĩa với việc mẻ hàng đã đẩy bài cách đây chưa đầy 24 giờ)
    if (!updated) {
      // Ném lỗi 429 quá nhiều yêu cầu
      throw new HttpError(
        429,
        `Sản phẩm này đã được đẩy lên gần đây. Vui lòng đẩy tin lại sau.`,
      );
    }

    // Xóa cache chi tiết và tăng phiên bản để cập nhật danh sách sản phẩm trên Redis
    await redisDel(`product:detail:${id}`);
    await redisIncr(`product:list:version:${currentProduct.type}`);
  },
};
