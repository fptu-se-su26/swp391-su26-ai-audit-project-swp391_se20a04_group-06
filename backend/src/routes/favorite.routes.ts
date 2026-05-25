import { Router } from 'express';
import { getMyFavorites, getMyFavoriteIds, toggleFavorite } from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.get('/', authenticate, getMyFavorites);
router.get('/ids', authenticate, getMyFavoriteIds);
router.post('/:productId', authenticate, toggleFavorite);
export default router;
