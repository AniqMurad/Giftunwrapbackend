// controllers/giftBoxItemController.js
import GiftBoxItem from '../models/GiftBoxItem.js';

// Get all gift box items
export const getAllItems = async (req, res) => {
    try {
        const items = await GiftBoxItem.find({ inStock: true }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching gift box items:', error);
        res.status(500).json({ message: 'Failed to fetch gift box items', error: error.message });
    }
};

// Get items by category
export const getItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const items = await GiftBoxItem.find({ category, inStock: true }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items by category:', error);
        res.status(500).json({ message: 'Failed to fetch items by category', error: error.message });
    }
};

// Get single item by ID
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GiftBoxItem.findOne({ id: parseInt(id) });
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Failed to fetch item', error: error.message });
    }
};

// Create new gift box item (Admin)
export const createItem = async (req, res) => {
    try {
        const { name, price, category, description } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Name, price, and category are required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Name, price, category, and image are required' });
        }

        // Get the next ID
        const lastItem = await GiftBoxItem.findOne().sort({ id: -1 });
        const nextId = lastItem ? lastItem.id + 1 : 1;

        const newItem = new GiftBoxItem({
            id: nextId,
            name,
            price: Number(price),
            category,
            image: req.file.path,
            description
        });

        await newItem.save();
        res.status(201).json({ message: 'Item created successfully', item: newItem });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Failed to create item', error: error.message });
    }
};

// Update gift box item (Admin)
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Image can only be updated through multipart file upload.
        delete updateData.image;

        // If an image file is uploaded, replace the existing one.
        if (req.file) {
            updateData.image = req.file.path;
        }

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        const item = await GiftBoxItem.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item updated successfully', item });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Failed to update item', error: error.message });
    }
};

// Delete gift box item (Admin)
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GiftBoxItem.findOneAndDelete({ id: parseInt(id) });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Failed to delete item', error: error.message });
    }
};

// Toggle item stock status (Admin)
export const toggleItemStock = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GiftBoxItem.findOne({ id: parseInt(id) });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.inStock = !item.inStock;
        item.updatedAt = Date.now();
        await item.save();

        res.status(200).json({ message: 'Item stock status updated', item });
    } catch (error) {
        console.error('Error toggling item stock:', error);
        res.status(500).json({ message: 'Failed to toggle item stock', error: error.message });
    }
};
