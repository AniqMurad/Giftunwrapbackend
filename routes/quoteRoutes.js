import express from 'express';
import {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuoteStatus,
  deleteQuote,
} from '../controllers/quoteController.js';

const router = express.Router();

// Public route - Create a new quote request
router.post('/', createQuote);

// Admin routes - Manage quotes
router.get('/', getAllQuotes);
router.get('/:id', getQuoteById);
router.patch('/:id/status', updateQuoteStatus);
router.delete('/:id', deleteQuote);

export default router;
