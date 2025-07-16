import Product from "../models/Product.js";
import mongoose from "mongoose";
import User from "../models/User.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}; */

/* export const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}; */

// Create a new product
/* export const createProduct = async (req, res) => {
    const { name, description, price, image, category, tags } = req.body;

    const newProduct = new Product({
        category,
        products: [{
            name, price, keyGift, subcategory, images, shortDescription, longDescription
        }]
    });

    try {
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}; */

export const deleteAllProducts = async (req, res) => {
    try {
        await Product.deleteMany({});
        res.status(200).send("All products deleted");
    } catch (error) {
        res.status(500).send("Error deleting products");
    }
};

/* export const createMultipleProducts = async (req, res) => {
    const products = req.body.products;

    try {
        const result = await Product.insertMany(products);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}; */

export const createProductCategory = async (req, res) => {
    try {
        const { category } = req.body;
        const productData = JSON.parse(req.body.products)[0];

        const uploadedUrls = req.files.map((file) => file.path);

        productData.images = uploadedUrls;

        const existingCategory = await Product.findOne({ category });

        if (existingCategory) {
            existingCategory.products.push(productData);
            await existingCategory.save();
            return res
                .status(200)
                .json({
                    message: "Product added to existing category",
                    data: existingCategory,
                });
        }

        const newCategory = new Product({
            category,
            products: [productData],
        });

        await newCategory.save();
        res
            .status(201)
            .json({
                message: "New category created with product",
                data: newCategory,
            });
    } catch (err) {
        console.error("Upload error:", err);
        res
            .status(500)
            .json({ message: "Failed to upload product", error: err.message });
    }
};

export const deleteProductById = async (req, res) => {
    const productId = req.params.id;
    try {
        const categoryDoc = await Product.findOne({ "products._id": productId });

        if (!categoryDoc) {
            return res.status(404).json({ message: "Product not found" });
        }

        categoryDoc.products = categoryDoc.products.filter(
            (p) => p._id.toString() !== productId
        );

        await categoryDoc.save();

        res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addProductReview = async (req, res) => {
    const { productId } = req.params;
    const { userId, rating, comment } = req.body;

    console.log("Received productId (NUMERIC):", productId);
    console.log("Received userId:", userId);
    console.log("Received rating:", rating);
    console.log("Received comment:", comment);

    const numericProductId = Number(productId);

    if (isNaN(numericProductId)) {
        return res
            .status(400)
            .json({ message: "Invalid product ID format. Expected a number." });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format." });
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return res
            .status(400)
            .json({ message: "Rating must be a number between 1 and 5." });
    }
    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comment cannot be empty." });
    }

    try {
        const user = await User.findById(userId).select("name");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const categoryDoc = await Product.findOne({
            "products.id": numericProductId,
        });

        if (!categoryDoc) {
            return res
                .status(404)
                .json({ message: "Product not found in any category." });
        }

        const product = categoryDoc.products.find((p) => p.id === numericProductId);

        if (!product) {
            return res
                .status(404)
                .json({
                    message:
                        "Product not found within its category (numeric ID mismatch).",
                });
        }

        const newReview = {
            userId: new mongoose.Types.ObjectId(userId),
            rating,
            username: user.name,
            comment: comment.trim(),
            createdAt: new Date(),
        };

        product.reviews.push(newReview);

        await categoryDoc.save();

        res
            .status(201)
            .json({ message: "Review added successfully!", review: newReview });
    } catch (err) {
        console.error("Error adding review:", err);
        res
            .status(500)
            .json({ message: "Failed to add review", error: err.message });
    }
};

export const getAllReviews = async (req, res) => {
    try {
        console.log("Fetching all products...");
        const allProducts = await Product.find({});
        console.log(`Found ${allProducts.length} product categories.`);

        let allReviews = [];
        for (const categoryDoc of allProducts) {
            console.log(`Processing category: ${categoryDoc.category}`);
            for (const product of categoryDoc.products) {
                console.log(`Processing product: ${product.name} (ID: ${product.id})`);
                if (product.reviews && product.reviews.length > 0) {
                    console.log(
                        `Found ${product.reviews.length} reviews for this product.`
                    );
                    for (const review of product.reviews) {
                        console.log(
                            `Attempting to fetch user for review ID: ${review._id}`
                        );
                        const user = await User.findById(review.userId).select(
                            "name email"
                        );
                        console.log(`User fetched: ${user ? user.email : "None"}`);
                        allReviews.push({
                            _id: review._id,
                            productId: product.id,
                            productName: product.name,
                            productCategory: categoryDoc.category,
                            userId: review.userId,
                            rating: review.rating,
                            comment: review.comment,
                            createdAt: review.createdAt,
                            user: user ? { name: user.name, email: user.email } : null,
                        });
                    }
                }
            }
        }
        console.log(`Total reviews collected: ${allReviews.length}`);
        res.status(200).json(allReviews);
    } catch (err) {
        console.error("SERVER ERROR fetching all reviews:", err);
        console.error("❌ Error in getAllReviews:", error);
        res
            .status(500)
            .json({
                message: "Failed to fetch reviews",
                error: err.message,
                stack: err.stack,
            }); // Include stack for debugging
    }
};

export const deleteProductReview = async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID format." });
    }

    try {
        const categoryDoc = await Product.findOne({
            "products.reviews._id": new mongoose.Types.ObjectId(reviewId),
        });

        if (!categoryDoc) {
            return res
                .status(404)
                .json({ message: "Review not found in any product." });
        }

        let productFound = false;
        for (const product of categoryDoc.products) {
            const reviewIndex = product.reviews.findIndex(
                (r) => r._id.toString() === reviewId
            );
            if (reviewIndex > -1) {
                product.reviews.splice(reviewIndex, 1);
                productFound = true;

                product.numReviews = product.reviews.length;
                if (product.reviews.length > 0) {
                    product.rating =
                        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                        product.reviews.length;
                } else {
                    product.rating = 0;
                }

                break;
            }
        }

        if (!productFound) {
            return res
                .status(404)
                .json({
                    message:
                        "Review found in category, but not in product list. (Internal error)",
                });
        }

        await categoryDoc.save();

        res.status(200).json({ message: "Review deleted successfully!" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res
            .status(500)
            .json({ message: "Failed to delete review", error: error.message });
    }
};
