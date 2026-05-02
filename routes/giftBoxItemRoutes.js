// routes/giftBoxItemRoutes.js
import express from 'express';
import {
    getAllItems,
    getItemsByCategory,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    toggleItemStock
} from '../controllers/giftBoxItemController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllItems);
router.get('/category/:category', getItemsByCategory);
router.get('/:id', getItemById);

// Admin routes (you can add authentication middleware here)
router.post('/', upload.single('image'), createItem);
router.put('/:id', upload.single('image'), updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/toggle-stock', toggleItemStock);

export default router;
