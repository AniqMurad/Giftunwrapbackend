import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  deleteAllProducts,
  createMultipleProducts,
  createProductCategory,
  deleteProductById,
  // searchProducts,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/category/:category', getProductsByCategory); 
router.post('/', createProduct);
router.delete('/delete', deleteAllProducts);
router.post('/batch', createMultipleProducts);
router.post('/multipleproductcategory', createProductCategory); 
router.delete('/:id', deleteProductById);
// router.get('/search/query', searchProducts);

export default router;
