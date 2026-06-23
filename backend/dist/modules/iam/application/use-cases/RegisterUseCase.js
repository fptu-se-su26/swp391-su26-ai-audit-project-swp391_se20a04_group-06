"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUseCase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../../domain/entities/User");
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
class RegisterUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(name, email, passwordRaw) {
        const cleanEmail = email.toLowerCase().trim();
        const existing = await this.userRepository.findByEmail(cleanEmail);
        if (existing) {
            throw new DomainException_1.ConflictError("Email đã được đăng ký");
        }
        const hash = await bcryptjs_1.default.hash(passwordRaw, 10);
        const user = new User_1.User({
            name: name.trim(),
            email: cleanEmail,
            passwordHash: hash,
            role: "User",
            isActive: true,
            isVerified: false,
            isPremium: false,
            avatar: null,
            badges: [],
            favorites: [],
            following: [],
        });
        await this.userRepository.save(user);
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
exports.RegisterUseCase = RegisterUseCase;
