// controllers/orderController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import GiftBoxItem from "../models/GiftBoxItem.js";
import Box from "../models/Box.js";
import sendOrderEmail from "../utils/sendOrderEmail.js";

export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      shippingInfo,
      paymentMethod,
      cardDetails,
      orderItems,
      giftBoxOrder, // Flag to indicate if this is a gift box order
      selectedBox,
      selectedCard,
      cardMessage,
    } = req.body;

    if (
      !shippingInfo ||
      !paymentMethod ||
      !orderItems ||
      orderItems.length === 0
    ) {
      return res
        .status(400)
        .json({
          message: "Missing required order data (shipping, payment, or items).",
        });
    }
    if (
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.street ||
      !shippingInfo.city ||
      !shippingInfo.postalCode ||
      !shippingInfo.country ||
      !shippingInfo.state
    ) {
      return res
        .status(400)
        .json({ message: "Missing required shipping information fields." });
    }

    let calculatedSubtotal = 0;
    const itemsForDatabase = [];
    let verifiedSelectedBox = null;
    let verifiedSelectedCard = null;

    // Handle gift box orders differently
    if (giftBoxOrder) {
      const giftBoxItemIds = orderItems.map((item) => item.id);
      const giftBoxItemDocs = await GiftBoxItem.find({
        id: { $in: giftBoxItemIds },
      }).lean();
      const giftBoxItemsById = new Map(
        giftBoxItemDocs.map((doc) => [doc.id, doc])
      );

      for (const item of orderItems) {
        if (
          item.id === undefined ||
          !item.quantity ||
          item.price === undefined
        ) {
          return res.status(400).json({ message: `Invalid item data provided.` });
        }
        if (item.quantity <= 0) {
          return res
            .status(400)
            .json({ message: `Invalid quantity for item ${item.name}` });
        }

        // Verify gift box item exists
        const giftBoxItem = giftBoxItemsById.get(item.id);
        if (!giftBoxItem) {
          return res
            .status(404)
            .json({
              message: `Gift box item with ID ${item.id} not found.`,
            });
        }

        const itemPrice = giftBoxItem.price;
        calculatedSubtotal += itemPrice * item.quantity;

        itemsForDatabase.push({
          productCategory: 'giftbox-item',
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          priceAtTimeOfOrder: itemPrice,
          imageUrl: item.image || giftBoxItem.image,
        });
      }

      if (!selectedBox?.id) {
        return res.status(400).json({ message: "A gift box selection is required." });
      }

      const box = await Box.findOne({ id: Number(selectedBox.id), inStock: true }).lean();
      if (!box) {
        return res.status(404).json({ message: "The selected gift box is unavailable." });
      }

      const requestedSize = String(selectedBox.selectedSize || selectedBox.size || "").toLowerCase();
      const variants = Array.isArray(box.sizeVariants) ? box.sizeVariants : [];
      const selectedVariant = variants.length
        ? variants.find((variant) => variant.size === requestedSize)
        : { size: box.size, price: box.price, capacity: Number.parseInt(box.capacity, 10) };

      if (!selectedVariant) {
        return res.status(400).json({ message: "Choose a valid gift box size." });
      }

      const selectedCapacity = Number(selectedVariant.capacity);
      const selectedItemCount = orderItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
      if (Number.isFinite(selectedCapacity) && selectedItemCount > selectedCapacity) {
        return res.status(400).json({ message: "The selected gift box size is too small for these items." });
      }

      calculatedSubtotal += Number(selectedVariant.price);
      verifiedSelectedBox = {
        id: box.id,
        name: box.name,
        size: String(selectedVariant.size).replace(/^./, (character) => character.toUpperCase()),
        capacity: selectedCapacity,
        price: Number(selectedVariant.price),
        image: box.image,
      };

      if (selectedCard) {
        const isCatalogueCard = selectedCard.source === "product" || selectedCard.productCategory === "greetingCards";
        if (isCatalogueCard) {
          const productCategory = selectedCard.productCategory || "greetingCards";
          const cardCollection = await Product.findOne({ category: productCategory }).lean();
          const cardProduct = cardCollection?.products?.find((product) => product.id === Number(selectedCard.id));
          if (!cardProduct) {
            return res.status(404).json({ message: "The selected greeting card is unavailable." });
          }

          const cardPrice = Number(cardProduct.price) || 0;
          calculatedSubtotal += cardPrice;
          verifiedSelectedCard = {
            id: cardProduct.id,
            name: cardProduct.name,
            design: cardProduct.subcategory || "Greeting card",
            image: cardProduct.images?.[0],
            price: cardPrice,
            source: "product",
            productCategory,
          };
        } else {
          verifiedSelectedCard = {
            id: selectedCard.id,
            name: selectedCard.name,
            design: selectedCard.design,
            image: selectedCard.image,
            price: 0,
            source: "builder-card",
          };
        }
      }
    } else {
      // Regular product order
      const productCategories = [
        ...new Set(orderItems.map((item) => item.category)),
      ];
      const productCategoryDocs = await Product.find({
        category: { $in: productCategories },
      }).lean();
      const productCategoryDocsByCategory = new Map(
        productCategoryDocs.map((doc) => [doc.category, doc])
      );

      for (const item of orderItems) {
        if (
          !item.category ||
          item.id === undefined ||
          !item.quantity ||
          item.price === undefined
        ) {
          return res.status(400).json({ message: `Invalid item data provided.` });
        }
        if (item.quantity <= 0) {
          return res
            .status(400)
            .json({ message: `Invalid quantity for item ${item.name}` });
        }

        const productCategoryDoc = productCategoryDocsByCategory.get(
          item.category
        );
        if (!productCategoryDoc) {
          return res
            .status(404)
            .json({ message: `Product category "${item.category}" not found.` });
        }

        const product = productCategoryDoc.products.find((p) => p.id === item.id);
        if (!product) {
          return res
            .status(404)
            .json({
              message: `Product with ID ${item.id} in category "${item.category}" not found.`,
            });
        }

        const itemPrice = product.price;
        if (item.price !== itemPrice) {
          console.warn(
            `Price mismatch for item ${item.name} (ID: ${item.id}). Frontend: ${item.price}, Backend: ${itemPrice}`
          );
        }

        calculatedSubtotal += itemPrice * item.quantity;

        itemsForDatabase.push({
          productCategory: item.category,
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          priceAtTimeOfOrder: itemPrice,
          imageUrl:
            product.images && product.images.length > 0
              ? product.images[0]
              : null,
        });
      }
    }

    const calculatedShippingCost =
      calculatedSubtotal > 0 ? (calculatedSubtotal >= 10000 ? 0 : 350) : 0;
    const calculatedDiscountAmount = 0;
    const calculatedTotalAmount =
      calculatedSubtotal + calculatedShippingCost - calculatedDiscountAmount;

    if (paymentMethod === "creditCard") {
      if (
        !cardDetails ||
        !cardDetails.cardName ||
        !cardDetails.cardNumber ||
        !cardDetails.expiry ||
        !cardDetails.cvv
      ) {
        return res
          .status(400)
          .json({ message: "Missing required credit card details." });
      }
      console.log("Processing Credit Card Payment (Placeholder):", cardDetails);
    } else if (paymentMethod === "cod") {
    } else {
      return res
        .status(400)
        .json({ message: "Invalid payment method specified." });
    }

    const orderData = {
      ...(userId && { user: userId }),
      shippingAddress: shippingInfo,
      paymentDetails: {
        method: paymentMethod,
        cardName:
          paymentMethod === "creditCard" ? cardDetails.cardName : undefined,
        saveCardDetails:
          paymentMethod === "creditCard"
            ? cardDetails.saveCardDetails
            : undefined,
      },
      orderItems: itemsForDatabase,
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShippingCost,
      discountAmount: calculatedDiscountAmount,
      totalAmount: calculatedTotalAmount,
      status: paymentMethod === "creditCard" ? "processing" : "pending",
    };

    // Add gift box specific fields if it's a gift box order
    if (giftBoxOrder) {
      orderData.isGiftBox = true;
      if (verifiedSelectedBox) {
        orderData.selectedBox = verifiedSelectedBox;
      }
      if (verifiedSelectedCard) {
        orderData.selectedCard = verifiedSelectedCard;
      }
      if (cardMessage) {
        orderData.cardMessage = cardMessage;
      }
    }

    const order = new Order(orderData);

    const createdOrder = await order.save();
    try {
      await sendOrderEmail(
        shippingInfo.email,
        shippingInfo.firstName,
        createdOrder._id,
        createdOrder.orderItems,
        createdOrder.totalAmount
      );
      console.log(`Confirmation email sent to ${shippingInfo.email}`);
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
    }
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order.", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { userId } = req.query; // optionally pass userId as query param

    let orders;
    if (userId) {
      orders = await Order.find({ user: userId }).lean();
    } else {
      orders = await Order.find({}).lean();
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete order.", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the incoming status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing status provided." });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures enum validation
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({
        message: "Failed to update order status.",
        error: error.message,
      });
  }
};
