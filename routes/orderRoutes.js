import express from 'express';
import {
    createOrder,
    getOrders,
    deleteOrderById,
    updateOrderStatus 
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.delete('/:id', deleteOrderById);
router.put('/:id/status', updateOrderStatus);

export default router;