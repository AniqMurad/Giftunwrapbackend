// models/Order.js
import mongoose from 'mongoose';

const shippingAddressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    additionalInfo: { type: String }
});

const orderItemSchema = new mongoose.Schema({
    productCategory: { type: String, required: true },
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtTimeOfOrder: { type: Number, required: true }, 
    imageUrl: { type: String } 
});

const paymentDetailsSchema = new mongoose.Schema({
    method: { type: String, required: true, enum: ['creditCard', 'cod'] },
    cardName: { type: String },
    saveCardDetails: { type: Boolean, default: false } 
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentDetails: { type: paymentDetailsSchema, required: true },
    orderItems: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;