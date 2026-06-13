import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UnauthorizedError, ValidationError } from "../../../../shared/domain/exceptions/DomainException";

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, passwordRaw: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(cleanEmail);

    if (!user) {
      // Ngăn chặn timing attack bằng cách so khớp giả lập
      await bcrypt.compare(
        "dummy_password",
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/"
      );
      throw new UnauthorizedError("Email hoặc mật khẩu không đúng");
    }

    user.checkActive();

    if (user.passwordHash === "google_oauth_no_password_hash_placeholder") {
      throw new ValidationError(
        "Tài khoản của bạn được thiết lập bằng Google. Vui lòng đăng nhập bằng Google."
      );
    }

    const match = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!match) {
      throw new UnauthorizedError("Email hoặc mật khẩu không đúng");
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
