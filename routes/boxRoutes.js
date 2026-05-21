// routes/boxRoutes.js
import express from 'express';
import {
    getAllBoxes,
    getBoxById,
    createBox,
    updateBox,
    deleteBox,
    toggleBoxStock
} from '../controllers/boxController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllBoxes);
router.get('/:id', getBoxById);

// Admin routes (you can add authentication middleware here)
router.post('/', upload.single('image'), createBox);
router.put('/:id', upload.single('image'), updateBox);
router.delete('/:id', deleteBox);
router.patch('/:id/toggle-stock', toggleBoxStock);

export default router;