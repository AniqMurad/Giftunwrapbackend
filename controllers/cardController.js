// controllers/cardController.js
import Card from '../models/Card.js';

// Get all cards
export const getAllCards = async (req, res) => {
    try {
        const cards = await Card.find({ inStock: true }).sort({ createdAt: -1 }).lean();
        res.status(200).json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ message: 'Failed to fetch cards', error: error.message });
    }
};

// Get single card by ID
export const getCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findOne({ id: parseInt(id) }).lean();

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }
        
        res.status(200).json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ message: 'Failed to fetch card', error: error.message });
    }
};

// Create new card (Admin)
export const createCard = async (req, res) => {
    try {
        const { name, design, color, description } = req.body;

        // Validate required fields
        if (!name || !design) {
            return res.status(400).json({ 
                message: 'Name and design are required' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                message: 'Name, design, and image are required' 
            });
        }

        // Get the next ID
        const lastCard = await Card.findOne().sort({ id: -1 });
        const nextId = lastCard ? lastCard.id + 1 : 1;

        const newCard = new Card({
            id: nextId,
            name,
            design,
            image: req.file.path,
            color,
            description
        });

        await newCard.save();
        res.status(201).json({ message: 'Card created successfully', card: newCard });
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ message: 'Failed to create card', error: error.message });
    }
};

// Update card (Admin)
export const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Image can only be updated through multipart file upload.
        delete updateData.image;

        // If an image file is uploaded, replace the existing one.
        if (req.file) {
            updateData.image = req.file.path;
        }

        const card = await Card.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).lean();

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        res.status(200).json({ message: 'Card updated successfully', card });
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json({ message: 'Failed to update card', error: error.message });
    }
};

// Delete card (Admin)
export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findOneAndDelete({ id: parseInt(id) });

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ message: 'Failed to delete card', error: error.message });
    }
};

// Toggle card stock status (Admin)
export const toggleCardStock = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findOne({ id: parseInt(id) });

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        card.inStock = !card.inStock;
        card.updatedAt = Date.now();
        await card.save();

        res.status(200).json({ message: 'Card stock status updated', card });
    } catch (error) {
        console.error('Error toggling card stock:', error);
        res.status(500).json({ message: 'Failed to toggle card stock', error: error.message });
    }
};
