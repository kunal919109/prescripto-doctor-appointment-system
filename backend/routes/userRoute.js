import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listAppointments,
  bookAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
} from '../controllers/userController.js';
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

// Auth (public)
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

// Profile (protected)
userRouter.get('/get-profile', authUser, getProfile);
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile);

// Appointments (protected)
userRouter.get('/appointments', authUser, listAppointments);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);

// Payment (protected)
userRouter.post('/payment-razorpay', authUser, paymentRazorpay);
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay);

export default userRouter;
