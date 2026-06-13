import { IImageUploader } from "../../application/use-cases/UpdateProfileUseCase";
import { cloudinary } from "../../../../config/cloudinary";

export class CloudinaryImageUploader implements IImageUploader {
  async uploadAvatar(buffer: Buffer): Promise<string> {
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "avatars" },
        (error, result) => (result ? resolve(result) : reject(error))
      );
      stream.end(buffer);
    });
    return result.secure_url || result.url;
  }
}
