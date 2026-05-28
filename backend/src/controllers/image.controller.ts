import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload';
import { sendServerError, parseId } from '../helpers/response.helper';

const MAX_IMAGES = 5;

// Helper to extract Cloudinary public ID from URL for deletion
export function extractPublicId(url: string): string | null {
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  const pathWithVersion = parts[1];
  const pathParts = pathWithVersion.split('/');
  if (pathParts[0].startsWith('v')) {
    pathParts.shift();
  }
  const pathWithoutVersion = pathParts.join('/');
  const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
  if (lastDotIndex === -1) return pathWithoutVersion;
  return pathWithoutVersion.substring(0, lastDotIndex);
}

export async function uploadImages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.id);
  const files = req.files as Express.Multer.File[];

  if (!productId) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
  if (!files || files.length === 0)
    return res.status(400).json({ message: 'Chưa chọn ảnh nào' });

  try {
    const prod = await Product.findById(productId);
    if (!prod) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    if (prod.sellerId.toString() !== userId && role !== 'Admin')
      return res.status(403).json({ message: 'Không có quyền tải ảnh cho bài đăng này' });

    const currentCount = prod.images.length;
    const canAdd = MAX_IMAGES - currentCount;

    if (canAdd <= 0)
      return res.status(400).json({ message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.` });

    const toUpload = files.slice(0, canAdd);
    const uploadedResults = await Promise.all(
      toUpload.map((file) => uploadToCloudinary(file.buffer, 'seafood')),
    );

    const newUrls = uploadedResults.map((item) => item.url);
    await Product.findByIdAndUpdate(productId, {
      $push: { images: { $each: newUrls } }
    });

    const uploaded = uploadedResults.map((item, index) => ({
      id: currentCount + index,
      url: item.url,
    }));

    return res.status(201).json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteImage(req: Request, res: Response) {
  const { userId, role } = req.user;
  const imageId = req.params.id; // could be index or part of URL string

  if (!imageId) return res.status(400).json({ message: 'ID ảnh không hợp lệ' });

  try {
    // Tìm sản phẩm chứa ảnh (hoặc khớp một phần URL)
    const prod = await Product.findOne({
      images: { $regex: imageId }
    });
    if (!prod) return res.status(404).json({ message: 'Không tìm thấy ảnh' });

    if (prod.sellerId.toString() !== userId && role !== 'Admin')
      return res.status(403).json({ message: 'Không có quyền xoá ảnh này' });

    const imageUrl = prod.images.find((img) => img.includes(imageId));
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(() => {});
      }
      prod.images = prod.images.filter((img) => img !== imageUrl);
      await prod.save();
    }

    return res.json({ message: 'Đã xoá ảnh' });
  } catch (err) {
    return sendServerError(res, err);
  }
}
