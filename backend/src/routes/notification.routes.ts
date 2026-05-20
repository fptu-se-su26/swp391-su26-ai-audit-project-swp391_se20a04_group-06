import { Router } from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/read', authenticate, markAllAsRead);

export default router;
