// Import thư viện Mongoose để quản lý phiên giao dịch (Session) và truy vấn
import mongoose from "mongoose";
// Import giao diện Repository của User để giao tiếp DB theo chuẩn Clean Architecture
import { IUserRepository } from "../../domain/repositories/IUserRepository";
// Import ngoại lệ NotFoundError dùng khi không tìm thấy tài nguyên người dùng
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
// Import đối tượng kết nối Redis
import { redis } from "../../../../config/redis";
// Import SDK Cloudinary để thực thi xóa ảnh hàng loạt lưu trên đám mây
import { cloudinary } from "../../../../config/cloudinary";
// Import công cụ ghi log hệ thống
import { logger } from "../../../../utils/logger";
// Import hàm helper trích xuất mã định danh ảnh (Public ID) từ URL Cloudinary
import { extractPublicId } from "../../../../utils/cloudinary";

// Import các Mongoose Model cũ để thực hiện thao tác xóa quan hệ đa bảng (Cascade Delete) khi xóa tài khoản
import { User as MongooseUser } from "../../../../models/User";
import { Product } from "../../../../models/Product";
import { Review } from "../../../../models/Review";
import { Message } from "../../../../models/Message";
import { Report } from "../../../../models/Report";
import { Notification } from "../../../../models/Notification";
import { Post } from "../../../../models/Post";
import { Recipe } from "../../../../models/Recipe";
import { BoatLog } from "../../../../models/BoatLog";
import { PaymentTransaction } from "../../../../models/PaymentTransaction";
import { LandingBatch } from "../../../../models/LandingBatch";

/**
 * USE CASE: XÓA TÀI KHOẢN NGƯỜI DÙNG (GDPR COMPLIANCE / ACCOUNT DELETION)
 * Đảm bảo xóa sạch toàn bộ thông tin cá nhân và dữ liệu liên quan để tuân thủ quyền riêng tư người dùng
 */
export class DeleteAccountUseCase {
  // Tiêm (Inject) Repository của User qua hàm khởi tạo
  constructor(private userRepository: IUserRepository) {}

  /**
   * THỰC THI NGHIỆP VỤ XÓA TÀI KHOẢN
   */
  async execute(userId: string): Promise<void> {
    // Tìm kiếm thông tin người dùng từ Repository
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");

    // Khởi tạo phiên giao dịch Mongoose (Session) nhằm đảm bảo tính ACID khi cập nhật đa bảng
    const session = await mongoose.startSession();
    let dbOptions: any = {};

    let keysToDelete: string[] = [];  // Mảng lưu trữ các key refresh token của người dùng trên Redis để xóa
    let allPublicIds: string[] = [];  // Mảng lưu các publicId ảnh sản phẩm cần xóa trên Cloudinary
    let productIds: any[] = [];       // Mảng lưu các ID sản phẩm do người dùng này đăng bán

    try {
      // Bắt đầu một Transaction nếu MongoDB hỗ trợ (yêu cầu Replica Set)
      session.startTransaction();
      dbOptions = { session };
    } catch (err: any) {
      // Nếu MongoDB chạy ở chế độ Standalone (local dev) không hỗ trợ Replica Set, bỏ qua báo lỗi và chạy non-transactional
      if (err.message && err.message.includes("replica set")) {
        logger.warn("MongoDB Standalone detected. Bỏ qua Transaction ACID.");
      } else {
        throw err;
      }
    }

    try {
      // 1. QUÉT TÌM CÁC REFRESH TOKEN HOẠT ĐỘNG CỦA NGƯỜI DÙNG TRÊN REDIS
      // Sử dụng lệnh SCAN có con trỏ (cursor) để duyệt qua các key theo pattern không gây nghẽn RAM Redis (hơn lệnh KEYS)
      let cursor = "0";
      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${userId}:*`,
          "COUNT",
          100
        );
        cursor = reply[0];               // Cập nhật con trỏ mới từ phản hồi của Redis
        keysToDelete.push(...reply[1]);   // Đẩy các key tìm thấy vào mảng chờ xóa
      } while (cursor !== "0");          // Tiếp tục lặp đến khi con trỏ quay về "0" (hoàn tất quét)

      // 2. TÌM TẤT CẢ SẢN PHẨM MÀ NGƯỜI DÙNG NÀY ĐĂNG BÁN
      const products = await Product.find({ sellerId: userId }, null, dbOptions);
      // Trích xuất Public ID ảnh sản phẩm trên Cloudinary để chuẩn bị xóa ảnh trên mây
      allPublicIds = products
         .flatMap((p) => (p.images || []).map(extractPublicId))
         .filter((id): id is string => !!id);
      // Gom lại danh sách ID sản phẩm do người dùng này sở hữu
      productIds = products.map((p) => p._id);

      // Thu thập Public ID của Avatar cá nhân
      if (user.avatar) {
        const avatarId = extractPublicId(user.avatar);
        if (avatarId) allPublicIds.push(avatarId);
      }

      // Thu thập Public ID ảnh của các vựa cá sở hữu
      const batches = await LandingBatch.find({ sellerId: userId }, null, dbOptions);
      const batchPublicIds = batches
         .flatMap((b) => (b.images || []).map(extractPublicId))
         .filter((id): id is string => !!id);
      allPublicIds.push(...batchPublicIds);

      // Thu thập Public ID ảnh của các bài đăng cộng đồng
      const posts = await Post.find({ userId: userId }, null, dbOptions);
      const postPublicIds = posts
         .flatMap((p) => (p.images || []).map(extractPublicId))
         .filter((id): id is string => !!id);
      allPublicIds.push(...postPublicIds);

      // Thu thập Public ID ảnh của các công thức nấu ăn
      const recipes = await Recipe.find({ authorId: userId }, null, dbOptions);
      const recipePublicIds = recipes
         .map((r) => r.imageUrl ? extractPublicId(r.imageUrl) : null)
         .filter((id): id is string => !!id);
      allPublicIds.push(...recipePublicIds);

      // Thu thập Public ID ảnh của các nhật ký đi biển
      const boatLogs = await BoatLog.find({ userId: userId }, null, dbOptions);
      const boatLogPublicIds = boatLogs
         .flatMap((b) => (b.images || []).map(extractPublicId))
         .filter((id): id is string => !!id);
      allPublicIds.push(...boatLogPublicIds);

      // 3. XÓA SẠCH QUAN HỆ THEO DÕI (FOLLOWERS & FOLLOWING) VÀ THẢ TIM SẢN PHẨM
      // Tìm tất cả các người dùng khác và loại bỏ ID của tài khoản bị xóa khỏi danh sách theo dõi 'following' của họ
      await MongooseUser.updateMany(
        {},
        { $pull: { following: userId as any } },
        dbOptions
      );

      // Nếu người dùng này có đăng sản phẩm bán
      if (productIds.length > 0) {
        // Loại bỏ ID sản phẩm của người dùng này khỏi danh sách yêu thích 'favorites' của toàn bộ người dùng khác
        await MongooseUser.updateMany(
          {},
          { $pull: { favorites: { $in: productIds } as any } },
          dbOptions
        );
        // Xóa tất cả các đánh giá (Reviews) liên quan đến các sản phẩm của người dùng này
        await Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
        // Xóa tất cả tin nhắn chat (Messages) liên quan đến các sản phẩm này
        await Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
        // Xóa toàn bộ các báo cáo vi phạm (Reports) liên quan đến các sản phẩm này
        await Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
        // Xóa toàn bộ thông báo (Notifications) liên kết với các sản phẩm này
        await Notification.deleteMany({ productId: { $in: productIds } }, dbOptions);
      }

      // Xóa tất cả các sản phẩm do người dùng này đăng bán
      await Product.deleteMany({ sellerId: userId }, dbOptions);
      // Xóa các vựa cá do người dùng này sở hữu
      await LandingBatch.deleteMany({ sellerId: userId }, dbOptions);

      // Xóa các đánh giá do người dùng này viết hoặc được người dùng khác viết cho người dùng này
      await Review.deleteMany(
        { $or: [{ reviewerId: userId as any }, { sellerId: userId as any }] },
        dbOptions
      );
      // Xóa các tin nhắn do người dùng này gửi hoặc nhận
      await Message.deleteMany(
        { $or: [{ senderId: userId as any }, { receiverId: userId as any }] },
        dbOptions
      );
      // Xóa các báo cáo vi phạm do người này gửi
      await Report.deleteMany({ reporterId: userId }, dbOptions);
      // Xóa các thông báo gửi đến tài khoản người dùng này
      await Notification.deleteMany({ userId: userId }, dbOptions);
      // Xóa các bài viết diễn đàn của người này
      await Post.deleteMany({ userId: userId }, dbOptions);
      // Xóa các công thức chế biến do người này đăng
      await Recipe.deleteMany({ authorId: userId }, dbOptions);
      // Xóa nhật ký đi biển của người này
      await BoatLog.deleteMany({ userId: userId }, dbOptions);
      // Xóa lịch sử thanh toán Premium gắn với tài khoản.
      await PaymentTransaction.deleteMany({ userId: userId }, dbOptions);

      // Loại bỏ lượt thích (Likes) của người này khỏi tất cả các bài viết và công thức khác
      await Post.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
      await Recipe.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
      // Xóa bỏ tất cả các bình luận (Comments) của người này ở toàn bộ các bài viết diễn đàn khác
      await Post.updateMany(
        {},
        { $pull: { comments: { userId: userId as any } } },
        dbOptions
      );
      // Xóa bỏ tất cả các bình luận (Comments) của người này ở toàn bộ các công thức nấu ăn khác
      await Recipe.updateMany(
        {},
        { $pull: { comments: { userId: userId as any } } },
        dbOptions
      );

      // 4. XÓA BẢN GHI THÔNG TIN NGƯỜI DÙNG Ở BẢNG USERS (AGGREGATE ROOT)
      await this.userRepository.delete(user);

      // Nếu có dùng phiên giao dịch, thực thi Commit lưu vĩnh viễn các thay đổi vào DB
      if (dbOptions.session) await session.commitTransaction();
      logger.info(`GDPR SUCCESS: DB Deletion successfully finalized for UserID=${userId}`);
    } catch (err: any) {
      // Nếu có lỗi xảy ra, thực hiện Rollback hoàn tác toàn bộ thao tác trong Transaction để tránh dữ liệu bị mâu thuẫn (mất đồng bộ)
      if (dbOptions.session) await session.abortTransaction();
      logger.error(`GDPR FAILED: DB Rollback initiated. Error for UserID=${userId}: ${err.message}`);
      throw err;
    } finally {
      // Đóng phiên làm việc Mongoose
      session.endSession();
    }

    // 5. DỌN DẸP HẠ TẦNG NGOÀI DATABASE (REDIS & CLOUDINARY) - Thực hiện sau khi DB đã xử lý thành công
    // Xóa các key Refresh Token trên Redis để ép buộc tài khoản bị đăng xuất ngay lập tức
    if (keysToDelete.length > 0) {
      await redis
        .del(...keysToDelete)
        .catch((e) => logger.error(`Redis key deletion failed: ${e.message}`));
    }

    // Xóa tất cả các hình ảnh sản phẩm đã tải lên cổng lưu trữ đám mây Cloudinary
    if (allPublicIds.length > 0) {
      const BATCH_SIZE = 100; // Cloudinary giới hạn xóa tối đa 100 ảnh mỗi lần gọi API
      for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
        const batch = allPublicIds.slice(i, i + BATCH_SIZE);
        await cloudinary.api.delete_resources(batch).catch((err: any) => {
          logger.error(`GDPR: Cloudinary bulk delete failed: ${err.message}`);
        });
      }
    }

    // Dọn dẹp cache chi tiết sản phẩm trên Redis và tăng phiên bản danh sách sản phẩm để Client cập nhật dữ liệu mới
    if (productIds.length > 0) {
      const pipe = redis.pipeline(); // Sử dụng pipeline để gộp nhiều lệnh gửi lên Redis một lúc, tối ưu hiệu năng mạng
      productIds.forEach((id) => pipe.del(`product:detail:${id.toString()}`));
      pipe.incr("product:list:version:Fresh");
      pipe.incr("product:list:version:Dried");
      await pipe
        .exec()
        .catch((e) => logger.error(`Redis cache clear failed: ${e.message}`));
    }
  }
}
