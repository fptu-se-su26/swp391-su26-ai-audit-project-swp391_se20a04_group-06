import { Router } from 'express';
import { getMessages, sendMessage, unreadCount, getConversations } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/unread-count',    authenticate, unreadCount);
router.get('/conversations',   authenticate, getConversations);
router.get('/:productId',      authenticate, getMessages);
router.post('/',               authenticate, sendMessage);

export default router;
