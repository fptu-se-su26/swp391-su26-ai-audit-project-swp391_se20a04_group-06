import { Request, Response } from "express";
import { productRepository } from "../repositories/product.repository";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middlewares/upload";
import { sendServerError, parseId } from "../helpers/response.helper";
import { cloudinary } from "../config/cloudinary";
import { logger } from "../utils/logger";
import { extractPublicId } from "../utils/cloudinary";

const MAX_IMAGES = 5;

export async function uploadImages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.id);
  const files = req.files as Express.Multer.File[];

  if (!productId)
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  if (!files || files.length === 0)
    return res.status(400).json({ message: "Chưa chọn ảnh nào" });

  try {
    const prod = await productRepository.findById(productId);
    if (!prod)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (prod.sellerId.toString() !== userId && role !== "Admin")
      return res
        .status(403)
        .json({ message: "Không có quyền tải ảnh cho bài đăng này" });

    const currentCount = prod.images.length;
    const canAdd = MAX_IMAGES - currentCount;

    if (canAdd <= 0)
      return res.status(400).json({
        message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.`,
      });

    const toUpload = files.slice(0, canAdd);
    const uploadedResults = await Promise.all(
      toUpload.map((file) => uploadToCloudinary(file.buffer, "seafood")),
    );

    const newUrls = uploadedResults.map((item) => item.url);
    await productRepository.findByIdAndUpdate(productId, {
      $push: { images: { $each: newUrls } },
    });

    const uploaded = uploadedResults.map((item, index) => ({
      id: currentCount + index,
      url: item.url,
    }));

    return res
      .status(201)
      .json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getUploadSignature(req: Request, res: Response) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = { timestamp, folder: "seafood" };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET as string,
    );

    return res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "seafood",
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteImage(req: Request, res: Response) {
  const { userId, role } = req.user;
  const imageId = req.params.id;

  if (!imageId) return res.status(400).json({ message: "ID ảnh không hợp lệ" });

  try {
    let targetUrl = imageId;

    if (!targetUrl.startsWith("http")) {
      try {
        targetUrl = Buffer.from(imageId, "base64").toString("utf-8");
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Định dạng ID ảnh không hợp lệ" });
      }
    }

    const prod = await productRepository.findOne({
      images: targetUrl,
    });

    if (!prod)
      return res
        .status(404)
        .json({ message: "Không tìm thấy ảnh liên kết với sản phẩm" });

    if (prod.sellerId.toString() !== userId && role !== "Admin")
      return res.status(403).json({ message: "Không có quyền xoá ảnh này" });

    const imageUrl = prod.images.find((img) => img === targetUrl);
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch((cloudinaryErr) => {
          logger.error(
            `Cloudinary deletion failed for publicId ${publicId}: ${cloudinaryErr.message}`,
          );
        });
      }
      prod.images = prod.images.filter((img) => img !== imageUrl);
      await prod.save();
    }

    return res.json({ message: "Đã xoá ảnh thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}
