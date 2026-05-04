// controllers/boxController.js
import Box from '../models/Box.js';

// Get all boxes
export const getAllBoxes = async (req, res) => {
    try {
        const boxes = await Box.find({ inStock: true }).sort({ price: 1 });
        res.status(200).json(boxes);
    } catch (error) {
        console.error('Error fetching boxes:', error);
        res.status(500).json({ message: 'Failed to fetch boxes', error: error.message });
    }
};

// Get single box by ID
export const getBoxById = async (req, res) => {
    try {
        const { id } = req.params;
        const box = await Box.findOne({ id: parseInt(id) });
        
        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }
        
        res.status(200).json(box);
    } catch (error) {
        console.error('Error fetching box:', error);
        res.status(500).json({ message: 'Failed to fetch box', error: error.message });
    }
};

// Create new box (Admin)
export const createBox = async (req, res) => {
    try {
        const { name, size, price, capacity, color, description } = req.body;

        // Validate required fields
        if (!name || !size || !price || !capacity) {
            return res.status(400).json({ 
                message: 'Name, size, price, and capacity are required' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                message: 'Name, size, price, capacity, and image are required' 
            });
        }

        // Get the next ID
        const lastBox = await Box.findOne().sort({ id: -1 });
        const nextId = lastBox ? lastBox.id + 1 : 1;

        const newBox = new Box({
            id: nextId,
            name,
            size,
            price: Number(price),
            capacity,
            image: req.file.path,
            color,
            description
        });

        await newBox.save();
        res.status(201).json({ message: 'Box created successfully', box: newBox });
    } catch (error) {
        console.error('Error creating box:', error);
        res.status(500).json({ message: 'Failed to create box', error: error.message });
    }
};

// Update box (Admin)
export const updateBox = async (req, res) => {
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

        const box = await Box.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        );

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        res.status(200).json({ message: 'Box updated successfully', box });
    } catch (error) {
        console.error('Error updating box:', error);
        res.status(500).json({ message: 'Failed to update box', error: error.message });
    }
};

// Delete box (Admin)
export const deleteBox = async (req, res) => {
    try {
        const { id } = req.params;
        const box = await Box.findOneAndDelete({ id: parseInt(id) });

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        res.status(200).json({ message: 'Box deleted successfully' });
    } catch (error) {
        console.error('Error deleting box:', error);
        res.status(500).json({ message: 'Failed to delete box', error: error.message });
    }
};

// Toggle box stock status (Admin)
export const toggleBoxStock = async (req, res) => {
    try {
        const { id } = req.params;
        const box = await Box.findOne({ id: parseInt(id) });

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        box.inStock = !box.inStock;
        box.updatedAt = Date.now();
        await box.save();

        res.status(200).json({ message: 'Box stock status updated', box });
    } catch (error) {
        console.error('Error toggling box stock:', error);
        res.status(500).json({ message: 'Failed to toggle box stock', error: error.message });
    }
};
