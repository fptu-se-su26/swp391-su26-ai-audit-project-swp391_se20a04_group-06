"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAccountUseCase = void 0;
// Import thư viện Mongoose để quản lý phiên giao dịch (Session) và truy vấn
const mongoose_1 = __importDefault(require("mongoose"));
// Import ngoại lệ NotFoundError dùng khi không tìm thấy tài nguyên người dùng
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import đối tượng kết nối Redis
const redis_1 = require("../../../../config/redis");
// Import SDK Cloudinary để thực thi xóa ảnh hàng loạt lưu trên đám mây
const cloudinary_1 = require("../../../../config/cloudinary");
// Import công cụ ghi log hệ thống
const logger_1 = require("../../../../utils/logger");
// Import hàm helper trích xuất mã định danh ảnh (Public ID) từ URL Cloudinary
const cloudinary_2 = require("../../../../utils/cloudinary");
// Import các Mongoose Model cũ để thực hiện thao tác xóa quan hệ đa bảng (Cascade Delete) khi xóa tài khoản
const User_1 = require("../../../../models/User");
const Product_1 = require("../../../../models/Product");
const Review_1 = require("../../../../models/Review");
const Message_1 = require("../../../../models/Message");
const Report_1 = require("../../../../models/Report");
const Notification_1 = require("../../../../models/Notification");
const Post_1 = require("../../../../models/Post");
const Recipe_1 = require("../../../../models/Recipe");
const BoatLog_1 = require("../../../../models/BoatLog");
const OmakaseSubscription_1 = require("../../../../models/OmakaseSubscription");
const PaymentTransaction_1 = require("../../../../models/PaymentTransaction");
/**
 * USE CASE: XÓA TÀI KHOẢN NGƯỜI DÙNG (GDPR COMPLIANCE / ACCOUNT DELETION)
 * Đảm bảo xóa sạch toàn bộ thông tin cá nhân và dữ liệu liên quan để tuân thủ quyền riêng tư người dùng
 */
class DeleteAccountUseCase {
    // Tiêm (Inject) Repository của User qua hàm khởi tạo
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * THỰC THI NGHIỆP VỤ XÓA TÀI KHOẢN
     */
    async execute(userId) {
        // Tìm kiếm thông tin người dùng từ Repository
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        // Khởi tạo phiên giao dịch Mongoose (Session) nhằm đảm bảo tính ACID khi cập nhật đa bảng
        const session = await mongoose_1.default.startSession();
        let dbOptions = {};
        let keysToDelete = []; // Mảng lưu trữ các key refresh token của người dùng trên Redis để xóa
        let allPublicIds = []; // Mảng lưu các publicId ảnh sản phẩm cần xóa trên Cloudinary
        let productIds = []; // Mảng lưu các ID sản phẩm do người dùng này đăng bán
        try {
            // Bắt đầu một Transaction nếu MongoDB hỗ trợ (yêu cầu Replica Set)
            session.startTransaction();
            dbOptions = { session };
        }
        catch (err) {
            // Kết thúc phiên giao dịch ngay nếu không bắt đầu được
            session.endSession();
            // Nếu MongoDB chạy ở chế độ Standalone (local dev) không hỗ trợ Replica Set, bỏ qua báo lỗi và chạy non-transactional
            if (err.message && err.message.includes("replica set")) {
                logger_1.logger.warn("MongoDB Standalone detected. Bỏ qua Transaction ACID.");
            }
            else {
                throw err;
            }
        }
        try {
            // 1. QUÉT TÌM CÁC REFRESH TOKEN HOẠT ĐỘNG CỦA NGƯỜI DÙNG TRÊN REDIS
            // Sử dụng lệnh SCAN có con trỏ (cursor) để duyệt qua các key theo pattern không gây nghẽn RAM Redis (hơn lệnh KEYS)
            let cursor = "0";
            do {
                const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${userId}:*`, "COUNT", 100);
                cursor = reply[0]; // Cập nhật con trỏ mới từ phản hồi của Redis
                keysToDelete.push(...reply[1]); // Đẩy các key tìm thấy vào mảng chờ xóa
            } while (cursor !== "0"); // Tiếp tục lặp đến khi con trỏ quay về "0" (hoàn tất quét)
            // 2. TÌM TẤT CẢ SẢN PHẨM MÀ NGƯỜI DÙNG NÀY ĐĂNG BÁN
            const products = await Product_1.Product.find({ sellerId: userId }, null, dbOptions);
            // Trích xuất Public ID ảnh sản phẩm trên Cloudinary để chuẩn bị xóa ảnh trên mây
            allPublicIds = products
                .flatMap((p) => (p.images || []).map(cloudinary_2.extractPublicId))
                .filter((id) => !!id);
            // Gom lại danh sách ID sản phẩm do người dùng này sở hữu
            productIds = products.map((p) => p._id);
            // 3. XÓA SẠCH QUAN HỆ THEO DÕI (FOLLOWERS & FOLLOWING) VÀ THẢ TIM SẢN PHẨM
            // Tìm tất cả các người dùng khác và loại bỏ ID của tài khoản bị xóa khỏi danh sách theo dõi 'following' của họ
            await User_1.User.updateMany({}, { $pull: { following: userId } }, dbOptions);
            // Nếu người dùng này có đăng sản phẩm bán
            if (productIds.length > 0) {
                // Loại bỏ ID sản phẩm của người dùng này khỏi danh sách yêu thích 'favorites' của toàn bộ người dùng khác
                await User_1.User.updateMany({}, { $pull: { favorites: { $in: productIds } } }, dbOptions);
                // Xóa tất cả các đánh giá (Reviews) liên quan đến các sản phẩm của người dùng này
                await Review_1.Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa tất cả tin nhắn chat (Messages) liên quan đến các sản phẩm này
                await Message_1.Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa toàn bộ các báo cáo vi phạm (Reports) liên quan đến các sản phẩm này
                await Report_1.Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa toàn bộ thông báo (Notifications) liên kết với các sản phẩm này
                await Notification_1.Notification.deleteMany({ productId: { $in: productIds } }, dbOptions);
            }
            // Xóa tất cả các sản phẩm do người dùng này đăng bán
            await Product_1.Product.deleteMany({ sellerId: userId }, dbOptions);
            // Xóa các đánh giá do người dùng này viết hoặc được người dùng khác viết cho người dùng này
            await Review_1.Review.deleteMany({ $or: [{ reviewerId: userId }, { sellerId: userId }] }, dbOptions);
            // Xóa các tin nhắn do người dùng này gửi hoặc nhận
            await Message_1.Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }, dbOptions);
            // Xóa các báo cáo vi phạm do người này gửi
            await Report_1.Report.deleteMany({ reporterId: userId }, dbOptions);
            // Xóa các thông báo gửi đến tài khoản người dùng này
            await Notification_1.Notification.deleteMany({ userId: userId }, dbOptions);
            // Xóa các bài viết diễn đàn của người này
            await Post_1.Post.deleteMany({ userId: userId }, dbOptions);
            // Xóa các công thức chế biến do người này đăng
            await Recipe_1.Recipe.deleteMany({ authorId: userId }, dbOptions);
            // Xóa nhật ký đi biển của người này
            await BoatLog_1.BoatLog.deleteMany({ userId: userId }, dbOptions);
            // Xóa đăng ký Omakase và lịch sử thanh toán Premium gắn với tài khoản.
            await OmakaseSubscription_1.OmakaseSubscription.deleteMany({ userId: userId }, dbOptions);
            await PaymentTransaction_1.PaymentTransaction.deleteMany({ userId: userId }, dbOptions);
            // Loại bỏ lượt thích (Likes) của người này khỏi tất cả các bài viết và công thức khác
            await Post_1.Post.updateMany({}, { $pull: { likes: userId } }, dbOptions);
            await Recipe_1.Recipe.updateMany({}, { $pull: { likes: userId } }, dbOptions);
            // Xóa bỏ tất cả các bình luận (Comments) của người này ở toàn bộ các bài viết diễn đàn khác
            await Post_1.Post.updateMany({}, { $pull: { comments: { userId: userId } } }, dbOptions);
            // 4. XÓA BẢN GHI THÔNG TIN NGƯỜI DÙNG Ở BẢNG USERS (AGGREGATE ROOT)
            await this.userRepository.delete(user);
            // Nếu có dùng phiên giao dịch, thực thi Commit lưu vĩnh viễn các thay đổi vào DB
            if (dbOptions.session)
                await session.commitTransaction();
            logger_1.logger.info(`GDPR SUCCESS: DB Deletion successfully finalized for UserID=${userId}`);
        }
        catch (err) {
            // Nếu có lỗi xảy ra, thực hiện Rollback hoàn tác toàn bộ thao tác trong Transaction để tránh dữ liệu bị mâu thuẫn (mất đồng bộ)
            if (dbOptions.session)
                await session.abortTransaction();
            logger_1.logger.error(`GDPR FAILED: DB Rollback initiated. Error for UserID=${userId}: ${err.message}`);
            throw err;
        }
        finally {
            // Đóng phiên làm việc Mongoose
            session.endSession();
        }
        // 5. DỌN DẸP HẠ TẦNG NGOÀI DATABASE (REDIS & CLOUDINARY) - Thực hiện sau khi DB đã xử lý thành công
        // Xóa các key Refresh Token trên Redis để ép buộc tài khoản bị đăng xuất ngay lập tức
        if (keysToDelete.length > 0) {
            await redis_1.redis
                .del(...keysToDelete)
                .catch((e) => logger_1.logger.error(`Redis key deletion failed: ${e.message}`));
        }
        // Xóa tất cả các hình ảnh sản phẩm đã tải lên cổng lưu trữ đám mây Cloudinary
        if (allPublicIds.length > 0) {
            const BATCH_SIZE = 100; // Cloudinary giới hạn xóa tối đa 100 ảnh mỗi lần gọi API
            for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
                const batch = allPublicIds.slice(i, i + BATCH_SIZE);
                await cloudinary_1.cloudinary.api.delete_resources(batch).catch((err) => {
                    logger_1.logger.error(`GDPR: Cloudinary bulk delete failed: ${err.message}`);
                });
            }
        }
        // Dọn dẹp cache chi tiết sản phẩm trên Redis và tăng phiên bản danh sách sản phẩm để Client cập nhật dữ liệu mới
        if (productIds.length > 0) {
            const pipe = redis_1.redis.pipeline(); // Sử dụng pipeline để gộp nhiều lệnh gửi lên Redis một lúc, tối ưu hiệu năng mạng
            productIds.forEach((id) => pipe.del(`product:detail:${id.toString()}`));
            pipe.incr("product:list:version:Fresh");
            pipe.incr("product:list:version:Dried");
            await pipe
                .exec()
                .catch((e) => logger_1.logger.error(`Redis cache clear failed: ${e.message}`));
        }
    }
}
exports.DeleteAccountUseCase = DeleteAccountUseCase;
