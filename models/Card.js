// models/Card.js
import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    design: { type: String, required: true }, // e.g., "Happy Birthday", "Thank You"
    image: { type: String, required: true },
    color: { type: String, default: '#F5F5F5' },
    description: { type: String },
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
cardSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Card = mongoose.model('Card', cardSchema);
export default Card;
