// routes/cardRoutes.js
import express from 'express';
import {
    getAllCards,
    getCardById,
    createCard,
    updateCard,
    deleteCard,
    toggleCardStock
} from '../controllers/cardController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllCards);
router.get('/:id', getCardById);

// Admin routes (you can add authentication middleware here)
router.post('/', upload.single('image'), createCard);
router.put('/:id', upload.single('image'), updateCard);
router.delete('/:id', deleteCard);
router.patch('/:id/toggle-stock', toggleCardStock);

export default router;
