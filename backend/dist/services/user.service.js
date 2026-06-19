"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
// Import đối tượng userRepository phục vụ các thao tác trực tiếp với cơ sở dữ liệu bảng users
const user_repository_1 = require("../repositories/user.repository");
// Import đối tượng reviewRepository để tính toán số điểm đánh giá trung bình của người bán
const review_repository_1 = require("../repositories/review.repository");
// Import đối tượng productRepository để lấy thông tin sản phẩm và đếm số bài viết mẻ hàng
const product_repository_1 = require("../repositories/product.repository");
// Import lớp lỗi HttpError dùng để ném ra các lỗi kèm theo mã HTTP phù hợp
const HttpError_1 = require("../errors/HttpError");
// Xuất ra đối tượng userService chứa các logic nghiệp vụ liên quan đến tài khoản người dùng
exports.userService = {
    // Nghiệp vụ lấy thông tin hồ sơ công khai của một người dùng dựa theo ID tài khoản
    async getPublicProfile(id) {
        // Truy cập cơ sở dữ liệu thô để tìm thông tin tài khoản người dùng theo ID
        const user = await user_repository_1.userRepository.findRawById(id);
        // Nếu người dùng không tồn tại hoặc tài khoản đang ở trạng thái bị khóa (isActive = false)
        if (!user || !user.isActive) {
            // Ném lỗi 404 Not Found biểu thị tài khoản không khả dụng công khai
            throw new HttpError_1.HttpError(404, "Không tìm thấy người dùng");
        }
        // Đọc trực tiếp danh sách danh hiệu/huy hiệu (badges) được lưu từ Database thay vì quét tính toán lại mỗi lần tải trang để tối ưu hiệu năng
        const badges = user.badges || [];
        // Tổng hợp dữ liệu đánh giá: tính điểm đánh giá trung bình và đếm số lượng nhận xét của người bán này
        const reviewStats = await review_repository_1.reviewRepository.aggregate([
            // Chỉ lọc những bản ghi đánh giá dành riêng cho người bán hiện tại
            { $match: { sellerId: user._id } },
            // Nhóm tất cả lại để tính toán thống kê
            {
                $group: {
                    // Nhóm chung một nhóm
                    _id: null,
                    // Tính điểm trung bình của trường rating
                    avgRating: { $avg: "$rating" },
                    // Đếm tổng số lượng bản ghi đánh giá
                    totalReviews: { $sum: 1 },
                },
            },
        ]);
        // Chuẩn hóa điểm đánh giá trung bình: Làm tròn đến một chữ số thập phân, mặc định là 0 nếu không có đánh giá
        const avgRating = reviewStats[0]?.avgRating
            ? Math.round(reviewStats[0].avgRating * 10) / 10
            : 0;
        // Tổng số lượng đánh giá nhận được, mặc định là 0
        const ratingCount = reviewStats[0]?.totalReviews || 0;
        // Trả về đối tượng hồ sơ công khai đã chuẩn hóa thông tin chi tiết
        return {
            // ID người dùng dạng chuỗi
            id: user._id.toString(),
            // Tên hiển thị người dùng
            name: user.name,
            // Địa chỉ email của người dùng
            email: user.email,
            // Ảnh đại diện avatar hoặc null nếu chưa cập nhật
            avatar: user.avatar || null,
            // Cờ biểu thị trạng thái đã xác minh danh tính (tích xanh)
            isVerified: !!user.isVerified,
            // Cờ biểu thị trạng thái tài khoản Premium
            isPremium: !!user.isPremium,
            // Thời điểm tạo tài khoản
            createdAt: user.createdAt,
            // Điểm đánh giá trung bình
            avgRating,
            // Tổng số lượng nhận xét đã nhận
            ratingCount,
            // Mảng danh sách huy hiệu
            badges,
        };
    },
    // Nghiệp vụ lấy bảng xếp hạng top 5 ngư dân hoạt động nổi bật nhất dựa trên điểm số đánh giá và sản lượng mẻ hàng
    async getFishermanLeaderboard() {
        // Trích xuất danh sách duy nhất các ID người bán có sản phẩm mẻ hàng đang ở trạng thái hoạt động (Active)
        const sellerIds = await product_repository_1.productRepository.distinct("sellerId", {
            // Lọc trạng thái mẻ hàng đang rao bán
            status: "Active",
        });
        // Nếu không có bất kỳ người bán nào có mẻ hàng hoạt động
        if (!sellerIds || sellerIds.length === 0) {
            // Trả về ngay mảng rỗng để tiết kiệm các truy vấn cơ sở dữ liệu tiếp theo
            return [];
        }
        // Truy vấn thông tin của tất cả những người bán này đang có trạng thái tài khoản hoạt động bình thường
        const sellers = await user_repository_1.userRepository.find({
            // Lọc danh sách ID khớp với danh sách người bán
            _id: { $in: sellerIds },
            // Tài khoản đang hoạt động
            isActive: true,
        });
        // Thực hiện tổng hợp dữ liệu đánh giá của toàn bộ danh sách người bán để tránh lỗi truy vấn lặp N+1
        const reviewStats = await review_repository_1.reviewRepository.aggregate([
            // Lọc các đánh giá có ID người bán nằm trong danh sách đang xét
            { $match: { sellerId: { $in: sellerIds } } },
            // Nhóm theo từng sellerId để thống kê điểm đánh giá trung bình và số lượng nhận xét
            {
                $group: {
                    // Nhóm theo sellerId
                    _id: "$sellerId",
                    // Tính điểm số rating trung bình
                    avgRating: { $avg: "$rating" },
                    // Đếm tổng số lượng đánh giá của mỗi seller
                    totalReviews: { $sum: 1 },
                },
            },
        ]);
        // Khởi tạo một đối tượng Map ánh xạ từ ID người bán sang thông tin đánh giá để tra cứu nhanh với độ phức tạp O(1)
        const reviewMap = new Map();
        // Lặp qua danh sách thống kê để đưa dữ liệu vào Map tra cứu
        for (const stat of reviewStats) {
            // Nếu có thông tin ID người bán hợp lệ
            if (stat._id) {
                // Tính điểm đánh giá trung bình và làm tròn tới 1 chữ số thập phân
                const avg = stat.avgRating ? Math.round(stat.avgRating * 10) / 10 : 0;
                // Gán dữ liệu vào Map bằng khóa là ID người bán chuyển sang chuỗi
                reviewMap.set(stat._id.toString(), {
                    // Điểm trung bình làm tròn
                    avgRating: avg,
                    // Tổng số lượt nhận xét
                    ratingCount: stat.totalReviews || 0,
                });
            }
        }
        // Thực hiện tổng hợp đếm số lượng bài đăng sản phẩm đang bán (Active) của từng người bán
        const productStats = await product_repository_1.productRepository.aggregate([
            // Lọc sản phẩm thuộc danh sách người bán và có trạng thái hoạt động
            { $match: { sellerId: { $in: sellerIds }, status: "Active" } },
            // Nhóm theo sellerId và đếm số lượng bài viết của từng seller
            {
                $group: {
                    // Nhóm theo sellerId
                    _id: "$sellerId",
                    // Tính tổng số lượng
                    count: { $sum: 1 },
                },
            },
        ]);
        // Khởi tạo một đối tượng Map ánh xạ từ ID người bán sang số lượng bài đăng sản phẩm để tra cứu nhanh O(1)
        const productCountMap = new Map();
        // Lặp qua danh sách thống kê sản phẩm để đưa dữ liệu vào Map tra cứu
        for (const stat of productStats) {
            // Nếu có ID người bán hợp lệ
            if (stat._id) {
                // Gán số lượng bài viết tương ứng vào Map
                productCountMap.set(stat._id.toString(), stat.count || 0);
            }
        }
        // Ánh xạ danh sách người bán để xây dựng dữ liệu bảng xếp hạng hoàn chỉnh
        const leaderboard = sellers.map((user) => {
            // Chuyển đổi ID người dùng sang chuỗi
            const sellerIdStr = user._id.toString();
            // Tra cứu thông tin đánh giá từ Map, mặc định điểm là 0 và lượt đánh giá là 0 nếu không tìm thấy
            const reviews = reviewMap.get(sellerIdStr) || {
                avgRating: 0,
                ratingCount: 0,
            };
            // Tra cứu số lượng sản phẩm mẻ hàng đang bán từ Map, mặc định là 0 nếu không có
            const productCount = productCountMap.get(sellerIdStr) || 0;
            // Trả về cấu trúc thông tin ngư dân xếp hạng đã chuẩn hóa
            return {
                // ID tài khoản
                id: sellerIdStr,
                // Tên ngư dân
                name: user.name,
                // Ảnh đại diện hoặc null
                avatar: user.avatar || null,
                // Trạng thái đã xác minh danh tính
                isVerified: !!user.isVerified,
                // Trạng thái tài khoản Premium
                isPremium: !!user.isPremium,
                // Mảng các danh hiệu huy hiệu
                badges: user.badges || [],
                // Điểm đánh giá trung bình
                avgRating: reviews.avgRating,
                // Số lượng lượt đánh giá
                ratingCount: reviews.ratingCount,
                // Số lượng sản phẩm mẻ hàng đang hoạt động
                productCount,
            };
        });
        // Trả về danh sách bảng xếp hạng được sắp xếp theo độ ưu tiên và cắt lấy top 5 dòng
        return leaderboard
            .sort((a, b) => {
            // Độ ưu tiên 1: Sắp xếp giảm dần theo điểm số đánh giá trung bình (avgRating)
            if (b.avgRating !== a.avgRating)
                return b.avgRating - a.avgRating;
            // Độ ưu tiên 2: Nếu điểm đánh giá bằng nhau, sắp xếp giảm dần theo số lượng mẻ hàng đang bán (productCount)
            if (b.productCount !== a.productCount)
                return b.productCount - a.productCount;
            // Độ ưu tiên 3: Nếu vẫn bằng nhau, sắp xếp giảm dần theo tổng số lượt nhận xét (ratingCount)
            return b.ratingCount - a.ratingCount;
        })
            // Cắt mảng lấy 5 phần tử đầu tiên của bảng xếp hạng
            .slice(0, 5);
    },
};
