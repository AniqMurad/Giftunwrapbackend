import express from 'express';
import { createMessage, getAllMessages, deleteMessageById } from '../controllers/messageController.js';

const router = express.Router();

router.post('/', createMessage);
router.get('/', getAllMessages);
router.delete('/:id', deleteMessageById);

export default router;
