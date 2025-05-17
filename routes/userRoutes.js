import express from 'express';
import {
  getAllUsers,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

router.get('/allusers', getAllUsers);
router.delete('/delete/:id', deleteUser);

export default router;
