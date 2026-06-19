"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
class LoginUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(email, passwordRaw) {
        const cleanEmail = email.toLowerCase().trim();
        const user = await this.userRepository.findByEmail(cleanEmail);
        if (!user) {
            // Ngăn chặn timing attack bằng cách so khớp giả lập
            await bcryptjs_1.default.compare("dummy_password", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/");
            throw new DomainException_1.UnauthorizedError("Email hoặc mật khẩu không đúng");
        }
        user.checkActive();
        if (user.passwordHash === "google_oauth_no_password_hash_placeholder") {
            throw new DomainException_1.ValidationError("Tài khoản của bạn được thiết lập bằng Google. Vui lòng đăng nhập bằng Google.");
        }
        const match = await bcryptjs_1.default.compare(passwordRaw, user.passwordHash);
        if (!match) {
            throw new DomainException_1.UnauthorizedError("Email hoặc mật khẩu không đúng");
        }
        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            avatarUrl: user.avatar,
            isPremium: user.isPremium,
        };
    }
}
exports.LoginUseCase = LoginUseCase;
