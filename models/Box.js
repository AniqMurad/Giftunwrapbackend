// models/Box.js
import mongoose from 'mongoose';

const boxSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    size: { type: String, required: true }, // e.g., "15cm x 15cm x 10cm"
    price: { type: Number, required: true },
    capacity: { type: String, required: true }, // e.g., "3-5 items"
    image: { type: String, required: true },
    color: { type: String, default: '#F5DEB3' },
    description: { type: String },
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
boxSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Box = mongoose.model('Box', boxSchema);
export default Box;
