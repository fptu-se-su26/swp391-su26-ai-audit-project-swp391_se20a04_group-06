import { Router } from 'express';
import { toggleFollow, checkFollow } from '../controllers/follow.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/:sellerId/toggle', authenticate, toggleFollow);
router.get('/:sellerId/check', authenticate, checkFollow);

export default router;
