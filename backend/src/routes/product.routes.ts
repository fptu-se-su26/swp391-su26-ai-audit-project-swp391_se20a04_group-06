import { Router } from 'express';
import {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getMyProducts,
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/',          getProducts);           // Public — có thể lọc GPS
router.get('/my',        authenticate, getMyProducts);   // Dashboard seller
router.get('/:id',       getProductById);        // Public
router.post('/',         authenticate, createProduct);
router.put('/:id',       authenticate, updateProduct);
router.delete('/:id',    authenticate, deleteProduct);

export default router;
