// models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
    },
    // NEW FIELD: To store the category of the product
    productCategory: {
        type: String, // Assuming category names are strings
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the unique index to include productCategory
// This ensures a user can only review a specific product within a specific category once.
reviewSchema.index({ productId: 1, productCategory: 1, user: 1 }, { unique: true });
// If you want to allow a user to review the *same* numeric ID product in *different* categories,
// but only once per category for that product, this index works.

const Review = mongoose.model('Review', reviewSchema);
export default Review;