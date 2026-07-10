"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthUseCase = void 0;
// Import thực thể nghiệp vụ User (Domain Entity) đại diện cho một người dùng
const User_1 = require("../../domain/entities/User");
// Import lỗi nghiệp vụ tùy chỉnh phục vụ validate dữ liệu ở tầng Domain
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import thư viện ghi log để ghi nhận tiến trình hoạt động của hệ thống
const logger_1 = require("../../../../utils/logger");
// Lớp nghiệp vụ xử lý Đăng nhập Google (Google Authentication UseCase)
class GoogleAuthUseCase {
    // Constructor nhận vào userRepository thông qua cơ chế Dependency Injection (DI) để lưu trữ/truy xuất người dùng
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    // Phương thức chính thực thi nghiệp vụ đăng nhập bằng Google ID Token hoặc Token giả lập
    async execute(idToken, selectedRole) {
        let email = ""; // Biến lưu email người dùng sau khi xác thực
        let name = ""; // Biến lưu họ tên người dùng sau khi xác thực
        let avatar = ""; // Biến lưu đường dẫn ảnh đại diện người dùng sau khi xác thực
        // Đọc các biến môi trường để xác định môi trường chạy dự án
        const isProduction = process.env.NODE_ENV === "production"; // Kiểm tra xem có phải môi trường Production (vận hành thực tế) không
        const isMockAllowed = process.env.ALLOW_MOCK_AUTH === "true" && !isProduction; // Chỉ cho phép đăng nhập giả lập khi cờ ALLOW_MOCK_AUTH bật và KHÔNG ở Production
        const isMockToken = isMockAllowed && idToken.startsWith("mock_google_token_"); // Kiểm tra xem token gửi lên có phải dạng giả lập (mock) hay không
        // KỊCH BẢN 1: ĐĂNG NHẬP GIẢ LẬP ĐỂ PHÁT TRIỂN NHANH (LOCAL DEV MOCK LOGIN)
        if (isMockToken) {
            const parts = idToken.split("_"); // Tách chuỗi mock token (ví dụ: mock_google_token_user1@gmail.com) bằng ký tự "_"
            email = parts[3] || "mockuser@gmail.com"; // Lấy phần email ở vị trí thứ 4, nếu trống đặt mặc định là mockuser@gmail.com
            name = `Mock User (${email.split("@")[0]})`; // Đặt tên hiển thị giả lập dựa trên tiền tố của email
            avatar = ""; // Đặt avatar trống cho người dùng giả lập
            logger_1.logger.info(`🔑 [MOCK GOOGLE LOGIN] Email=${email}, Name=${name}`); // Ghi nhận log sự kiện đăng nhập giả lập thành công
        }
        // KỊCH BẢN 2: ĐĂNG NHẬP BẰNG GOOGLE OAUTH 2.0 THỰC TẾ
        else {
            // Bảo vệ Production: Nếu token bắt đầu bằng mock_google_token_ nhưng đang chạy ở Production, chặn ngay lập tức
            if (idToken.startsWith("mock_google_token_")) {
                throw new DomainException_1.ValidationError("Chế độ đăng nhập giả lập bị cấm hoàn toàn tại môi trường Production.");
            }
            // Đường dẫn API của Google để kiểm tra tính hợp lệ của id_token
            const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            // Thực hiện gửi request kiểm tra token đến máy chủ của Google
            const verifyRes = await fetch(verifyUrl);
            // Nếu máy chủ Google trả về lỗi (token hết hạn, bị chỉnh sửa hoặc không hợp lệ)
            if (!verifyRes.ok) {
                throw new DomainException_1.ValidationError("Xác thực token Google thất bại");
            }
            // Giải mã kết quả trả về từ Google thành đối tượng dữ liệu
            const payload = (await verifyRes.json());
            // Đảm bảo email của tài khoản Google này đã được người dùng xác minh với Google
            if (payload.email_verified !== true && payload.email_verified !== "true") {
                throw new DomainException_1.ValidationError("Tài khoản Google này chưa được xác minh.");
            }
            // Đảm bảo dữ liệu Google trả về có chứa email
            if (!payload.email) {
                throw new DomainException_1.ValidationError("Token Google không hợp lệ hoặc thiếu Email");
            }
            // Bảo mật bổ sung: Kiểm tra xem client_id ghi trong token có khớp với Client ID của ứng dụng chúng ta cấu hình hay không
            const envClientId = process.env.GOOGLE_CLIENT_ID;
            if (envClientId && payload.aud !== envClientId) {
                throw new DomainException_1.ValidationError("Audience token không khớp với Client ID hệ thống");
            }
            // Lấy và chuẩn hóa dữ liệu sạch từ payload của Google
            email = payload.email.toLowerCase().trim(); // Chuyển email về chữ thường và xóa khoảng trắng thừa ở 2 đầu
            name = payload.name || email.split("@")[0]; // Nếu thiếu họ tên thì dùng phần tiền tố của email làm tên hiển thị
            avatar = payload.picture || ""; // Lấy ảnh đại diện từ tài khoản Google
            logger_1.logger.info(`✅ [GOOGLE SIGN IN SUCCESS] Email=${email}, Name=${name}`); // Ghi nhận log đăng nhập Google thành công
        }
        // TÌM KIẾM NGƯỜI DÙNG TRONG DATABASE
        let user = await this.userRepository.findByEmail(email);
        const isAdminEmail = email.toLowerCase().trim() === "tominhcuong5g@gmail.com";
        // KỊCH BẢN A: NGƯỜI DÙNG CHƯA TỒN TẠI TRONG DATABASE (ĐĂNG KÝ MỚI LẦN ĐẦU)
        if (!user) {
            let isVerified = false;
            let role = "User";
            if (isAdminEmail) {
                role = "Admin";
                isVerified = true;
            }
            // Tạo một thực thể User mới với các dữ liệu ban đầu
            user = new User_1.User({
                name,
                email,
                passwordHash: "google_oauth_no_password_hash_placeholder", // Không sử dụng mật khẩu, điền placeholder để tương thích DB Schema
                role,
                isActive: true, // Tài khoản đăng ký qua Google mặc định hoạt động ngay lập tức
                isVerified,
                isPremium: false, // Mặc định tài khoản thường, chưa nâng cấp Premium
                avatar: avatar || null,
                badges: [], // Danh sách huy hiệu ban đầu trống rỗng
                favorites: [], // Danh sách tin yêu thích ban đầu trống rỗng
                following: [], // Danh sách người đang theo dõi ban đầu trống rỗng
            });
            // Lưu thông tin người dùng mới này vào cơ sở dữ liệu MongoDB
            await this.userRepository.save(user);
            logger_1.logger.info(`✨ Created new Google User: ID=${user.id}, Email=${email}, Role=${role}, IsVerified=${isVerified}`); // Ghi nhận log đã tạo người dùng thành công
        }
        // KỊCH BẢN B: NGƯỜI DÙNG ĐÃ TỒN TẠI (ĐĂNG NHẬP LẠI)
        else {
            // Kiểm tra xem tài khoản có đang bị khóa (isActive = false) hay không, nếu khóa sẽ tự động ném ra lỗi 403
            user.checkActive();
            // Nếu là email admin được chỉ định nhưng tài khoản hiện tại chưa là Admin, nâng cấp ngay lập tức
            if (isAdminEmail && user.role !== "Admin") {
                const rawProps = user.toProps();
                const updatedUser = new User_1.User({
                    ...rawProps,
                    role: "Admin",
                    isVerified: true,
                }, user.id);
                user = updatedUser;
                await this.userRepository.save(user);
                logger_1.logger.info(`✨ Auto-promoted existing user to Admin: Email=${email}`);
            }
            // Tiện ích môi trường Dev: Tự động nâng cấp tài khoản giả lập chứa từ khóa "admin" trong email lên làm Admin hệ thống
            if (isMockToken && email.toLowerCase().includes("admin") && user.role !== "Admin") {
                const rawProps = user.toProps(); // Lấy tất cả thuộc tính hiện tại của thực thể User
                // Tạo thực thể User mới dựa trên thuộc tính cũ nhưng thay đổi role thành "Admin"
                const updatedUser = new User_1.User({
                    ...rawProps,
                    role: "Admin",
                    isVerified: true,
                }, user.id); // Giữ nguyên ID của người dùng cũ
                user = updatedUser; // Cập nhật lại biến user
                await this.userRepository.save(user); // Lưu đè cập nhật lên Database
                logger_1.logger.info(`✨ Auto-promoted existing user to Admin: Email=${email}`);
            }
            logger_1.logger.info(`🚪 Existing Google User logged in: ID=${user.id}, Email=${email}`); // Ghi nhận log đăng nhập thành công người dùng cũ
        }
        // Trả về dữ liệu DTO sạch của người dùng để Controller đóng gói trả về phía Client
        return {
            userId: user.id, // ID định danh người dùng trong MongoDB
            name: user.name, // Họ tên hiển thị
            email: user.email, // Địa chỉ email
            role: user.role, // Vai trò (User hoặc Admin)
            isVerified: user.isVerified, // Trạng thái chứng thực của ngư dân (0 hoặc 1)
            avatarUrl: user.avatar, // Ảnh đại diện
            isPremium: user.isPremium, // Trạng thái tài khoản trả phí Premium
        };
    }
}
exports.GoogleAuthUseCase = GoogleAuthUseCase;
