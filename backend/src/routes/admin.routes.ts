import { Router } from 'express';
import {
<<<<<<< HEAD
  listUsers, toggleUser,
=======
  listUsers, toggleUser, verifyUser,
>>>>>>> origin/main
  listAllProducts, adminDeleteProduct,
  getStats,
} from '../controllers/admin.controller';
import { authenticate, adminOnly } from '../middlewares/auth';

const router = Router();
<<<<<<< HEAD
router.use(authenticate, adminOnly); // tất cả route admin đều yêu cầu Admin

router.get('/stats',              getStats);
router.get('/users',              listUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/listings',           listAllProducts);
router.delete('/listings/:id',    adminDeleteProduct);
=======
router.use(authenticate, adminOnly);

router.get('/stats',                getStats);
router.get('/users',                listUsers);
router.patch('/users/:id/toggle',   toggleUser);
router.patch('/users/:id/verify',   verifyUser);   // ← MỚI
router.get('/listings',             listAllProducts);
router.delete('/listings/:id',      adminDeleteProduct);
>>>>>>> origin/main

export default router;
