import mongoose from 'mongoose';

const giftBoxCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }
}, { timestamps: true });

export default mongoose.model('GiftBoxCategory', giftBoxCategorySchema);
