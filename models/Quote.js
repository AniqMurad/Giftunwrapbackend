import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  additionalRequirements: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'quoted', 'closed'],
    default: 'pending',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
quoteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Quote = mongoose.model('Quote', quoteSchema);

export default Quote;
