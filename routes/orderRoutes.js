import express from 'express';
import {
    createOrder,
    getOrders,
    deleteOrderById,
    updateOrderStatus 
} from '../controllers/orderController.js';
import paymentProofUpload from '../middleware/paymentProofUpload.js';

const router = express.Router();

router.post('/', paymentProofUpload.single('paymentProof'), createOrder);
router.get('/', getOrders);
router.delete('/:id', deleteOrderById);
router.put('/:id/status', updateOrderStatus);

export default router;
