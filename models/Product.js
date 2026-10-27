// models/Product.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: { type: String },
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

const whatsInsideItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 1 },
    description: { type: String, trim: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true },
    products: [
        {
            id: { type: Number, required: true }, 
            name: { type: String, required: true },
            price: { type: Number, required: true },
            originalPrice: { type: Number },
            discount: { type: Number },
            keyGift: {
                type: [String],
                required: true,
                validate: {
                    validator: (values) => Array.isArray(values) && values.length > 0,
                    message: 'At least one key gift is required'
                }
            },
            subcategory: { type: String, default: null },
            images: [{ type: String }],
            shortDescription: { type: String },
            longDescription: { type: String },
            metaTitle: { type: String },
            metaDescription: { type: String },
            whatsInside: { type: [whatsInsideItemSchema], default: [] },
            reviews: [reviewSchema] 
        }
    ]
});

const Product = mongoose.model('Product', productSchema);
export default Product;
