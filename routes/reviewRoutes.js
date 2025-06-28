// routes/reviewRoutes.js (Example - adjust as per your actual file)
import express from 'express';
import { createReview, getProductReviews } from '../controllers/reviewController.js';
// import { protect, authorize } from '../middleware/authMiddleware.js'; // If you have auth middleware

const router = express.Router();

// Route for creating a review (still POST to /api/reviews/)
router.post('/', createReview);

// Route for getting product reviews
// UPDATED ROUTE: Now expects both productId and productCategory in the URL
router.get('/:productId/:productCategory', getProductReviews); // NEW ROUTE PARAMETERS

export default router;