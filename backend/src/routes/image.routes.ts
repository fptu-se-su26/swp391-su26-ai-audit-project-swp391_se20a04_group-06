import { Router } from 'express';
import { uploadImages, deleteImage } from '../controllers/image.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Upload tối đa 5 ảnh một lúc cho bài đăng :id
router.post('/products/:id/images', authenticate, upload.array('images', 5), uploadImages);

// Xoá 1 ảnh
router.delete('/images/:id', authenticate, deleteImage);

export default router;
