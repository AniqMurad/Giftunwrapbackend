// controllers/reviewController.js
import Review from '../models/Review.js';
import User from '../models/User.js';
// Make sure to import Product if you need to fetch product details based on category and ID
// import Product from '../models/Product.js'; // You might need this if you want to validate product existence

export const createReview = async (req, res) => {
    // UPDATED: Destructure productCategory from req.body
    const { productId, productCategory, userId, comment } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid Product ID format. Must be a number.' });
    }
    // NEW VALIDATION: productCategory is required
    if (!productCategory || productCategory.trim() === '') {
        return res.status(400).json({ message: 'Product category is required.' });
    }
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'Comment cannot be empty.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Validate that the product exists in the specified category (OPTIONAL but RECOMMENDED)
        // You would need to import the Product model for this
        /*
        const productExists = await Product.findOne({
            category: productCategory,
            'products.id': productId
        });
        if (!productExists) {
            return res.status(404).json({ message: `Product with ID ${productId} in category '${productCategory}' not found.` });
        }
        */

        // UPDATED: Check for existing review by productId, productCategory, and user
        const existingReview = await Review.findOne({ productId, productCategory, user: userId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already submitted a review for this product in this category.' });
        }

        const newReview = new Review({
            productId: productId,
            productCategory: productCategory, // NEW: Save productCategory
            user: userId,
            comment: comment
        });

        const createdReview = await newReview.save();
        res.status(201).json(createdReview);

    } catch (error) {
        console.error('Error creating review:', error);
        if (error.code === 11000) { // Duplicate key error from the unique index
            return res.status(400).json({ message: 'You have already submitted a review for this product in this category.' });
        }
        res.status(500).json({ message: 'Server error while creating review.', error: error.message });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        // We now need both productId and productCategory to get specific reviews
        // However, your frontend's Admin Portal is only sending productId currently.
        // So, this endpoint needs to be flexible or you need to decide how the Admin Portal will query.

        // OPTION 1: Admin Portal sends productId and productCategory
        // If the Admin Portal will send the product category as well (e.g., /api/reviews/:productId/:productCategory)
        // const { productId, productCategory } = req.params;
        // const reviews = await Review.find({ productId: parseInt(productId), productCategory }).sort({ createdAt: -1 }).populate('user', 'username');

        // OPTION 2: If the Admin Portal only sends productId, then it will still show reviews for all categories.
        // To fix this for the Admin Portal, it will need to know which category it's currently displaying for.
        // Let's assume the Admin Portal fetches *all* products first (which it does), and then for each product,
        // it fetches reviews. To make it accurate, the Admin Portal's review fetch needs to include category.

        // FOR NOW, let's keep getProductReviews general, but understand its limitation if ONLY productId is sent.
        // The most robust solution would be to query by both productId and productCategory.

        const productId = parseInt(req.params.productId); // This is still what the Admin Portal sends

        if (isNaN(productId)) {
            return res.status(400).json({ message: 'Invalid Product ID format.' });
        }

        // If you want to show ALL reviews for a given productId across ALL categories in the admin, this is fine.
        // But if you want reviews specific to the *category* being displayed, the admin portal needs to pass the category too.
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).populate('user', 'username');
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Server error while fetching reviews.', error: error.message });
    }
};