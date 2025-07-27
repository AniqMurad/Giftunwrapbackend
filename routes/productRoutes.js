// routes/productRoutes.js
import express from 'express';
import {
    getAllProducts,
    createProductCategory,
    deleteProductById,
    addProductReview,
    getAllReviews,      
    deleteProductReview, 
    deleteAllProducts,
    updateProductById,
} from '../controllers/productController.js';
import upload from '../middleware/upload.js'; 

const router = express.Router();

// gets all reviews on admin portal
router.get('/reviews', getAllReviews);

// gets all products on admin portal
router.get('/', getAllProducts);

router.delete('/delete', deleteAllProducts);

// posting a product category with images on admin portal
router.post('/multipleproductcategory', upload.array('images', 4), createProductCategory);

// deleting a product by id from admin portal
router.delete('/:id', deleteProductById);

router.put('/:id', upload.array('images', 4), updateProductById);

// posting review API from order history page
router.post('/:productId/reviews', addProductReview);

// deleting any review from admin portal
router.delete('/reviews/:reviewId', deleteProductReview);

export default router;