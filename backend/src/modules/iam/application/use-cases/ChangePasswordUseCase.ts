import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

export class ChangePasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, currentPasswordRaw: string, newPasswordRaw: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");

    const match = await bcrypt.compare(currentPasswordRaw, user.passwordHash);
    if (!match) throw new UnauthorizedError("Mật khẩu hiện tại không đúng");

    const newHash = await bcrypt.hash(newPasswordRaw, 10);
    user.updatePassword(newHash);

    await this.userRepository.save(user);
  }
}
