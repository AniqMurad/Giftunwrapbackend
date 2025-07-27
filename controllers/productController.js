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

export const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.status(200).send("All products deleted");
  } catch (error) {
    res.status(500).send("Error deleting products");
  }
};

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
      return res.status(200).json({
        message: "Product added to existing category",
        data: existingCategory,
      });
    }

    const newCategory = new Product({
      category,
      products: [productData],
    });

    await newCategory.save();
    res.status(201).json({
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

export const updateProductById = async (req, res) => {
    const productId = req.params.id; // This is the MongoDB _id from the URL

    // Add robust ID validation
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error(`Invalid product ID format received for PUT: ${productId}`);
        return res.status(400).json({ message: "Invalid product ID format. Expected a valid MongoDB ObjectId." });
    }

    try {
        // Log incoming data for debugging
        console.log(`Attempting to update product with MongoDB _id: ${productId}`);
        console.log('Request Body (raw):', req.body);
        console.log('Request Files (from Multer):', req.files);

        // Find the category document that contains the product by its MongoDB _id
        const categoryDoc = await Product.findOne({ "products._id": new mongoose.Types.ObjectId(productId) });

        if (!categoryDoc) {
            console.warn(`Product with _id ${productId} not found in any category document.`);
            return res.status(404).json({ message: "Product not found in any category." });
        }

        // Find the specific product sub-document within the products array
        const productToUpdate = categoryDoc.products.find(
            (p) => p._id.toString() === productId // Compare MongoDB _id
        );

        if (!productToUpdate) {
            console.warn(`Product with _id ${productId} found in category ${categoryDoc.category}, but sub-document not matched.`);
            return res.status(404).json({ message: "Product sub-document not found within its category (internal mismatch)." });
        }

        // Parse the product data from the body
        let updatedProductData;
        try {
            // Your frontend sends products as an array stringified: formData.append('products', JSON.stringify([productData]));
            updatedProductData = JSON.parse(req.body.products)[0];
            console.log('Parsed updatedProductData:', updatedProductData);
        } catch (parseError) {
            console.error("Failed to parse product data from request body:", parseError);
            return res.status(400).json({ message: "Invalid product data format in request body. Expecting a JSON string of product array." });
        }

        // Handle image updates
        const uploadedUrls = req.files ? req.files.map((file) => file.path) : [];
        console.log('Uploaded new image URLs:', uploadedUrls);

        if (uploadedUrls.length > 0) {
            // If new images are uploaded, replace all existing images with the new ones
            productToUpdate.images = uploadedUrls;
            console.log('Images replaced with new uploads.');
        } else if (updatedProductData.images && Array.isArray(updatedProductData.images)) {
            // If no new files uploaded, but `images` field is present in updated data (for retained images)
            // This is crucial: only update if `updatedProductData.images` is explicitly sent
            // This handles cases where images are removed or retained without new uploads
            productToUpdate.images = updatedProductData.images;
            console.log('Images updated with retained images from payload, no new uploads.');
        }
        // If no new images and no images array in updatedProductData, existing images are retained by default

        // Update other product fields if they are provided in the request
        // Use `if (updatedProductData.hasOwnProperty('fieldName'))` for fields that can be empty strings or 0
        // Use `if (updatedProductData.fieldName !== undefined)` for numbers or optionals that could be 0
        if (updatedProductData.name !== undefined) productToUpdate.name = updatedProductData.name;
        if (updatedProductData.description !== undefined) productToUpdate.description = updatedProductData.description; // Note: schema has short/long description, not general 'description'
        if (updatedProductData.price !== undefined) productToUpdate.price = updatedProductData.price;
        if (updatedProductData.originalPrice !== undefined) productToUpdate.originalPrice = updatedProductData.originalPrice;
        if (updatedProductData.discount !== undefined) productToUpdate.discount = updatedProductData.discount;
        if (updatedProductData.keyGift !== undefined) productToUpdate.keyGift = updatedProductData.keyGift;
        if (updatedProductData.subcategory !== undefined) productToUpdate.subcategory = updatedProductData.subcategory;
        if (updatedProductData.shortDescription !== undefined) productToUpdate.shortDescription = updatedProductData.shortDescription;
        if (updatedProductData.longDescription !== undefined) productToUpdate.longDescription = updatedProductData.longDescription;
        if (updatedProductData.brand !== undefined) productToUpdate.brand = updatedProductData.brand;
        if (updatedProductData.countInStock !== undefined) productToUpdate.countInStock = updatedProductData.countInStock;

        // Ensure the custom numeric 'id' is NOT updated here unless it's explicitly intended.
        // It should generally remain static once assigned.
        // If the frontend sends an 'id' and you want to use it for internal linking,
        // it should probably be `productToUpdate.id = updatedProductData.id;`
        // but avoid changing it after creation if it's meant to be a unique identifier.
        // For now, assume it's stable after creation and doesn't need to be updated.

        await categoryDoc.save();
        console.log(`Product ${productId} updated successfully.`);

        res.status(200).json({
            message: "Product updated successfully!",
            data: productToUpdate,
        });

    } catch (error) {
        console.error("Error updating product (catch block):", error);
        res.status(500).json({ message: "Failed to update product", error: error.message, stack: error.stack });
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
      return res.status(404).json({
        message: "Product not found within its category (numeric ID mismatch).",
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
    res.status(500).json({
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
      return res.status(404).json({
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