import Message from '../models/Message.js';

export const createMessage = async (req, res) => {
    try {
        const { name, email, content } = req.body;

        if (!name || !email || !content) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const newMessage = new Message({ name, email, content });
        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve messages.', error: error.message });
    }
};

export const deleteMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Message.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Message not found.' });
        }

        res.status(200).json({ message: 'Message deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete message.', error: error.message });
    }
};

