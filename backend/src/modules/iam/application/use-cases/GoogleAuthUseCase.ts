import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";
import { logger } from "../../../../utils/logger";

export class GoogleAuthUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(idToken: string) {
    let email = "";
    let name = "";
    let avatar = "";

    const isProduction = process.env.NODE_ENV === "production";
    const isMockAllowed = process.env.ALLOW_MOCK_AUTH === "true" && !isProduction;
    const isMockToken = isMockAllowed && idToken.startsWith("mock_google_token_");

    if (isMockToken) {
      const parts = idToken.split("_");
      email = parts[3] || "mockuser@gmail.com";
      name = `Mock User (${email.split("@")[0]})`;
      avatar = "";
      logger.info(`🔑 [MOCK GOOGLE LOGIN] Email=${email}, Name=${name}`);
    } else {
      if (idToken.startsWith("mock_google_token_")) {
        throw new ValidationError("Chế độ đăng nhập giả lập bị cấm hoàn toàn tại môi trường Production.");
      }

      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const verifyRes = await fetch(verifyUrl);
      if (!verifyRes.ok) {
        throw new ValidationError("Xác thực token Google thất bại");
      }

      const payload = (await verifyRes.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        aud?: string;
        email_verified?: boolean | string;
      };

      if (payload.email_verified !== true && payload.email_verified !== "true") {
        throw new ValidationError("Tài khoản Google này chưa được xác minh.");
      }

      if (!payload.email) {
        throw new ValidationError("Token Google không hợp lệ hoặc thiếu Email");
      }

      const envClientId = process.env.GOOGLE_CLIENT_ID;
      if (envClientId && payload.aud !== envClientId) {
        throw new ValidationError("Audience token không khớp với Client ID hệ thống");
      }

      email = payload.email.toLowerCase().trim();
      name = payload.name || email.split("@")[0];
      avatar = payload.picture || "";
      logger.info(`✅ [GOOGLE SIGN IN SUCCESS] Email=${email}, Name=${name}`);
    }

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      user = new User({
        name,
        email,
        passwordHash: "google_oauth_no_password_hash_placeholder",
        role: "User",
        isActive: true,
        isVerified: true,
        isPremium: false,
        avatar: avatar || null,
        badges: [],
        favorites: [],
        following: [],
      });
      await this.userRepository.save(user);
      logger.info(`✨ Created new Google User: ID=${user.id}, Email=${email}`);
    } else {
      user.checkActive();

      if (isMockToken && email.toLowerCase().includes("admin") && user.role !== "Admin") {
        const rawProps = user.toProps();
        const updatedUser = new User({
          ...rawProps,
          role: "Admin",
          isVerified: true,
        }, user.id);
        user = updatedUser;
        await this.userRepository.save(user);
        logger.info(`✨ Auto-promoted existing user to Admin: Email=${email}`);
      }

      logger.info(`🚪 Existing Google User logged in: ID=${user.id}, Email=${email}`);
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
