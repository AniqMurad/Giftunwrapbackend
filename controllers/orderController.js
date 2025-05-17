// controllers/orderController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = async (req, res) => {
    try {
        const {
            shippingInfo,
            paymentMethod,
            cardDetails,
            orderItems 
        } = req.body;

        if (!shippingInfo || !paymentMethod || !orderItems || orderItems.length === 0) {
             res.status(400).json({ message: 'Missing required order data (shipping, payment, or items).' });
             return;
        }
         if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.street || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.country || !shippingInfo.state) {
             res.status(400).json({ message: 'Missing required shipping information fields.' });
             return;
        }

        let calculatedSubtotal = 0;
        const itemsForDatabase = [];

        for (const item of orderItems) {
            if (!item.category || item.id === undefined || !item.quantity || item.price === undefined) {
                 res.status(400).json({ message: `Invalid item data provided.` });
                 return;
            }
            if (item.quantity <= 0) {
                 res.status(400).json({ message: `Invalid quantity for item ${item.name}` });
                 return;
            }

            const productCategoryDoc = await Product.findOne({ category: item.category });

            if (!productCategoryDoc) {
                 res.status(404).json({ message: `Product category "${item.category}" not found.` });
                 return;
            }

            const product = productCategoryDoc.products.find(p => p.id === item.id);

            if (!product) {
                res.status(404).json({ message: `Product with ID ${item.id} in category "${item.category}" not found.` });
                return;
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
                 
                 res.status(400).json({ message: 'Missing required credit card details.' });
                 return;
             }
            console.log("Processing Credit Card Payment (Placeholder):", cardDetails);
           
        } else if (paymentMethod === 'cod') {
        } else {
             res.status(400).json({ message: 'Invalid payment method specified.' });
             return;
        }

        const order = new Order({
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
        const orders = await Order.find({})

        res.json(orders);

    } catch (error) {
        console.error("Error fetching all orders:", error);

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};