import { authService } from "../../../../backend/src/services/auth.service";
import { userRepository } from "../../../../backend/src/repositories/user.repository";
import { redis } from "../../../../backend/src/config/redis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../../../backend/src/repositories/user.repository");
jest.mock("../../../../backend/src/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  },
}));

describe("Unit Test: auth.service.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_jwt_secret";
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue("mock_user_id");

      const result = await authService.register("User A", "userA@example.com", "password123");

      expect(userRepository.findByEmail).toHaveBeenCalledWith("usera@example.com");
      expect(userRepository.create).toHaveBeenCalledWith("User A", "usera@example.com", expect.any(String));
      expect(result).toEqual({
        userId: "mock_user_id",
        name: "User A",
        email: "usera@example.com",
        role: "User",
        isVerified: false,
        avatarUrl: null,
        isPremium: false,
      });
    });

    it("should throw a 409 error if email already exists", async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ userId: "existing_id" });

      await expect(
        authService.register("User A", "userA@example.com", "password123")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 409,
          message: "Email đã được đăng ký",
        })
      );
    });
  });

  describe("login", () => {
    it("should successfully log in with correct credentials", async () => {
      const passwordHash = await bcrypt.hash("password123", 10);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        userId: "mock_user_id",
        name: "User A",
        email: "usera@example.com",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: false,
        avatar: "avatar.jpg",
        isPremium: false,
      });

      const result = await authService.login("userA@example.com", "password123");

      expect(result).toEqual({
        userId: "mock_user_id",
        name: "User A",
        email: "usera@example.com",
        role: "User",
        isVerified: false,
        avatarUrl: "avatar.jpg",
        isPremium: false,
      });
    });

    it("should throw 401 if user does not exist", async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login("nonexistent@example.com", "password123")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          message: "Email hoặc mật khẩu không đúng",
        })
      );
    });

    it("should throw 403 if user account is disabled", async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        userId: "mock_user_id",
        email: "usera@example.com",
        isActive: false,
      });

      await expect(
        authService.login("userA@example.com", "password123")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          message: "Tài khoản đã bị khoá. Vui lòng liên hệ admin.",
        })
      );
    });

    it("should throw 400 if account has no password (Google OAuth only)", async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        userId: "mock_user_id",
        email: "usera@example.com",
        isActive: true,
        passwordHash: "google_oauth_no_password_hash_placeholder",
      });

      await expect(
        authService.login("userA@example.com", "password123")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          message: "Tài khoản của bạn được thiết lập bằng Google. Vui lòng đăng nhập bằng Google.",
        })
      );
    });

    it("should throw 401 if password is wrong", async () => {
      const passwordHash = await bcrypt.hash("correct_password", 10);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        userId: "mock_user_id",
        email: "usera@example.com",
        isActive: true,
        passwordHash,
      });

      await expect(
        authService.login("userA@example.com", "wrong_password")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          message: "Email hoặc mật khẩu không đúng",
        })
      );
    });
  });

  describe("changePassword", () => {
    it("should successfully change password", async () => {
      const currentPasswordHash = await bcrypt.hash("old_password", 10);
      (userRepository.getPasswordHash as jest.Mock).mockResolvedValue(currentPasswordHash);
      (userRepository.updatePassword as jest.Mock).mockResolvedValue(undefined);

      await authService.changePassword("mock_user_id", "old_password", "new_password");

      expect(userRepository.getPasswordHash).toHaveBeenCalledWith("mock_user_id");
      expect(userRepository.updatePassword).toHaveBeenCalledWith("mock_user_id", expect.any(String));
    });

    it("should throw 404 if user not found", async () => {
      (userRepository.getPasswordHash as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.changePassword("nonexistent_id", "old", "new")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Không tìm thấy người dùng",
        })
      );
    });

    it("should throw 401 if current password is wrong", async () => {
      const currentPasswordHash = await bcrypt.hash("correct_password", 10);
      (userRepository.getPasswordHash as jest.Mock).mockResolvedValue(currentPasswordHash);

      await expect(
        authService.changePassword("mock_user_id", "wrong_password", "new_password")
      ).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          message: "Mật khẩu hiện tại không đúng",
        })
      );
    });
  });
});
