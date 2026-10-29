import Product from "../models/Product.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import GiftBoxItem from "../models/GiftBoxItem.js";
import { getNextProductId } from "../utils/getNextProductId.js";
import Counter from "../models/Counter.js";

const MAX_PRODUCT_IMAGES = 10;

const normalizeSizeOptions = (values, fallbackPrice) => {
    const normalizedFallback = Number(fallbackPrice);
    const byName = new Map();

    (Array.isArray(values) ? values : []).forEach((entry) => {
        const source = typeof entry === "string" ? { name: entry } : (entry || {});
        const name = String(source.name || source.size || "").trim();
        if (!name) return;
        const requestedPrice = Number(source.price);
        const price = Number.isFinite(requestedPrice) && requestedPrice > 0
            ? requestedPrice
            : normalizedFallback;
        if (!Number.isFinite(price) || price <= 0) return;
        byName.set(name.toLowerCase(), { name, price });
    });

    return [...byName.values()];
};

const normalizeHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || "").trim())
    ? String(value).trim().toUpperCase()
    : "#000000";

const normalizeColorOptions = (values, images = []) => {
    const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [];
    const byName = new Map();

    (Array.isArray(values) ? values : []).forEach((entry) => {
        const source = typeof entry === "string" ? { name: entry } : (entry || {});
        const name = String(source.name || source.color || "").trim();
        if (!name) return;

        const requestedImage = String(source.image || "").trim();
        const hasRequestedIndex = source.imageIndex !== "" && source.imageIndex !== null && source.imageIndex !== undefined;
        const requestedIndex = Number(source.imageIndex);
        const image = requestedImage && normalizedImages.includes(requestedImage)
            ? requestedImage
            : hasRequestedIndex && Number.isInteger(requestedIndex) && requestedIndex >= 0
                ? normalizedImages[requestedIndex] || ""
                : "";

        byName.set(name.toLowerCase(), {
            name,
            hex: normalizeHex(source.hex),
            ...(image ? { image } : {}),
        });
    });

    return [...byName.values()];
};

const normalizeProductOptions = (product, images = product.images) => {
    product.sizeOptions = normalizeSizeOptions(product.sizeOptions, product.price);
    product.colorOptions = normalizeColorOptions(product.colorOptions, images);
    product.showSizeOptions = Boolean(product.showSizeOptions && product.sizeOptions.length);
    product.showColorOptions = Boolean(product.showColorOptions && product.colorOptions.length);
    return product;
};

const getUploadedFiles = (files, fieldName) => {
    if (Array.isArray(files)) return files.filter((file) => file.fieldname === fieldName);
    return Array.isArray(files?.[fieldName]) ? files[fieldName] : [];
};

const applyWhatsInsideImageUploads = (items, files) => (Array.isArray(items) ? items : []).map((item, index) => {
    const uploadedImage = getUploadedFiles(files, `whatsInsideImage_${index}`)[0];
    return uploadedImage
        ? { ...item, image: uploadedImage.path, imageOverride: true }
        : item;
});

const giftBoxItemSnapshot = (item, storedItem = {}) => ({
    giftBoxItemId: item.id,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
    image: storedItem.imageOverride && storedItem.image ? storedItem.image : item.image,
    ...(storedItem.imageOverride && storedItem.image ? { imageOverride: true } : {}),
});

const legacyWhatsInsideItem = (item) => {
    const name = String(item?.name || "").trim();
    if (!name) return null;
    return {
        name,
        ...(String(item?.description || "").trim() ? { description: String(item.description).trim() } : {}),
        ...(typeof item?.image === "string" && item.image.trim() ? { image: item.image.trim() } : {}),
        ...(item?.imageOverride === true ? { imageOverride: true } : {}),
    };
};

const resolveWhatsInsideItems = async (items) => {
    if (!Array.isArray(items)) return { items: [], missingIds: [] };

    const requestedIds = [...new Set(items
        .map((item) => Number(item?.giftBoxItemId))
        .filter((id) => Number.isInteger(id) && id > 0))];
    const catalogueItems = requestedIds.length
        ? await GiftBoxItem.find({ id: { $in: requestedIds } }).lean()
        : [];
    const catalogueById = new Map(catalogueItems.map((item) => [item.id, item]));
    const missingIds = requestedIds.filter((id) => !catalogueById.has(id));

    const resolvedItems = items.flatMap((item) => {
        const giftBoxItemId = Number(item?.giftBoxItemId);
        if (Number.isInteger(giftBoxItemId) && giftBoxItemId > 0) {
            const catalogueItem = catalogueById.get(giftBoxItemId);
            return catalogueItem ? [giftBoxItemSnapshot(catalogueItem, item)] : [];
        }
        const legacyItem = legacyWhatsInsideItem(item);
        return legacyItem ? [legacyItem] : [];
    });

    return { items: resolvedItems, missingIds };
};

const hydrateProductContents = async (categoryDocuments) => {
    const giftBoxItemIds = [...new Set(categoryDocuments.flatMap((category) =>
        (category.products || []).flatMap((product) =>
            (product.whatsInside || [])
                .map((item) => Number(item.giftBoxItemId))
                .filter((id) => Number.isInteger(id) && id > 0)
        )
    ))];

    if (giftBoxItemIds.length === 0) return categoryDocuments;

    const catalogueItems = await GiftBoxItem.find({ id: { $in: giftBoxItemIds } }).lean();
    const catalogueById = new Map(catalogueItems.map((item) => [item.id, item]));

    return categoryDocuments.map((category) => ({
        ...category,
        products: (category.products || []).map((product) => ({
            ...product,
            whatsInside: (product.whatsInside || []).map((storedItem) => {
                const catalogueItem = catalogueById.get(Number(storedItem.giftBoxItemId));
                return catalogueItem ? giftBoxItemSnapshot(catalogueItem, storedItem) : storedItem;
            }),
        })),
    }));
};

export const resetProductCounter = async (req, res) => {
    try {
        await Counter.deleteOne({ name: "productId" });
        res.status(200).json({ message: "Product counter reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.json(await hydrateProductContents(products));
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

        const uploadedUrls = getUploadedFiles(req.files, "images").map((file) => file.path);
        if (uploadedUrls.length === 0) {
            return res.status(400).json({ message: "At least one product image is required." });
        }
        if (uploadedUrls.length > MAX_PRODUCT_IMAGES) {
            return res.status(400).json({ message: `A product can have up to ${MAX_PRODUCT_IMAGES} images.` });
        }
        productData.images = uploadedUrls;
        normalizeProductOptions(productData, uploadedUrls);
        productData.whatsInside = applyWhatsInsideImageUploads(productData.whatsInside, req.files);
        const resolvedContents = await resolveWhatsInsideItems(productData.whatsInside);
        if (resolvedContents.missingIds.length > 0) {
            return res.status(400).json({ message: "One or more selected Gift Box Items no longer exist." });
        }
        productData.whatsInside = resolvedContents.items;

        // ✅ AUTO GLOBAL ID HERE
        productData.id = await getNextProductId();

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
        res.status(500).json({
            message: "Failed to upload product",
            error: err.message,
        });
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
        const uploadedUrls = getUploadedFiles(req.files, "images").map((file) => file.path);
        console.log('Uploaded new image URLs:', uploadedUrls);

        if (uploadedUrls.length > 0 || Array.isArray(updatedProductData.images)) {
            const retainedImages = Array.isArray(updatedProductData.images) ? updatedProductData.images : productToUpdate.images;
            const nextImages = [...new Set([...retainedImages, ...uploadedUrls].filter(Boolean))];
            if (nextImages.length === 0) {
                return res.status(400).json({ message: "At least one product image is required." });
            }
            if (nextImages.length > MAX_PRODUCT_IMAGES) {
                return res.status(400).json({ message: `A product can have up to ${MAX_PRODUCT_IMAGES} images.` });
            }
            productToUpdate.images = nextImages;
            console.log('Product gallery updated with retained and newly uploaded images.');
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
        if (updatedProductData.metaTitle !== undefined) productToUpdate.metaTitle = updatedProductData.metaTitle;
        if (updatedProductData.metaDescription !== undefined) productToUpdate.metaDescription = updatedProductData.metaDescription;
        if (updatedProductData.showWhatsInside !== undefined) productToUpdate.showWhatsInside = Boolean(updatedProductData.showWhatsInside);
        if (updatedProductData.showPackaging !== undefined) productToUpdate.showPackaging = Boolean(updatedProductData.showPackaging);
        if (updatedProductData.sizeOptions !== undefined) productToUpdate.sizeOptions = normalizeSizeOptions(updatedProductData.sizeOptions, productToUpdate.price);
        if (updatedProductData.showSizeOptions !== undefined) {
            productToUpdate.showSizeOptions = Boolean(updatedProductData.showSizeOptions && productToUpdate.sizeOptions.length);
        }
        if (updatedProductData.colorOptions !== undefined) productToUpdate.colorOptions = normalizeColorOptions(updatedProductData.colorOptions, productToUpdate.images);
        if (updatedProductData.showColorOptions !== undefined) {
            productToUpdate.showColorOptions = Boolean(updatedProductData.showColorOptions && productToUpdate.colorOptions.length);
        }
        if (updatedProductData.whatsInside !== undefined) {
            updatedProductData.whatsInside = applyWhatsInsideImageUploads(updatedProductData.whatsInside, req.files);
            const resolvedContents = await resolveWhatsInsideItems(updatedProductData.whatsInside);
            if (resolvedContents.missingIds.length > 0) {
                return res.status(400).json({ message: "One or more selected Gift Box Items no longer exist." });
            }
            productToUpdate.whatsInside = resolvedContents.items;
        }
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
        const allProducts = await Product.find({}).lean();

        const userIds = [];
        for (const categoryDoc of allProducts) {
            for (const product of categoryDoc.products) {
                if (product.reviews && product.reviews.length > 0) {
                    for (const review of product.reviews) {
                        userIds.push(review.userId);
                    }
                }
            }
        }

        const users = await User.find({ _id: { $in: userIds } })
            .select("name email")
            .lean();
        const usersById = new Map(users.map((u) => [u._id.toString(), u]));

        let allReviews = [];
        for (const categoryDoc of allProducts) {
            for (const product of categoryDoc.products) {
                if (product.reviews && product.reviews.length > 0) {
                    for (const review of product.reviews) {
                        const user = usersById.get(review.userId.toString());
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
        res.status(200).json(allReviews);
    } catch (err) {
        console.error("SERVER ERROR fetching all reviews:", err);
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
