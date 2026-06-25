import { Router } from 'express';
import {
  getProducts, getProductById, createProduct,
<<<<<<< HEAD
  updateProduct, deleteProduct, getMyProducts,
=======
  updateProduct, deleteProduct, getMyProducts, bumpProduct,
>>>>>>> origin/main
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
<<<<<<< HEAD

router.get('/',          getProducts);           // Public — có thể lọc GPS
router.get('/my',        authenticate, getMyProducts);   // Dashboard seller
router.get('/:id',       getProductById);        // Public
router.post('/',         authenticate, createProduct);
router.put('/:id',       authenticate, updateProduct);
router.delete('/:id',    authenticate, deleteProduct);

=======
router.get('/',               getProducts);
router.get('/my',             authenticate, getMyProducts);
router.get('/:id',            getProductById);
router.post('/',              authenticate, createProduct);
router.put('/:id',            authenticate, updateProduct);
router.delete('/:id',         authenticate, deleteProduct);
router.post('/:id/bump',      authenticate, bumpProduct);
>>>>>>> origin/main
export default router;
