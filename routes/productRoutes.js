import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  deleteAllProducts,
  createMultipleProducts,
  createProductCategory,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/category/:category', getProductsByCategory); 
router.post('/', createProduct);
router.post('/delete', deleteAllProducts); 
router.post('/batch', createMultipleProducts);
router.post('/multipleproductcategory', createProductCategory); // Create a new category

export default router;
