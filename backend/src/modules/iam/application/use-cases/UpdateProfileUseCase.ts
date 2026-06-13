import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ConflictError, NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { deleteFromCloudinary } from "../../../../middlewares/upload";
import { extractPublicId } from "../../../../utils/cloudinary";
import { logger } from "../../../../utils/logger";
import { postRepository } from "../../../../repositories/post.repository";
import { boatLogRepository } from "../../../../repositories/boatlog.repository";

export interface IImageUploader {
  uploadAvatar(buffer: Buffer): Promise<string>;
}

export class UpdateProfileUseCase {
  constructor(
    private userRepository: IUserRepository,
    private imageUploader: IImageUploader
  ) {}

  async execute(
    userId: string,
    data: { name: string; email?: string; fileBuffer?: Buffer }
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");

    let newAvatarUrl: string | undefined;

    if (data.email !== undefined) {
      const cleanEmail = data.email.toLowerCase().trim();
      const existingWithEmail = await this.userRepository.findByEmail(cleanEmail);
      if (existingWithEmail && existingWithEmail.id !== userId) {
        throw new ConflictError("Email đã được người khác đăng ký");
      }
      
      user.updateProfile(data.name, cleanEmail);

      if (user.role !== "Admin") {
        user.updateVerification(false);
      }
    } else {
      user.updateProfile(data.name);
    }

    if (data.fileBuffer) {
      if (user.avatar) {
        const oldPublicId = extractPublicId(user.avatar);
        if (oldPublicId) {
          deleteFromCloudinary(oldPublicId).catch((err) =>
            logger.error(`Failed to delete old avatar on Cloudinary: ${err.message}`)
          );
        }
      }
      newAvatarUrl = await this.imageUploader.uploadAvatar(data.fileBuffer);
      user.updateProfile(user.name, user.email, newAvatarUrl);
    }

    await this.userRepository.save(user);

    // Cascading updates (cập nhật đồng bộ các collection liên quan)
    try {
      const cascadeObj: any = { userName: user.name };
      if (user.avatar !== null) cascadeObj.userAvatar = user.avatar;

      await postRepository.updateMany({ userId } as any, { $set: cascadeObj });

      const commentUpdate: any = {};
      commentUpdate["comments.$[elem].userName"] = user.name;
      if (user.avatar !== null) commentUpdate["comments.$[elem].userAvatar"] = user.avatar;

      await postRepository.updateMany(
        { "comments.userId": userId } as any,
        { $set: commentUpdate },
        { arrayFilters: [{ "elem.userId": userId }] } as any
      );

      await boatLogRepository.updateMany({ userId } as any, { $set: cascadeObj });
    } catch (err: any) {
      logger.error(`Failed to cascade update profile details for UserId=${userId}: ${err.message}`);
    }

    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar,
    };
  }
}
