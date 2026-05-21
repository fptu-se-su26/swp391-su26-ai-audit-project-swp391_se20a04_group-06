import { Router } from 'express';
import {
  listUsers, toggleUser,
  listAllProducts, adminDeleteProduct,
  getStats,
} from '../controllers/admin.controller';
import { authenticate, adminOnly } from '../middlewares/auth';

const router = Router();
router.use(authenticate, adminOnly); // tất cả route admin đều yêu cầu Admin

router.get('/stats',              getStats);
router.get('/users',              listUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/listings',           listAllProducts);
router.delete('/listings/:id',    adminDeleteProduct);

export default router;
