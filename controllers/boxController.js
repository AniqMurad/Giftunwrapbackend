// controllers/boxController.js
import Box from '../models/Box.js';

const MAX_BOX_IMAGES = 10;

const getUploadedFiles = (files) => {
    if (Array.isArray(files)) return files;
    if (!files || typeof files !== 'object') return [];
    return Object.values(files).flat();
};

const parseRetainedImages = (value) => {
    if (value === undefined) return undefined;

    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string' && url.trim()) : [];
    } catch {
        return [];
    }
};

const uniqueImages = (images) => [...new Set(images.filter(Boolean))];

// Get all boxes
export const getAllBoxes = async (req, res) => {
    try {
        const boxes = await Box.find({ inStock: true }).sort({ price: 1 }).lean();
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
        const box = await Box.findOne({ id: parseInt(id) }).lean();

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
        const uploadedImages = uniqueImages(getUploadedFiles(req.files).map((file) => file.path));

        // Validate required fields
        if (!name || !size || !price || !capacity) {
            return res.status(400).json({ 
                message: 'Name, size, price, and capacity are required' 
            });
        }

        if (uploadedImages.length === 0) {
            return res.status(400).json({ 
                message: 'Name, size, price, capacity, and at least one image are required'
            });
        }

        if (uploadedImages.length > MAX_BOX_IMAGES) {
            return res.status(400).json({ message: `A box can have up to ${MAX_BOX_IMAGES} images` });
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
            image: uploadedImages[0],
            images: uploadedImages,
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
        const existingBox = await Box.findOne({ id: parseInt(id) });

        if (!existingBox) {
            return res.status(404).json({ message: 'Box not found' });
        }

        const uploadedImages = uniqueImages(getUploadedFiles(req.files).map((file) => file.path));
        const requestedRetainedImages = parseRetainedImages(updateData.retainedImages);
        const currentImages = uniqueImages(existingBox.images?.length ? existingBox.images : [existingBox.image]);
        const currentImageSet = new Set(currentImages);
        const retainedImages = requestedRetainedImages === undefined
            ? undefined
            : requestedRetainedImages.filter((url) => currentImageSet.has(url));

        // Image fields can only be updated through the retained-image list and multipart uploads.
        delete updateData.image;
        delete updateData.images;
        delete updateData.retainedImages;

        let nextImages;
        if (retainedImages !== undefined) {
            nextImages = uniqueImages([...retainedImages, ...uploadedImages]);
        } else if (uploadedImages.length > 0) {
            // Preserve the previous single-image replacement behavior for older admin clients.
            nextImages = uploadedImages;
        } else {
            nextImages = currentImages;
        }

        if (nextImages.length === 0) {
            return res.status(400).json({ message: 'A box must have at least one image' });
        }

        if (nextImages.length > MAX_BOX_IMAGES) {
            return res.status(400).json({ message: `A box can have up to ${MAX_BOX_IMAGES} images` });
        }

        updateData.images = nextImages;
        updateData.image = nextImages[0];

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        const box = await Box.findOneAndUpdate(
            { _id: existingBox._id },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).lean();

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
