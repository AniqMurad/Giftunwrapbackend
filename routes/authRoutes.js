import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);

export default router;
