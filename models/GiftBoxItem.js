// models/GiftBoxItem.js
import mongoose from 'mongoose';

const giftBoxItemSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        required: true,
        enum: [
            'chocolates-snacks',
            'flowers',
            'customised-items',
            'jewellery-accessories',
            'fragrances',
            'clothing',
            'shoes',
            'beauty-personal-care'
        ]
    },
    image: { type: String, required: true },
    description: { type: String },
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
giftBoxItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const GiftBoxItem = mongoose.model('GiftBoxItem', giftBoxItemSchema);
export default GiftBoxItem;
