// controllers/orderController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = async (req, res) => {
    try {
        const {
            userId,               // <-- Add this here
            shippingInfo,
            paymentMethod,
            cardDetails,
            orderItems
        } = req.body;

        /* if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        } */

        if (!shippingInfo || !paymentMethod || !orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'Missing required order data (shipping, payment, or items).' });
        }
        if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.street || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.country || !shippingInfo.state) {
            return res.status(400).json({ message: 'Missing required shipping information fields.' });
        }

        let calculatedSubtotal = 0;
        const itemsForDatabase = [];

        for (const item of orderItems) {
            if (!item.category || item.id === undefined || !item.quantity || item.price === undefined) {
                return res.status(400).json({ message: `Invalid item data provided.` });
            }
            if (item.quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity for item ${item.name}` });
            }

            const productCategoryDoc = await Product.findOne({ category: item.category });
            if (!productCategoryDoc) {
                return res.status(404).json({ message: `Product category "${item.category}" not found.` });
            }

            const product = productCategoryDoc.products.find(p => p.id === item.id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.id} in category "${item.category}" not found.` });
            }

            const itemPrice = product.price;
            if (item.price !== itemPrice) {
                console.warn(`Price mismatch for item ${item.name} (ID: ${item.id}). Frontend: ${item.price}, Backend: ${itemPrice}`);
            }

            calculatedSubtotal += itemPrice * item.quantity;

            itemsForDatabase.push({
                productCategory: item.category,
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                priceAtTimeOfOrder: itemPrice,
                imageUrl: product.images && product.images.length > 0 ? product.images[0] : null
            });
        }

        const calculatedShippingCost = calculatedSubtotal > 0 ? (calculatedSubtotal >= 130 ? 0 : 15) : 0;
        const calculatedDiscountAmount = 0;
        const calculatedTotalAmount = calculatedSubtotal + calculatedShippingCost - calculatedDiscountAmount;

        if (paymentMethod === 'creditCard') {
            if (!cardDetails || !cardDetails.cardName || !cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvv) {
                return res.status(400).json({ message: 'Missing required credit card details.' });
            }
            console.log("Processing Credit Card Payment (Placeholder):", cardDetails);
        } else if (paymentMethod === 'cod') {
        } else {
            return res.status(400).json({ message: 'Invalid payment method specified.' });
        }

        const order = new Order({
            ...(userId && { user: userId }), // Only attach if provided
            shippingAddress: shippingInfo,
            paymentDetails: {
                method: paymentMethod,
                cardName: paymentMethod === 'creditCard' ? cardDetails.cardName : undefined,
                saveCardDetails: paymentMethod === 'creditCard' ? cardDetails.saveCardDetails : undefined,
            },
            orderItems: itemsForDatabase,
            subtotal: calculatedSubtotal,
            shippingCost: calculatedShippingCost,
            discountAmount: calculatedDiscountAmount,
            totalAmount: calculatedTotalAmount,
            status: paymentMethod === 'creditCard' ? 'processing' : 'pending'
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: 'Failed to create order.', error: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const { userId } = req.query;  // optionally pass userId as query param

        let orders;
        if (userId) {
            orders = await Order.find({ user: userId });
        } else {
            orders = await Order.find({});
        }

        res.json(orders);

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete order.', error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate the incoming status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid or missing status provided.' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status: status },
            { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures enum validation
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Failed to update order status.', error: error.message });
    }
};
