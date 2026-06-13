import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { ConflictError } from "../../../../shared/domain/exceptions/DomainException";

export class RegisterUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(name: string, email: string, passwordRaw: string) {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new ConflictError("Email đã được đăng ký");
    }

    const hash = await bcrypt.hash(passwordRaw, 10);
    const user = new User({
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
