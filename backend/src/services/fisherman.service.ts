// Import thư viện mongoose để thực hiện xử lý ép kiểu và kiểm định ObjectId hợp lệ
import mongoose, { Types } from "mongoose";
// Import userRepository để tương tác dữ liệu người dùng
import { userRepository } from "../repositories/user.repository";
// Import productRepository để truy vấn danh sách sản phẩm đăng tải
import { productRepository } from "../repositories/product.repository";
// Import recipeRepository để truy vấn danh sách công thức nấu ăn của ngư dân
import { recipeRepository } from "../repositories/recipe.repository";
// Import postRepository để truy vấn danh sách bài viết trên diễn đàn
import { postRepository } from "../repositories/post.repository";
// Import boatLogRepository để truy vấn danh sách nhật ký cabin đi biển
import { boatLogRepository } from "../repositories/boatlog.repository";
// Import reviewRepository để lấy điểm số và đánh giá của người mua dành cho ngư dân
import { reviewRepository } from "../repositories/review.repository";
// Import lớp HttpError phục vụ ném lỗi kèm mã trạng thái HTTP
import { HttpError } from "../errors/HttpError";
// Import hàm helper phân trang dữ liệu parsePagination
import { parsePagination } from "../utils/pagination";

// Hàm xử lý an toàn hóa từ khóa Regex đầu vào chống ReDoS
function escapeRegExp(string: string): string {
  // Thay thế ký tự đặc biệt bằng ký tự escape
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// Xuất đối tượng fishermanService chứa logic nghiệp vụ quản lý thông tin các ngư dân (người bán)
export const fishermanService = {
  // Nghiệp vụ lấy danh sách tất cả ngư dân trong hệ thống kèm bộ lọc và phân trang
  async list(query: {
    page?: string; // Số trang hiện tại
    limit?: string; // Giới hạn số dòng trên trang
    verified?: string; // Lọc ngư dân đã được tích xanh xác minh
    hasActive?: string; // Lọc ngư dân đang có sản phẩm hiển thị trên sàn
    search?: string; // Từ khóa tìm kiếm theo tên ngư dân
  }) {
    // Ép kiểu trang hiện tại, đảm bảo tối thiểu là 1
    const page = Math.max(1, parseInt(query.page || "1", 10));
    // Ép kiểu giới hạn số dòng, đảm bảo nằm trong khoảng từ 1 đến 50
    const limit = Math.min(Math.max(1, parseInt(query.limit || "20", 10)), 50);
    // Tính khoảng offset bỏ qua để phân trang
    const offset = (page - 1) * limit;

    // Xác định bộ lọc tích xanh từ query
    const verified = query.verified === "true";
    // Xác định bộ lọc chỉ lấy ngư dân có sản phẩm đang hoạt động, mặc định là true
    const hasActive = query.hasActive !== "false";

    // Khởi tạo bộ lọc ID người bán rỗng
    let sellerIdFilter: any = {};
    // Nếu yêu cầu lọc chỉ lấy ngư dân đang có hàng bày bán
    if (hasActive) {
      // Lấy danh sách các ID người bán duy nhất đang có sản phẩm Active trên sàn
      const activeSellerIds = await productRepository.distinct("sellerId", {
        status: "Active",
      });
      // Nếu không có bất kỳ ai bán hàng, trả về mảng rỗng ngay lập tức để tiết kiệm chi phí
      if (activeSellerIds.length === 0)
        return { data: [], page, limit, total: 0, totalPages: 0 };
      // Thiết lập bộ lọc chỉ tìm kiếm những tài khoản nằm trong danh sách activeSellerIds
      sellerIdFilter = { _id: { $in: activeSellerIds } };
    }

    // Thiết lập bộ lọc chung cho tài khoản người dùng
    const filter: any = {
      ...sellerIdFilter,
      isActive: true, // Tài khoản phải đang hoạt động (không bị khóa)
      role: { $ne: "Admin" }, // Loại trừ tài khoản Admin khỏi danh sách ngư dân
    };
    // Nếu lọc theo tích xanh xác minh
    if (verified) filter.isVerified = true;
    // Nếu có từ khóa tìm kiếm theo tên
    if (query.search)
      filter.name = { $regex: escapeRegExp(query.search), $options: "i" }; // Tìm kiếm không phân biệt chữ hoa thường

    // Đếm tổng số lượng người dùng thỏa mãn bộ lọc
    const total = await userRepository.countDocuments(filter);
    // Tìm kiếm danh sách người dùng, ưu tiên sắp xếp: Tài khoản Premium lên đầu -> đã xác minh -> ngày tạo mới nhất
    const users = await userRepository.find(
      filter,
      { isPremium: -1, isVerified: -1, createdAt: -1 },
      offset,
      limit,
    );

    // Nếu không có bản ghi nào phù hợp, trả về cấu trúc rỗng
    if (users.length === 0)
      return { data: [], page, limit, total, totalPages: 0 };

    // Trích xuất mảng ID người dùng để thống kê hiệu năng hàng loạt
    const ids = users.map((u: any) => u._id);

    // Truy vấn đồng thời thống kê số sản phẩm Active và điểm đánh giá rating để tối ưu hóa truy vấn
    const [productCounts, reviewStats] = await Promise.all([
      // Thống kê số lượng sản phẩm Active của từng ID người bán
      productRepository.aggregate([
        { $match: { sellerId: { $in: ids }, status: "Active" } },
        { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      ]),
      // Thống kê điểm rating trung bình và tổng số review nhận được của từng ID người bán
      reviewRepository.aggregate([
        { $match: { sellerId: { $in: ids } } },
        {
          $group: {
            _id: "$sellerId",
            avg: { $avg: "$rating" },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Chuyển đổi dữ liệu thống kê sản phẩm sang dạng Map tra cứu nhanh O(1)
    const productMap = new Map(
      productCounts.map((p: any) => [p._id.toString(), p.count]),
    );
    // Chuyển đổi dữ liệu thống kê review sang dạng Map tra cứu nhanh O(1)
    const reviewMap = new Map(
      reviewStats.map((r: any) => [r._id.toString(), r]),
    );

    // Định dạng dữ liệu danh sách ngư dân trước khi phản hồi
    const data = users.map((u: any) => {
      const rv = reviewMap.get(u._id.toString());
      return {
        id: u._id,
        name: u.name,
        avatar: u.avatar ?? null,
        isVerified: u.isVerified ?? false,
        isPremium: u.isPremium ?? false,
        badges: u.badges ?? [],
        activeProducts: productMap.get(u._id.toString()) ?? 0, // Số sản phẩm đang hiển thị
        avgRating: rv ? Math.round(rv.avg * 10) / 10 : 0, // Làm tròn điểm số
        ratingCount: rv?.total ?? 0, // Số lượt đánh giá nhận được
        memberSince: u.createdAt, // Ngày tham gia hệ thống
      };
    });

    // Trả về kết quả danh sách ngư dân cùng thông tin phân trang hoàn chỉnh
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  },

  // Nghiệp vụ lấy thông tin chi tiết hồ sơ của một ngư dân cụ thể bằng ID
  async getProfile(rawId: string) {
    // Kiểm tra tính hợp lệ của ID, nếu không hợp lệ ném lỗi 400
    if (!mongoose.Types.ObjectId.isValid(rawId))
      throw new HttpError(400, "ID ngư dân không hợp lệ");
    // Khởi tạo đối tượng ObjectId từ chuỗi ID
    const id = new Types.ObjectId(rawId);

    // Sử dụng Promise.all và countDocuments thay vì pull document đầy đủ để tối ưu hóa hiệu năng
    const [
      user, // Thông tin tài khoản
      prodCount, // Số lượng sản phẩm đang rao bán
      recipeCount, // Số lượng công thức nấu ăn đã chia sẻ
      postCount, // Số lượng bài viết trên diễn đàn
      boatLogCount, // Số lượng nhật ký cabin đã ghi
      reviewAgg, // Thống kê đánh giá của người bán này
      followersCount, // Số lượng người theo dõi ngư dân này
      recentProducts, // Danh sách tối đa 4 sản phẩm Active mới nhất/mới đẩy bài
      recentRecipes, // Danh sách tối đa 3 công thức mới nhất
      recentPosts, // Danh sách tối đa 3 bài viết mới nhất
    ] = await Promise.all([
      userRepository.findRawById(rawId), // Lấy người dùng thô
      productRepository.countDocuments({ sellerId: id, status: "Active" }), // Đếm sản phẩm
      recipeRepository.countDocuments({ authorId: id }), // Đếm công thức
      postRepository.countDocuments({ userId: id }), // Đếm bài viết
      boatLogRepository.countDocuments({ userId: id }), // Đếm nhật ký cabin
      reviewRepository.aggregate([ // Tổng hợp đánh giá
        { $match: { sellerId: id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),
      userRepository.countDocuments({ following: id }), // Đếm số người đang theo dõi
      productRepository.find( // Lấy 4 sản phẩm gần nhất
        { sellerId: id, status: "Active" },
        {
          name: 1,
          price: 1,
          type: 1,
          category: 1,
          images: 1,
          remainingWeight: 1,
          bumpedAt: 1,
        },
        { sort: { bumpedAt: -1, createdAt: -1 }, limit: 4 },
      ),
      recipeRepository.findAll({ authorId: id }, 0, 3), // Lấy 3 công thức gần nhất
      postRepository.findAll({ userId: id }, 0, 3), // Lấy 3 bài đăng gần nhất
    ]);

    // Nếu không tìm thấy người dùng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy ngư dân này");

    // Lấy thông tin thống kê đánh giá
    const rv = (reviewAgg as any[])[0];

    // Trả về cấu trúc hồ sơ đầy đủ chi tiết của ngư dân
    return {
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar ?? null,
        isVerified: user.isVerified ?? false,
        isPremium: user.isPremium ?? false,
        badges: user.badges ?? [],
        memberSince: user.createdAt,
      },
      stats: {
        activeProducts: prodCount,
        totalRecipes: recipeCount,
        totalPosts: postCount,
        totalBoatLogs: boatLogCount,
        avgRating: rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount: rv?.total ?? 0,
        followersCount,
      },
      // Chuẩn hóa danh sách sản phẩm gần nhất
      recentProducts: recentProducts.map((p: any) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        type: p.type,
        category: p.category,
        coverImg: p.images?.[0] ?? null,
        remainingWeight: p.remainingWeight,
        bumpedAt: p.bumpedAt,
      })),
      recentRecipes: recentRecipes.recipes,
      recentPosts: recentPosts.posts,
    };
  },

  // Lấy toàn bộ danh sách sản phẩm đăng bán của ngư dân theo ID người bán, có phân trang
  async getProducts(
    sellerId: string,
    pageStr?: string,
    limitStr?: string,
    includeExpired?: string,
  ) {
    // Kiểm tra định dạng ID người bán, ném lỗi 400 nếu sai
    if (!mongoose.Types.ObjectId.isValid(sellerId))
      throw new HttpError(400, "ID người bán không hợp lệ");
    // Phân tích thông tin phân trang với giới hạn tối đa 50 sản phẩm trên trang
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 50);
    // Tạo bộ lọc theo sellerId
    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    // Nếu không yêu cầu bao gồm hàng đã hết hạn thì chỉ lấy sản phẩm có trạng thái Active
    if (includeExpired !== "true") filter.status = "Active";
    // Đếm tổng số lượng sản phẩm thỏa mãn điều kiện
    const total = await productRepository.countDocuments(filter);
    // Tìm kiếm danh sách sản phẩm, sắp xếp theo thời điểm đẩy bài và thời gian tạo giảm dần
    const products = await productRepository.find(
      filter,
      {},
      { sort: { bumpedAt: -1, createdAt: -1 }, skip: offset, limit },
    );
    // Trả về danh sách và thông tin phân trang
    return { products, total, page, limit };
  },

  // Lấy toàn bộ danh sách công thức nấu ăn của ngư dân có phân trang
  async getRecipes(authorId: string, pageStr?: string, limitStr?: string) {
    // Kiểm tra định dạng ID tác giả, ném lỗi 400 nếu sai
    if (!mongoose.Types.ObjectId.isValid(authorId))
      throw new HttpError(400, "ID tác giả không hợp lệ");
    // Phân tích thông tin phân trang với giới hạn tối đa 20 công thức trên trang
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    // Gọi repository truy vấn danh sách công thức của tác giả này
    const { recipes, total } = await recipeRepository.findAll(
      { authorId: new Types.ObjectId(authorId) },
      offset,
      limit,
    );
    // Trả về danh sách và phân trang
    return { recipes, total, page, limit };
  },

  // Lấy toàn bộ danh sách bài viết diễn đàn của người dùng có phân trang
  async getPosts(userId: string, pageStr?: string, limitStr?: string) {
    // Kiểm tra định dạng ID người dùng, ném lỗi 400 nếu sai
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new HttpError(400, "ID người dùng không hợp lệ");
    // Phân tích phân trang
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    // Gọi repository truy vấn danh sách bài viết diễn đàn
    const { posts, total } = await postRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      offset,
      limit,
    );
    // Trả về danh sách và phân trang
    return { posts, total, page, limit };
  },

  // Lấy toàn bộ danh sách nhật ký cabin của người dùng có phân trang
  async getBoatLogs(userId: string, pageStr?: string, limitStr?: string) {
    // Kiểm tra định dạng ID người dùng, ném lỗi 400 nếu sai
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new HttpError(400, "ID người dùng không hợp lệ");
    // Phân tích phân trang
    const { page, limit, offset } = parsePagination(pageStr, limitStr, 20);
    // Gọi repository truy vấn danh sách nhật ký cabin
    const { boatLogs, total } = await boatLogRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      offset,
      limit,
    );
    // Trả về danh sách và phân trang
    return { boatLogs, total, page, limit };
  },
};
