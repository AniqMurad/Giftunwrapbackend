// models/Product.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const productSchema = new mongoose.Schema({
    category: { type: String, required: true },
    products: [
        {
            id: { type: Number, required: true }, 
            name: { type: String, required: true },
            price: { type: Number, required: true },
            originalPrice: { type: Number },
            discount: { type: Number },
            keyGift: { type: String, required: true },
            subcategory: { type: String, default: null },
            images: [{ type: String }],
            shortDescription: { type: String },
            longDescription: { type: String },
            reviews: [reviewSchema] 
        }
    ]
});

const Product = mongoose.model('Product', productSchema);
export default Product;