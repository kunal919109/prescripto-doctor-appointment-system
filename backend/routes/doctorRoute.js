import express from 'express';
import {
  loginDoctor,
  doctorList,
  doctorProfile,
  updateDoctorProfile,
  doctorDashboard,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancelDoctor,
} from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';

const doctorRouter = express.Router();

// Public
doctorRouter.get('/list', doctorList);

// Auth
doctorRouter.post('/login', loginDoctor);

// Protected — doctor only
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor);
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete);
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancelDoctor);
doctorRouter.get('/dashboard', authDoctor, doctorDashboard);
doctorRouter.get('/profile', authDoctor, doctorProfile);
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile);

export default doctorRouter;
