"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordUseCase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
class ChangePasswordUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(userId, currentPasswordRaw, newPasswordRaw) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        const match = await bcryptjs_1.default.compare(currentPasswordRaw, user.passwordHash);
        if (!match)
            throw new DomainException_1.UnauthorizedError("Mật khẩu hiện tại không đúng");
        const newHash = await bcryptjs_1.default.hash(newPasswordRaw, 10);
        user.updatePassword(newHash);
        await this.userRepository.save(user);
    }
}
exports.ChangePasswordUseCase = ChangePasswordUseCase;
