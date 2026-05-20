import { Router } from 'express';
import { addReview, getReviewsBySeller } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.post('/', authenticate, upload.single('image'), addReview);
router.get('/seller/:sellerId', getReviewsBySeller);

export default router;

