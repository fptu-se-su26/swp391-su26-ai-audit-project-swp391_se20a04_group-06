import { Router } from 'express';
import {
  listUsers, toggleUser, verifyUser,
  listAllProducts, adminDeleteProduct,
  getStats,
} from '../controllers/admin.controller';
import { authenticate, adminOnly } from '../middlewares/auth';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/stats',                getStats);
router.get('/users',                listUsers);
router.patch('/users/:id/toggle',   toggleUser);
router.patch('/users/:id/verify',   verifyUser);   // ← MỚI
router.get('/listings',             listAllProducts);
router.delete('/listings/:id',      adminDeleteProduct);

export default router;
