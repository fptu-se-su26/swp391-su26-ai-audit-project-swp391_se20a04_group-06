"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
// Import thư viện bcrypt để mã hóa và đối chiếu mật khẩu băm bảo mật
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Import thư viện jsonwebtoken để tạo token JWT và đối tượng kiểu SignOptions
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Import thư viện mongoose để tương tác với các phiên làm việc Transaction của MongoDB
const mongoose_1 = __importDefault(require("mongoose"));
// Import userRepository để thực thi các tác vụ xử lý thông tin người dùng trong cơ sở dữ liệu
const user_repository_1 = require("../repositories/user.repository");
// Import postRepository để cập nhật thông tin bài viết đồng bộ khi người dùng đổi tên/avatar
const post_repository_1 = require("../repositories/post.repository");
// Import redis để làm sạch cache và quản lý refresh token
const redis_1 = require("../config/redis");
// Import cloudinary để thao tác với dịch vụ quản lý hình ảnh đám mây
const cloudinary_1 = require("../config/cloudinary");
// Import lớp lỗi HttpError để ném ra các ngoại lệ HTTP có kèm mã trạng thái phù hợp
const HttpError_1 = require("../errors/HttpError");
// Import hàm deleteFromCloudinary để xóa ảnh cũ trên Cloudinary
const upload_1 = require("../middlewares/upload");
// Import hàm extractPublicId để trích xuất ID ảnh của Cloudinary từ đường dẫn URL ảnh
const cloudinary_2 = require("../utils/cloudinary");
// Import đối tượng logger để ghi lại thông tin hoạt động hoặc lỗi của hệ thống
const logger_1 = require("../utils/logger");
// Import boatLogRepository để cập nhật thông tin nhật ký cabin đồng bộ khi đổi hồ sơ
const boatlog_repository_1 = require("../repositories/boatlog.repository");
// Import các mô hình Mongoose thô phục vụ tác vụ xóa tài khoản hoàn toàn (GDPR Compliance)
const User_1 = require("../models/User");
const Product_1 = require("../models/Product");
const Review_1 = require("../models/Review");
const Message_1 = require("../models/Message");
const Report_1 = require("../models/Report");
const Notification_1 = require("../models/Notification");
const Post_1 = require("../models/Post");
const Recipe_1 = require("../models/Recipe");
const BoatLog_1 = require("../models/BoatLog");
// Xuất đối tượng authService chứa các dịch vụ logic nghiệp vụ xác thực người dùng
exports.authService = {
    // Nghiệp vụ đăng ký tài khoản người dùng mới
    async register(name, email, password) {
        // Chuẩn hóa địa chỉ email bằng cách chuyển về chữ thường và cắt bỏ khoảng trắng thừa hai đầu
        const cleanEmail = email.toLowerCase().trim();
        // Tìm kiếm xem email này đã tồn tại trong hệ thống từ trước chưa
        const existing = await user_repository_1.userRepository.findByEmail(cleanEmail);
        // Nếu email đã được đăng ký thì ném lỗi xung đột dữ liệu 409
        if (existing)
            throw new HttpError_1.HttpError(409, "Email đã được đăng ký");
        // Thực hiện băm mật khẩu với salt round = 10 để lưu trữ an toàn trong DB
        const hash = await bcryptjs_1.default.hash(password, 10);
        // Gọi userRepository để lưu thông tin tài khoản người dùng mới và lấy ID tạo ra
        const userId = await user_repository_1.userRepository.create(name.trim(), cleanEmail, hash);
        // Trả về thông tin người dùng đã đăng ký thành công
        return {
            userId,
            name: name.trim(),
            email: cleanEmail,
            role: "User",
            isVerified: false,
            avatarUrl: null,
            isPremium: false,
        };
    },
    // Nghiệp vụ đăng nhập bằng Email và Mật khẩu thông thường
    async login(email, password) {
        // Chuẩn hóa địa chỉ email nhập vào
        const cleanEmail = email.toLowerCase().trim();
        // Tìm tài khoản người dùng trong cơ sở dữ liệu dựa theo email
        const user = await user_repository_1.userRepository.findByEmail(cleanEmail);
        // Nếu không tìm thấy người dùng
        if (!user) {
            // Thực hiện một lệnh băm giả lập nhằm chống tấn công Timing Attack dò tìm sự tồn tại của Email
            await bcryptjs_1.default.compare("dummy_password", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/");
            // Ném lỗi 401 không được phép
            throw new HttpError_1.HttpError(401, "Email hoặc mật khẩu không đúng");
        }
        // Nếu tài khoản đã bị vô hiệu hóa hoặc bị khóa bởi quản trị viên
        if (user.isActive === false) {
            // Ném lỗi 403 từ chối quyền truy cập
            throw new HttpError_1.HttpError(403, "Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
        }
        // Nếu người dùng đăng nhập bằng mật khẩu nhưng tài khoản đăng ký ban đầu qua Google OAuth
        if (user.passwordHash === "google_oauth_no_password_hash_placeholder") {
            // Ném lỗi yêu cầu người dùng phải đăng nhập bằng cách bấm nút Google
            throw new HttpError_1.HttpError(400, "Tài khoản của bạn được thiết lập bằng Google. Vui lòng đăng nhập bằng Google.");
        }
        // So khớp mật khẩu người dùng nhập vào với mật khẩu băm trong database
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        // Nếu mật khẩu không khớp, ném lỗi 401 không hợp lệ
        if (!ok)
            throw new HttpError_1.HttpError(401, "Email hoặc mật khẩu không đúng");
        // Trả về thông tin người dùng đăng nhập thành công
        return {
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            avatarUrl: user.avatar,
            isPremium: !!user.isPremium,
        };
    },
    // Nghiệp vụ xác thực người dùng thông qua tài khoản Google OAuth
    async googleAuth(idToken) {
        // Khởi tạo các biến chứa thông tin người dùng Google
        let email = "";
        let name = "";
        let avatar = "";
        // Kiểm tra xem môi trường hiện tại có phải là production hay không
        const isProduction = process.env.NODE_ENV === "production";
        // Cho phép mock auth nếu cấu hình biến môi trường và không ở production
        const isMockAllowed = process.env.ALLOW_MOCK_AUTH === "true" && !isProduction;
        // Kiểm tra xem token gửi lên có phải là token giả lập cho môi trường test hay không
        const isMockToken = isMockAllowed && idToken.startsWith("mock_google_token_");
        // Nếu sử dụng token giả lập (phục vụ viết test tự động/lướt nhanh)
        if (isMockToken) {
            // Tách chuỗi mock token để lấy email giả lập
            const parts = idToken.split("_");
            email = parts[3] || "mockuser@gmail.com";
            name = `Mock User (${email.split("@")[0]})`;
            avatar = "";
            // Ghi log ghi nhận việc đăng nhập bằng Google mock
            logger_1.logger.info(`🔑 [MOCK GOOGLE LOGIN] Email=${email}, Name=${name}`);
        }
        else {
            // Nếu là token giả lập nhưng hệ thống đang chạy ở môi trường Production
            if (idToken.startsWith("mock_google_token_")) {
                // Chặn đứng hành vi và ném lỗi 403
                throw new HttpError_1.HttpError(403, "Chế độ đăng nhập giả lập bị cấm hoàn toàn tại môi trường Production.");
            }
            // Xây dựng đường dẫn gọi API xác minh token của Google OAuth2
            const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            // Gửi yêu cầu HTTP GET đến Google API
            const verifyRes = await fetch(verifyUrl);
            // Nếu API Google phản hồi lỗi, ném lỗi 400
            if (!verifyRes.ok) {
                throw new HttpError_1.HttpError(400, "Xác thực token Google thất bại");
            }
            // Đọc dữ liệu JSON trả về từ Google
            const payload = (await verifyRes.json());
            // Yêu cầu tài khoản Google phải được xác thực email từ trước bởi Google
            if (payload.email_verified !== true &&
                payload.email_verified !== "true") {
                throw new HttpError_1.HttpError(400, "Tài khoản Google này chưa được xác minh.");
            }
            // Đảm bảo dữ liệu Google trả về chứa email người dùng
            if (!payload.email) {
                throw new HttpError_1.HttpError(400, "Token Google không hợp lệ hoặc thiếu Email");
            }
            // Đảm bảo client ID nhận được từ token Google khớp với Client ID được cấu hình trên Server
            const envClientId = process.env.GOOGLE_CLIENT_ID;
            if (envClientId && payload.aud !== envClientId) {
                throw new HttpError_1.HttpError(400, "Audience token không khớp với Client ID hệ thống");
            }
            // Lấy thông tin email, tên hiển thị, ảnh đại diện từ payload Google
            email = payload.email.toLowerCase().trim();
            name = payload.name || email.split("@")[0];
            avatar = payload.picture || "";
            // Ghi log đăng nhập Google thành công
            logger_1.logger.info(`✅ [GOOGLE SIGN IN SUCCESS] Email=${email}, Name=${name}`);
        }
        // Tra cứu xem người dùng này đã từng tạo tài khoản trong hệ thống bằng email này chưa
        let user = await user_repository_1.userRepository.findByEmail(email);
        let userId;
        // Nếu người dùng đăng nhập bằng Google lần đầu tiên
        if (!user) {
            // Gọi repository để đăng ký người dùng mới với chuỗi mật khẩu giữ chỗ (placeholder)
            userId = await user_repository_1.userRepository.create(name, email, "google_oauth_no_password_hash_placeholder");
            // Tự động xác minh tài khoản của người dùng này (vì Google đã xác minh email)
            await user_repository_1.userRepository.updateVerificationStatus(userId, true);
            // Ghi log tạo tài khoản thành công
            logger_1.logger.info(`✨ Created new Google User: ID=${userId}, Email=${email}`);
        }
        else {
            // Nếu tài khoản đã tồn tại, lấy ID
            userId = user.userId;
            // Chặn đăng nhập nếu tài khoản này đã bị khóa
            if (user.isActive === false) {
                throw new HttpError_1.HttpError(403, "Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
            }
            // Liên kết Google và tự động nâng cấp quyền Admin nếu là mock admin
            const rawUser = await user_repository_1.userRepository.findRawById(userId);
            if (rawUser) {
                let needsSave = false;
                if (!rawUser.isGoogleLinked) {
                    rawUser.isGoogleLinked = true;
                    needsSave = true;
                }
                if (isMockToken &&
                    email.toLowerCase().includes("admin") &&
                    rawUser.role !== "Admin") {
                    rawUser.role = "Admin";
                    rawUser.isVerified = true;
                    needsSave = true;
                    logger_1.logger.info(`✨ Auto-promoted existing user to Admin: Email=${email}`);
                }
                if (needsSave) {
                    await rawUser.save();
                }
            }
            // Ghi log đăng nhập thành công
            logger_1.logger.info(`🚪 Existing Google User logged in: ID=${userId}, Email=${email}`);
        }
        // Lấy thông tin tài khoản người dùng chi tiết sau khi cập nhật/tạo mới
        const updatedUser = await user_repository_1.userRepository.findById(userId);
        // Nếu không tìm thấy, ném lỗi 404
        if (!updatedUser) {
            throw new HttpError_1.HttpError(404, "Không tìm thấy thông tin tài khoản");
        }
        // Trả về kết quả đăng nhập thành công
        return {
            userId: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
            avatarUrl: updatedUser.avatarUrl,
            isPremium: !!updatedUser.isPremium,
        };
    },
    // Nghiệp vụ xóa hoàn toàn tài khoản người dùng theo chuẩn GDPR (xóa sạch mọi dữ liệu liên quan)
    async deleteAccount(userId) {
        // Khởi tạo phiên giao dịch transaction của Mongoose để đảm bảo tính ACID
        const session = await mongoose_1.default.startSession();
        let dbOptions = {};
        // Khởi tạo mảng các khóa cần xóa ở Redis cache và Cloudinary CDN
        let keysToDelete = [];
        let allPublicIds = [];
        let productIds = [];
        try {
            // Bắt đầu một Transaction của cơ sở dữ liệu MongoDB
            session.startTransaction();
            dbOptions = { session };
        }
        catch (err) {
            // Nếu cơ sở dữ liệu standalone không hỗ trợ transaction, kết thúc session và ghi log cảnh báo
            session.endSession();
            if (err.message && err.message.includes("replica set")) {
                logger_1.logger.warn("MongoDB Standalone detected. Bỏ qua Transaction ACID.");
            }
            else {
                throw err; // Ném lỗi thực tế ra ngoài nếu là sự cố kết nối nghiêm trọng
            }
        }
        try {
            // Quét và thu thập các khóa token refresh của người dùng này trong Redis để đăng xuất cưỡng bức
            let cursor = "0";
            do {
                const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${userId}:*`, "COUNT", 100);
                cursor = reply[0];
                keysToDelete.push(...reply[1]);
            } while (cursor !== "0");
            // Tìm kiếm toàn bộ sản phẩm do người dùng này đăng bán để lấy danh sách ảnh
            const products = await Product_1.Product.find({ sellerId: userId }, null, dbOptions);
            // Trích xuất toàn bộ public ID của ảnh trên Cloudinary để xóa hàng loạt sau đó
            allPublicIds = products
                .flatMap((p) => (p.images || []).map(cloudinary_2.extractPublicId))
                .filter((id) => !!id);
            // Lấy danh sách ID các sản phẩm của người dùng
            productIds = products.map((p) => p._id);
            // Xóa người dùng này ra khỏi danh sách đang theo dõi (following) của mọi tài khoản khác
            await User_1.User.updateMany({}, { $pull: { following: userId } }, dbOptions);
            // Nếu người dùng có đăng sản phẩm
            if (productIds.length > 0) {
                // Xóa sản phẩm ra khỏi danh sách yêu thích (favorites) của tất cả tài khoản khác
                await User_1.User.updateMany({}, { $pull: { favorites: { $in: productIds } } }, dbOptions);
                // Xóa tất cả các đánh giá (review) của những sản phẩm này
                await Review_1.Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa tất cả các tin nhắn chat liên quan đến những sản phẩm này
                await Message_1.Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa tất cả các báo cáo vi phạm liên quan đến những sản phẩm này
                await Report_1.Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
                // Xóa các thông báo liên quan đến các sản phẩm này
                await Notification_1.Notification.deleteMany({ productId: { $in: productIds } }, dbOptions);
            }
            // Xóa toàn bộ sản phẩm của người dùng này
            await Product_1.Product.deleteMany({ sellerId: userId }, dbOptions);
            // Xóa tất cả review mà người dùng này gửi đi HOẶC nhận về từ người khác
            await Review_1.Review.deleteMany({ $or: [{ reviewerId: userId }, { sellerId: userId }] }, dbOptions);
            // Xóa tất cả tin nhắn chat mà người dùng này gửi đi HOẶC nhận về từ người khác
            await Message_1.Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }, dbOptions);
            // Xóa toàn bộ báo cáo vi phạm do người dùng này tạo
            await Report_1.Report.deleteMany({ reporterId: userId }, dbOptions);
            // Xóa toàn bộ thông báo hệ thống gửi đến người dùng này
            await Notification_1.Notification.deleteMany({ userId: userId }, dbOptions);
            // Xóa toàn bộ bài đăng diễn đàn của người dùng này
            await Post_1.Post.deleteMany({ userId: userId }, dbOptions);
            // Xóa toàn bộ công thức nấu ăn của người dùng này
            await Recipe_1.Recipe.deleteMany({ authorId: userId }, dbOptions);
            // Xóa toàn bộ nhật ký cabin của người dùng này
            await BoatLog_1.BoatLog.deleteMany({ userId: userId }, dbOptions);
            // Xóa ID người dùng khỏi mảng lượt thích bài viết của tất cả mọi người
            await Post_1.Post.updateMany({}, { $pull: { likes: userId } }, dbOptions);
            // Xóa ID người dùng khỏi mảng lượt thích công thức nấu ăn của tất cả mọi người
            await Recipe_1.Recipe.updateMany({}, { $pull: { likes: userId } }, dbOptions);
            // Xóa toàn bộ comment của người dùng này dưới mọi bài viết khác
            await Post_1.Post.updateMany({}, { $pull: { comments: { userId: userId } } }, dbOptions);
            // Cuối cùng, xóa tài liệu người dùng khỏi bảng users
            await User_1.User.findByIdAndDelete(userId, dbOptions);
            // Nếu sử dụng transaction, tiến hành commit giao dịch ghi dữ liệu
            if (dbOptions.session)
                await session.commitTransaction();
            logger_1.logger.info(`GDPR SUCCESS: DB Deletion successfully finalized for UserID=${userId}`);
        }
        catch (err) {
            // Nếu xảy ra bất kỳ lỗi gì, rollback transaction để bảo toàn dữ liệu
            if (dbOptions.session)
                await session.abortTransaction();
            logger_1.logger.error(`GDPR FAILED: DB Rollback initiated. Error for UserID=${userId}: ${err.message}`);
            throw err;
        }
        finally {
            // Kết thúc session
            session.endSession();
        }
        // Xóa các refresh token Redis của người dùng đã đăng xuất
        if (keysToDelete.length > 0) {
            await redis_1.redis
                .del(...keysToDelete)
                .catch((e) => logger_1.logger.error(`Redis key deletion failed: ${e.message}`));
        }
        // Giải phóng triệt để hình ảnh của sản phẩm trên Cloudinary (xóa hàng loạt từng lô tối đa 100 ảnh)
        if (allPublicIds.length > 0) {
            const BATCH_SIZE = 100;
            for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
                const batch = allPublicIds.slice(i, i + BATCH_SIZE);
                await cloudinary_1.cloudinary.api.delete_resources(batch).catch((err) => {
                    logger_1.logger.error(`GDPR: Cloudinary bulk delete failed: ${err.message}`);
                });
            }
        }
        // Xóa bộ nhớ cache Redis chi tiết sản phẩm và làm mới số phiên bản danh sách sản phẩm
        if (productIds.length > 0) {
            const pipe = redis_1.redis.pipeline();
            productIds.forEach((id) => pipe.del(`product:detail:${id.toString()}`));
            pipe.incr("product:list:version:Fresh");
            pipe.incr("product:list:version:Dried");
            await pipe
                .exec()
                .catch((e) => logger_1.logger.error(`Redis cache clear failed: ${e.message}`));
        }
    },
    // Nghiệp vụ cập nhật thông tin hồ sơ của người dùng (tên hiển thị, email, hoặc ảnh đại diện avatar)
    async updateProfile(userId, data) {
        // Khởi tạo đối tượng cập nhật với trường tên hiển thị bắt buộc
        const updates = { name: data.name };
        // Nếu người dùng yêu cầu cập nhật lại địa chỉ email
        if (data.email !== undefined) {
            const cleanEmail = data.email.toLowerCase().trim();
            // Kiểm tra xem email mới này có bị trùng với tài khoản người khác không
            const taken = await user_repository_1.userRepository.emailExistsForOther(cleanEmail, userId);
            if (taken)
                throw new HttpError_1.HttpError(409, "Email đã được người khác đăng ký");
            updates.email = cleanEmail;
            // Nếu đổi email, tự động hủy trạng thái xác minh tích xanh của người dùng thường (chống mạo danh)
            const currentUser = await user_repository_1.userRepository.findRawById(userId);
            if (currentUser && currentUser.role !== "Admin") {
                updates.isVerified = false;
            }
        }
        // Nếu người dùng tải lên tệp ảnh đại diện mới dạng Buffer
        if (data.fileBuffer) {
            const currentUser = await user_repository_1.userRepository.findRawById(userId);
            // Nếu người dùng đã có ảnh đại diện cũ, xóa nó khỏi Cloudinary để tiết kiệm dung lượng
            if (currentUser?.avatar) {
                const oldPublicId = (0, cloudinary_2.extractPublicId)(currentUser.avatar);
                if (oldPublicId) {
                    (0, upload_1.deleteFromCloudinary)(oldPublicId).catch((err) => logger_1.logger.error(`Failed to delete old avatar on Cloudinary: ${err.message}`));
                }
            }
            // Tải ảnh đại diện mới lên Cloudinary và lấy URL lưu vào database
            updates.avatar = await uploadAvatarToCloudinary(data.fileBuffer);
        }
        // Cập nhật thông tin trong cơ sở dữ liệu bảng User
        await user_repository_1.userRepository.updateProfile(userId, updates);
        try {
            // Thực hiện cập nhật tầng thác (Cascade Update) thông tin tên và avatar mới cho các bài đăng
            const cascadeObj = { userName: updates.name };
            if (updates.avatar !== undefined)
                cascadeObj.userAvatar = updates.avatar;
            // Cập nhật thông tin tác giả của toàn bộ các bài đăng của người dùng này trên diễn đàn
            await post_repository_1.postRepository.updateMany({ userId }, { $set: cascadeObj });
            // Định nghĩa cập nhật cho các comment của người dùng này dưới bài viết của mọi người
            const commentUpdate = {};
            commentUpdate["comments.$[elem].userName"] = updates.name;
            if (updates.avatar !== undefined)
                commentUpdate["comments.$[elem].userAvatar"] = updates.avatar;
            // Thực hiện cập nhật comment sử dụng arrayFilters của Mongoose
            await post_repository_1.postRepository.updateMany({ "comments.userId": userId }, { $set: commentUpdate }, { arrayFilters: [{ "elem.userId": userId }] });
            // Cập nhật thông tin tác giả trong các nhật ký cabin
            await boatlog_repository_1.boatLogRepository.updateMany({ userId }, {
                $set: cascadeObj,
            });
        }
        catch (err) {
            // Ghi log nếu tác vụ cập nhật cascade gặp sự cố nhưng không chặn người dùng cập nhật profile
            logger_1.logger.error(`Failed to cascade update profile details for UserID=${userId}: ${err.message}`);
        }
        // Trả về thông tin cập nhật mới
        return {
            name: data.name,
            ...(updates.email !== undefined && { email: updates.email }),
            ...(updates.avatar !== undefined && { avatarUrl: updates.avatar }),
        };
    },
    // Nghiệp vụ thay đổi mật khẩu của tài khoản
    async changePassword(userId, currentPassword, newPassword) {
        // Lấy chuỗi băm mật khẩu hiện tại của người dùng từ database
        const hash = await user_repository_1.userRepository.getPasswordHash(userId);
        // Nếu không tồn tại người dùng, ném lỗi 404
        if (!hash)
            throw new HttpError_1.HttpError(404, "Không tìm thấy người dùng");
        // So khớp mật khẩu hiện tại người dùng nhập vào
        const ok = await bcryptjs_1.default.compare(currentPassword, hash);
        // Nếu không khớp, ném lỗi 401 không được phép
        if (!ok)
            throw new HttpError_1.HttpError(401, "Mật khẩu hiện tại không đúng");
        // Thực hiện băm mật khẩu mới và lưu đè lên mật khẩu cũ
        await user_repository_1.userRepository.updatePassword(userId, await bcryptjs_1.default.hash(newPassword, 10));
    },
    // Hàm tạo mã Access Token JWT có thời hạn hoạt động là 15 phút
    signToken(userId, role) {
        const secret = process.env.JWT_SECRET;
        // Đảm bảo khóa bí mật JWT đã được cấu hình trong file .env
        if (!secret)
            throw new Error("JWT_SECRET chưa được cấu hình");
        const options = { expiresIn: "15m" };
        // Thực hiện ký tạo JWT chứa payload ID và vai trò người dùng
        return jsonwebtoken_1.default.sign({ userId, role }, secret, options);
    },
};
// Hàm nội bộ hỗ trợ tải tệp ảnh đại diện avatar lên thư mục 'avatars' của Cloudinary CDN
async function uploadAvatarToCloudinary(buffer) {
    const result = await new Promise((resolve, reject) => {
        // Tạo luồng upload stream để truyền buffer ảnh lên Cloudinary
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder: "avatars" }, (error, result) => (result ? resolve(result) : reject(error)));
        // Kết thúc ghi dữ liệu buffer và kích hoạt quá trình upload
        stream.end(buffer);
    });
    // Trả về URL bảo mật (HTTPS) của ảnh đại diện được tạo ra
    return result.secure_url || result.url;
}
