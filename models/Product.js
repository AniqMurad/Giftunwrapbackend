import mongoose from 'mongoose';

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
        }
    ]
});

const Product = mongoose.model('Product', productSchema);
export default Product;
