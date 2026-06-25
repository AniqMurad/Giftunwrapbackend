// controllers/giftBoxItemController.js
import GiftBoxItem from '../models/GiftBoxItem.js';

// Get all gift box items
export const getAllItems = async (req, res) => {
    try {
        const items = await GiftBoxItem.find({ inStock: true }).sort({ createdAt: -1 }).lean();
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
        const items = await GiftBoxItem.find({ category, inStock: true }).sort({ createdAt: -1 }).lean();
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
        const item = await GiftBoxItem.findOne({ id: parseInt(id) }).lean();

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

        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Name, price, and category are required' });
        }

        // Build files map from upload.any()
        const filesMap = {};
        if (Array.isArray(req.files)) {
            req.files.forEach(file => {
                filesMap[file.fieldname] = file.path;
            });
        }

        if (!filesMap['image']) {
            return res.status(400).json({ message: 'Name, price, category, and image are required' });
        }

        // Parse color variants metadata
        let colorVariantsMeta = [];
        if (req.body.colorVariants) {
            try { colorVariantsMeta = JSON.parse(req.body.colorVariants); } catch (e) {}
        }

        const colorVariants = colorVariantsMeta
            .map((v, idx) => ({
                color: v.color,
                image: filesMap[`colorImage_${idx}`] || '',
            }))
            .filter(v => v.color && v.image);

        // Get the next ID
        const lastItem = await GiftBoxItem.findOne().sort({ id: -1 });
        const nextId = lastItem ? lastItem.id + 1 : 1;

        const newItem = new GiftBoxItem({
            id: nextId,
            name,
            price: Number(price),
            category,
            image: filesMap['image'],
            colorVariants,
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
// Update gift box item (Admin)
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Build files map from upload.any()
        const filesMap = {};
        if (Array.isArray(req.files)) {
            req.files.forEach(file => {
                filesMap[file.fieldname] = file.path;
            });
        }

        // Image can only be updated through multipart file upload.
        delete updateData.image;
        delete updateData.colorVariants;

        if (filesMap['image']) {
            updateData.image = filesMap['image'];
        }

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        // Handle color variants
        if (req.body.colorVariants !== undefined) {
            let colorVariantsMeta = [];
            try { colorVariantsMeta = JSON.parse(req.body.colorVariants); } catch (e) {}

            const existingItem = await GiftBoxItem.findOne({ id: parseInt(id) });
            updateData.colorVariants = colorVariantsMeta
                .map((v, idx) => ({
                    color: v.color,
                    image: filesMap[`colorImage_${idx}`] || existingItem?.colorVariants?.[idx]?.image || '',
                }))
                .filter(v => v.color && v.image);
        }

        const item = await GiftBoxItem.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).lean();

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
