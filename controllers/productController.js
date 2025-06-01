import Product from '../models/Product.js';

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    try {
        // Use 'category' instead of 'categoryId'
        const products = await Product.find({ category: req.params.category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new product
export const createProduct = async (req, res) => {
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
};

export const deleteAllProducts = async (req, res) => {
    try {
        await Product.deleteMany({});
        res.status(200).send("All products deleted");
    } catch (error) {
        res.status(500).send("Error deleting products");
    }
};

export const createMultipleProducts = async (req, res) => {
    const products = req.body.products;  // array expected

    try {
        const result = await Product.insertMany(products);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const createProductCategory = async (req, res) => {
    try {
        const { category } = req.body;
        // Parse the single product data sent from frontend
        const productData = JSON.parse(req.body.products)[0]; // Get the first (and only) product from the array

        const uploadedUrls = req.files.map(file => file.path); // URLs from multer-cloudinary

        // Assign all uploaded URLs to this single product
        productData.images = uploadedUrls;

        // Try to find if category already exists
        const existingCategory = await Product.findOne({ category });

        if (existingCategory) {
            // Append the new product to existing category
            existingCategory.products.push(productData);
            await existingCategory.save();
            return res.status(200).json({ message: 'Product added to existing category', data: existingCategory });
        }

        // Else create new category with the product
        const newCategory = new Product({
            category,
            products: [productData], // Wrap the single product in an array
        });

        await newCategory.save();
        res.status(201).json({ message: 'New category created with product', data: newCategory });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Failed to upload product', error: err.message });
    }
};

// Delete a single product by its ID from a category
export const deleteProductById = async (req, res) => {
    const productId = req.params.id;
    try {
        // Find the category document that contains the product
        const categoryDoc = await Product.findOne({ 'products._id': productId });

        if (!categoryDoc) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Remove the product with productId from the products array
        categoryDoc.products = categoryDoc.products.filter(p => p._id.toString() !== productId);

        await categoryDoc.save();

        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*  export const searchProducts = async (req, res) => {
   const query = req.query.q?.trim().toLowerCase();
 
   if (!query) return res.status(400).json({ message: "Search query is required" });
 
   try {
     const results = await Product.find({
       $or: [
         { name: { $regex: query, $options: 'i' } },
         { category: { $regex: query, $options: 'i' } },
         { subcategory: { $regex: query, $options: 'i' } },
         { tags: { $regex: query, $options: 'i' } }
       ]
     });
 
     res.status(200).json(results);
   } catch (error) {
     res.status(500).json({ message: "Server Error", error: error.message });
   }
 }; */