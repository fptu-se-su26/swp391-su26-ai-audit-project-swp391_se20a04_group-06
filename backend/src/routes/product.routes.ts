import { Router } from 'express';
import {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getMyProducts, bumpProduct,
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.get('/',               getProducts);
router.get('/my',             authenticate, getMyProducts);
router.get('/:id',            getProductById);
router.post('/',              authenticate, createProduct);
router.put('/:id',            authenticate, updateProduct);
router.delete('/:id',         authenticate, deleteProduct);
router.post('/:id/bump',      authenticate, bumpProduct);
export default router;
