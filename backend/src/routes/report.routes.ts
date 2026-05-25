import { Router } from 'express';
import { createReport, getReports, handleReport } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.post('/:productId', authenticate, createReport);
router.get('/', authenticate, getReports);       // admin
router.patch('/:id', authenticate, handleReport); // admin
export default router;
