import express from 'express';
import {
    createOrder,
    getOrders,
    deleteOrderById,
    getOrdersByUser
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/myorders', protect, getOrdersByUser); 
router.delete('/:id', deleteOrderById);

export default router;