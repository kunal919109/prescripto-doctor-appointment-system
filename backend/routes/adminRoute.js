import express from 'express';
import {
  adminLogin,
  addDoctor,
  allDoctors,
  changeAvailability,
  appointmentsAdmin,
  appointmentCancelAdmin,
  adminDashboard,
  deleteDoctor,
} from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const adminRouter = express.Router();

// Auth
adminRouter.post('/login', adminLogin);

// Doctor management (all protected by authAdmin)
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor);
adminRouter.get('/all-doctors', authAdmin, allDoctors);
adminRouter.post('/change-availability', authAdmin, changeAvailability);
adminRouter.post('/delete-doctor', authAdmin, deleteDoctor);

// Appointment management
adminRouter.get('/appointments', authAdmin, appointmentsAdmin);
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancelAdmin);

// Dashboard stats
adminRouter.get('/dashboard', authAdmin, adminDashboard);

export default adminRouter;
