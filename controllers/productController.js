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

    const newProduct = new Product({ name, description, price, image, category, tags });

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
    const { category, products } = req.body;

    try {
        // Pehle check karo agar category already hai toh update kar do ya replace kar do (optional)
        // Ya naya document create karo
        const existing = await Product.findOne({ category });
        if (existing) {
            // update karna ho toh:
            if (existing) {
                existing.products.push(...products);  // products array ko append karo
                await existing.save();
                return res.status(200).json(existing);
            }
        }

        // Nahi toh naya banado
        const newCategory = new Product({ category, products });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
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