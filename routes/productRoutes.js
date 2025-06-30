// routes/productRoutes.js
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
    addProductReview,
    getAllReviews,      
    deleteProductReview, 
} from '../controllers/productController.js';
import upload from '../middleware/upload.js'; 

const router = express.Router();


router.get('/reviews', getAllReviews);
router.get('/', getAllProducts);
router.get('/:id', getProductById); 
router.get('/category/:category', getProductsByCategory);
router.post('/', createProduct);
router.delete('/delete', deleteAllProducts);
router.post('/batch', createMultipleProducts);
router.post('/multipleproductcategory', upload.array('images', 4), createProductCategory);
router.delete('/:id', deleteProductById);


router.post('/:productId/reviews', addProductReview);

router.delete('/reviews/:reviewId', deleteProductReview);

export default router;