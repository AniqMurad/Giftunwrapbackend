const express = require('express');
const router = express.Router();
const {
    createMessage,
    getAllMessages
} = require('../controllers/messageController');

// POST a message
router.post('/', createMessage);

// GET all messages
router.get('/', getAllMessages);

module.exports = router;
