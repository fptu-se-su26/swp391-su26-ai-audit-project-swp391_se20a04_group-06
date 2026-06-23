"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
// Import đối tượng userRepository để tương tác dữ liệu tài khoản người dùng
const user_repository_1 = require("../repositories/user.repository");
// Import đối tượng productRepository để tương tác dữ liệu sản phẩm hải sản
const product_repository_1 = require("../repositories/product.repository");
// Import đối tượng reviewRepository để tương tác dữ liệu đánh giá cửa hàng
const review_repository_1 = require("../repositories/review.repository");
// Import đối tượng messageRepository để tương tác dữ liệu tin nhắn chat
const message_repository_1 = require("../repositories/message.repository");
// Import hàm fillDays từ thư mục utils để tự động điền các ngày còn thiếu trong biểu đồ thống kê
const fillDays_1 = require("../utils/fillDays");
// Import lớp lỗi HttpError phục vụ ném lỗi HTTP kèm mã trạng thái
const HttpError_1 = require("../errors/HttpError");
// Import productService để tái sử dụng nghiệp vụ xóa sản phẩm hải sản
const product_service_1 = require("./product.service");
// Thêm Model User phục vụ gom luồng giải quyết N+1 queries khi cần truy cập thông tin tài khoản trực tiếp
const User_1 = require("../models/User");
// Hàm xử lý an toàn hóa từ khóa Regex phòng chống tấn công từ chối dịch vụ ReDoS bằng cách thêm ký tự thoát hiểm \ trước ký tự đặc biệt
function escapeRegExp(string) {
    // Thay thế các ký tự đặc biệt của regex bằng phiên bản đã thoát hiểm
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
// Xuất đối tượng adminService chứa các nghiệp vụ quản trị cho trang dashboard của Admin
exports.adminService = {
    // Nghiệp vụ lấy toàn bộ số liệu thống kê cho trang Dashboard
    async getDashboardStats() {
        // Khởi tạo thời điểm hiện tại
        const sevenDaysAgo = new Date();
        // Thiết lập thời gian lùi lại 6 ngày trước (tổng cộng 7 ngày tính cả hôm nay)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        // Đặt mốc giờ về 0h0m0s0ms của ngày đó để lấy dữ liệu trọn vẹn từ đầu ngày
        sevenDaysAgo.setHours(0, 0, 0, 0);
        // Chạy song song hàng loạt truy vấn thống kê nâng cao để tối ưu hóa hiệu năng
        const [totalUsers, // Tổng số người dùng
        verifiedUsers, // Số người dùng đã xác minh
        activeFresh, // Số lượng sản phẩm tươi sống đang hoạt động
        activeDried, // Số lượng sản phẩm khô đang hoạt động
        expiredTotal, // Số lượng sản phẩm đã hết hạn
        reviewStats, // Thống kê trung bình đánh giá
        totalMessages, // Tổng số tin nhắn đã gửi
        followStats, // Tổng số lượt theo dõi lẫn nhau
        postsPerDayRaw, // Số lượng bài đăng sản phẩm thô theo ngày trong tuần qua
        usersPerDayRaw, // Số lượng tài khoản đăng ký mới thô theo ngày trong tuần qua
        topSellers, // Danh sách top 5 người bán có nhiều bài đăng nhất
        ] = (await Promise.all([
            // Đếm tổng số lượng người dùng có vai trò khác Admin
            user_repository_1.userRepository.countDocuments({ role: { $ne: "Admin" } }),
            // Đếm số lượng người dùng đã xác minh và không phải là Admin
            user_repository_1.userRepository.countDocuments({
                isVerified: true,
                role: { $ne: "Admin" },
            }),
            // Đếm số lượng sản phẩm có trạng thái Active và loại là Fresh (tươi sống)
            product_repository_1.productRepository.countDocuments({ status: "Active", type: "Fresh" }),
            // Đếm số lượng sản phẩm có trạng thái Active và loại là Dried (khô)
            product_repository_1.productRepository.countDocuments({ status: "Active", type: "Dried" }),
            // Đếm số lượng sản phẩm có trạng thái Expired (hết hạn)
            product_repository_1.productRepository.countDocuments({ status: "Expired" }),
            // Tổng hợp dữ liệu đánh giá: đếm tổng số review và tính điểm đánh giá trung bình
            review_repository_1.reviewRepository.aggregate([
                {
                    $group: {
                        _id: null, // Nhóm tất cả các tài liệu lại với nhau
                        totalReviews: { $sum: 1 }, // Đếm tổng số lượng bản ghi đánh giá
                        avgRating: { $avg: "$rating" }, // Tính điểm trung bình của trường rating
                    },
                },
            ]),
            // Đếm tổng số lượng tài liệu tin nhắn chat trong cơ sở dữ liệu
            message_repository_1.messageRepository.countDocuments({}),
            // Tổng hợp dữ liệu theo dõi: đếm tổng số mối quan hệ theo dõi bằng cách lấy kích thước mảng following
            user_repository_1.userRepository.aggregate([
                {
                    $project: {
                        followingCount: {
                            $cond: {
                                if: { $isArray: "$following" }, // Nếu trường following là mảng
                                then: { $size: "$following" }, // Thì lấy độ dài mảng
                                else: 0, // Ngược lại trả về 0
                            },
                        },
                    },
                },
                // Nhóm tất cả lại để tính tổng số lượt theo dõi (totalFollows)
                { $group: { _id: null, totalFollows: { $sum: "$followingCount" } } },
            ]),
            // Tổng hợp số sản phẩm đăng tải theo ngày trong vòng 7 ngày qua
            product_repository_1.productRepository.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } }, // Chỉ lấy sản phẩm tạo trong 7 ngày qua
                {
                    $group: {
                        // Nhóm theo định dạng chuỗi ngày YYYY-MM-DD
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }, // Tính tổng số bài đăng mỗi ngày
                    },
                },
                { $sort: { _id: 1 } }, // Sắp xếp tăng dần theo chuỗi ngày
            ]),
            // Tổng hợp số lượng tài khoản đăng ký mới theo ngày trong vòng 7 ngày qua (loại trừ Admin)
            user_repository_1.userRepository.aggregate([
                {
                    $match: { createdAt: { $gte: sevenDaysAgo }, role: { $ne: "Admin" } }, // Lọc thời gian và vai trò
                },
                {
                    $group: {
                        // Nhóm theo chuỗi ngày YYYY-MM-DD
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }, // Tính tổng số người dùng đăng ký mỗi ngày
                    },
                },
                { $sort: { _id: 1 } }, // Sắp xếp tăng dần theo chuỗi ngày
            ]),
            // Tổng hợp top 5 người bán hàng tích cực nhất dựa theo số lượng bài đăng sản phẩm
            product_repository_1.productRepository.aggregate([
                { $match: { status: { $ne: "Deleted" } } }, // Loại bỏ các sản phẩm đã xóa
                { $group: { _id: "$sellerId", postCount: { $sum: 1 } } }, // Nhóm theo sellerId và đếm số bài đăng
                { $sort: { postCount: -1 } }, // Sắp xếp giảm dần theo số lượng bài đăng
                { $limit: 5 }, // Lấy 5 dòng đầu tiên
                {
                    $lookup: {
                        from: "users", // Thực hiện liên kết lookup với bảng users
                        localField: "_id", // Trường liên kết tại bảng sản phẩm nhóm là _id (chính là sellerId)
                        foreignField: "_id", // Trường liên kết tại bảng users là _id
                        as: "user", // Kết quả đặt vào trường user
                    },
                },
                { $unwind: "$user" }, // Trải phẳng mảng user liên kết được sang đối tượng đơn lẻ
                {
                    $lookup: {
                        from: "reviews", // Thực hiện liên kết lookup tiếp với bảng reviews để lấy điểm đánh giá của người bán này
                        localField: "_id", // Trường localField chính là sellerId
                        foreignField: "sellerId", // Trường liên kết tại bảng reviews là sellerId
                        as: "reviewsList", // Kết quả đặt vào mảng reviewsList
                    },
                },
                {
                    $project: {
                        id: "$_id", // Trả về ID người bán
                        name: "$user.name", // Tên người bán
                        isVerified: { $cond: ["$user.isVerified", 1, 0] }, // Trả về 1 nếu đã xác minh, ngược lại 0
                        postCount: 1, // Trữ nguyên số lượng bài đăng
                        avgRating: { $ifNull: [{ $avg: "$reviewsList.rating" }, 0] }, // Tính điểm trung bình đánh giá từ reviewsList, nếu rỗng thì trả về 0
                    },
                },
            ]),
        ]));
        // Chuẩn hóa định dạng mảng dữ liệu bài đăng theo ngày
        const formattedPostsPerDay = postsPerDayRaw.map((p) => ({
            date: p._id, // Ngày
            count: p.count, // Số lượng
        }));
        // Chuẩn hóa định dạng mảng dữ liệu đăng ký người dùng theo ngày
        const formattedUsersPerDay = usersPerDayRaw.map((u) => ({
            date: u._id, // Ngày
            count: u.count, // Số lượng
        }));
        // Trả về đối tượng thống kê đầy đủ, sử dụng hàm fillDays để bù đắp các ngày không có dữ liệu bằng giá trị count = 0
        return {
            totalUsers, // Tổng số người dùng
            verifiedUsers, // Tổng số người dùng đã xác minh
            activeFresh, // Tổng số hải sản tươi đang bán
            activeDried, // Tổng số hải sản khô đang bán
            expiredTotal, // Tổng số tin đăng hết hạn
            totalReviews: reviewStats[0]?.totalReviews || 0, // Tổng số lượt review trên toàn trang
            avgRating: reviewStats[0]?.avgRating
                ? Math.round(reviewStats[0].avgRating * 10) / 10 // Làm tròn điểm đánh giá đến 1 chữ số thập phân
                : 0,
            totalMessages, // Tổng số tin nhắn đã gửi trong hệ thống
            totalFollows: followStats[0]?.totalFollows || 0, // Tổng số lượt follow tích lũy
            postsPerDay: (0, fillDays_1.fillDays)(formattedPostsPerDay), // Biểu đồ bài đăng 7 ngày qua đã bù đắp ngày trống
            usersPerDay: (0, fillDays_1.fillDays)(formattedUsersPerDay), // Biểu đồ đăng ký mới 7 ngày qua đã bù đắp ngày trống
            topSellers, // Danh sách top 5 người bán hàng tích cực nhất
        };
    },
    // Nghiệp vụ lấy danh sách người dùng dành cho quản trị viên, có bộ lọc tìm kiếm và phân trang
    async listUsers(search, offset, limit) {
        // Khởi tạo bộ lọc tìm kiếm rỗng
        const filter = {};
        // Nếu có từ khóa tìm kiếm được truyền lên
        if (search) {
            // KHẮC PHỤC LỖI REDOS: Khử độc hại từ khóa tìm kiếm regex đầu vào trước khi đưa vào truy vấn
            const safeSearch = escapeRegExp(search);
            // Áp dụng bộ lọc tìm kiếm không phân biệt chữ hoa chữ thường theo tên hoặc email
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } },
            ];
        }
        // Lấy tổng số lượng người dùng khớp bộ lọc để phục vụ phân trang ở giao diện
        const total = await user_repository_1.userRepository.countDocuments(filter);
        // Truy vấn danh sách người dùng khớp bộ lọc, sắp xếp thời gian tạo mới nhất lên đầu, phân trang bằng skip/limit
        const users = await user_repository_1.userRepository.find(filter, { createdAt: -1 }, offset, limit);
        // Trích xuất mảng ID người dùng để thống kê số lượng bài đăng hải sản tương ứng
        const userIds = users.map((u) => u._id);
        // Tổng hợp đếm số lượng tin đăng của các người dùng này để tránh N+1 truy vấn DB
        const postCountAgg = await product_repository_1.productRepository.aggregate([
            { $match: { sellerId: { $in: userIds } } }, // Lọc các sản phẩm thuộc danh sách người dùng hiện tại
            { $group: { _id: "$sellerId", count: { $sum: 1 } } }, // Nhóm theo sellerId và đếm tổng số
        ]);
        // Ánh xạ danh sách thống kê vào một Map để tra cứu nhanh bằng ID người dùng
        const postCountMap = new Map(postCountAgg.map((p) => [p._id.toString(), p.count]));
        // Định dạng dữ liệu người dùng trả về để đồng bộ hóa cấu trúc API cũ của trang admin
        const formattedRows = users.map((u) => ({
            id: u._id.toString(), // Ép kiểu ID sang dạng chuỗi
            name: u.name, // Tên hiển thị
            email: u.email, // Email
            role: u.role, // Vai trò
            isActive: u.isActive ? 1 : 0, // Trả về số 1 nếu đang hoạt động, ngược lại 0
            isVerified: u.isVerified ? 1 : 0, // Trả về số 1 nếu đã xác minh, ngược lại 0
            postCount: postCountMap.get(u._id.toString()) || 0, // Lấy số lượng bài đăng từ Map tra cứu, mặc định là 0
        }));
        // Trả về danh sách người dùng đã chuẩn hóa và tổng số lượng bản ghi
        return { formattedRows, total };
    },
    // Nghiệp vụ khóa/mở khóa tài khoản của người dùng
    async toggleUserActive(userId) {
        // Tìm tài liệu người dùng thô trong database theo ID
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tồn tại người dùng tương ứng, ném lỗi 404
        if (!user)
            throw new HttpError_1.HttpError(404, "Không tìm thấy người dùng");
        // Đảo ngược trạng thái hoạt động hiện tại (isActive) và gọi hàm cập nhật
        const updated = await user_repository_1.userRepository.updateActiveStatus(userId, !user.isActive);
        // Trả về trạng thái hoạt động mới sau khi cập nhật thành công
        return updated?.isActive;
    },
    // Nghiệp vụ bật/tắt trạng thái xác minh (tích xanh) của người dùng
    async toggleUserVerification(userId) {
        // Tìm tài liệu người dùng thô trong database theo ID
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tồn tại người dùng tương ứng, ném lỗi 404
        if (!user)
            throw new HttpError_1.HttpError(404, "Không tìm thấy người dùng");
        // Đảo ngược trạng thái xác minh hiện tại (isVerified) và gọi hàm cập nhật
        const updated = await user_repository_1.userRepository.updateVerificationStatus(userId, !user.isVerified);
        // Trả về trạng thái xác minh mới sau khi cập nhật thành công
        return updated?.isVerified;
    },
    // Nghiệp vụ lấy danh sách toàn bộ sản phẩm trên hệ thống cho Admin quản lý
    async listAllProducts(search, status, offset, limit) {
        // Khởi tạo bộ lọc tìm kiếm sản phẩm
        const filter = {};
        // Nếu lọc theo trạng thái sản phẩm cụ thể
        if (status) {
            filter.status = status;
        }
        // Nếu có từ khóa tìm kiếm
        if (search) {
            // KHẮC PHỤC LỖI REDOS: Khử độc hại từ khóa tìm kiếm regex đầu vào để tránh treo hệ thống
            const safeSearch = escapeRegExp(search);
            // Tìm kiếm tối đa 100 người dùng có tên khớp từ khóa tìm kiếm để lọc sản phẩm theo tên người bán
            const matchingUsers = await user_repository_1.userRepository.find({ name: { $regex: safeSearch, $options: "i" } }, {}, 0, 100);
            // Trích xuất danh sách ID người dùng tìm thấy
            const userIds = matchingUsers.map((u) => u._id);
            // Áp dụng bộ lọc: Tên sản phẩm khớp từ khóa HOẶC sản phẩm thuộc danh sách người bán tìm thấy
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { sellerId: { $in: userIds } },
            ];
        }
        // Lấy tổng số sản phẩm khớp bộ lọc để phân trang
        const total = await product_repository_1.productRepository.countDocuments(filter);
        // Tìm danh sách sản phẩm khớp bộ lọc, sắp xếp theo thời gian đăng giảm dần, thực hiện phân trang
        const products = await product_repository_1.productRepository.find(filter, {}, {
            sort: { createdAt: -1 },
            skip: offset,
            limit: limit,
        });
        // KHẮC PHỤC LỖI N+1 QUERIES: Thu thập toàn bộ IDs người bán duy nhất và truy vấn thông tin người bán duy nhất một lần bằng $in
        const sellerIds = Array.from(new Set(products.map((p) => p.sellerId.toString())));
        // Lấy thông tin thô của người dùng ở database
        const sellers = await User_1.User.find({ _id: { $in: sellerIds } }).lean();
        // Tạo Map ánh xạ từ sellerId sang thông tin người bán để truy cập nhanh với độ phức tạp O(1)
        const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));
        // Định dạng dữ liệu sản phẩm trả về tương thích với API admin
        const rows = products.map((p) => {
            // Tra cứu thông tin người bán từ Map
            const seller = sellerMap.get(p.sellerId.toString());
            return {
                id: p._id.toString(), // ID sản phẩm
                name: p.name, // Tên sản phẩm
                type: p.type, // Loại sản phẩm (Fresh/Dried)
                status: p.status, // Trạng thái sản phẩm (Active/Expired/Deleted...)
                price: p.price, // Giá sản phẩm
                remainingWeight: p.remainingWeight, // Khối lượng còn lại
                createdAt: p.createdAt, // Thời gian tạo
                sellerName: seller?.name || "Một ngư dân", // Tên người bán (mặc định nếu bị xóa)
                sellerEmail: seller?.email || "", // Email người bán
                coverImg: p.images[0] || null, // Ảnh đại diện sản phẩm (ảnh đầu tiên)
            };
        });
        // Trả về danh sách đã được định dạng và tổng số lượng
        return { rows, total };
    },
    // Nghiệp vụ xóa bài viết sản phẩm từ phía quản trị viên
    async adminDeleteProduct(productId, adminId) {
        // Gọi trực tiếp hàm nghiệp vụ xóa của productService với vai trò là Admin để ghi đè kiểm tra quyền sở hữu
        await product_service_1.productService.delete(productId, adminId, "Admin");
    },
};
