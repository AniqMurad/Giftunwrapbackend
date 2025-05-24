import express from 'express';
import {
    createOrder,
    getOrders,
    deleteOrderById 
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.delete('/:id', deleteOrderById);

export default router;