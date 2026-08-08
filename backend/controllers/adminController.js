import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// ---------- Admin Login ----------
// Compares submitted credentials against env vars ADMIN_EMAIL and ADMIN_PASSWORD.
// Returns a signed JWT with role: "admin" and 7-day expiry on success.
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ success: true, token });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Add Doctor ----------
// Validates all required fields, uploads photo to Cloudinary, hashes password,
// and creates the doctor document. Returns 400 for duplicate email.
const addDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !speciality || !degree || !fees) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Doctor profile image is required' });
    }

    // Check for duplicate email
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Upload image to Cloudinary
    const imageResult = await uploadToCloudinary(req.file.buffer, { folder: 'prescripto/doctors' });

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse address if sent as JSON string from multipart form
    const parsedAddress = typeof address === 'string'
      ? JSON.parse(address)
      : (address || { line1: '', line2: '' });

    const doctorData = {
      name,
      email,
      password: hashedPassword,
      image: imageResult.secure_url,
      speciality,
      degree,
      experience: experience || '1 Year',
      about: about || '',
      fees: Number(fees),
      address: parsedAddress,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: 'Doctor added successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- All Doctors (Admin view) ----------
// Returns all doctors (available and unavailable), password excluded.
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Change Doctor Availability ----------
// Toggles the doctor's available boolean field.
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    await doctorModel.findByIdAndUpdate(docId, { available: !doctor.available });

    res.json({ success: true, message: 'Availability updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- All Appointments (Admin view) ----------
// Returns all appointments sorted by date descending.
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({}).sort({ date: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Cancel Appointment (Admin) ----------
// Admin can cancel any pending appointment and release the slot.
const appointmentCancelAdmin = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.cancelled || appointment.isCompleted) {
      return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' });
    }

    // Mark cancelled
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release the slot from doctor's slots_booked
    const { docId, slotDate, slotTime } = appointment;
    const doctor = await doctorModel.findById(docId);
    if (doctor) {
      const slots = doctor.slots_booked[slotDate] || [];
      const updatedSlots = slots.filter(t => t !== slotTime);
      await doctorModel.findByIdAndUpdate(docId, {
        $set: { [`slots_booked.${slotDate}`]: updatedSlots }
      });
    }

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Admin Dashboard ----------
// Returns platform-wide stats: total doctors, patients, appointments, and 5 latest appointments.
const adminDashboard = async (req, res) => {
  try {
    const [doctors, patients, appointments] = await Promise.all([
      doctorModel.find({}).select('-password'),
      userModel.find({}),
      appointmentModel.find({})
    ]);

    const latestAppointments = await appointmentModel
      .find({})
      .sort({ date: -1 })
      .limit(5);

    const dashData = {
      doctors: doctors.length,
      patients: patients.length,
      appointments: appointments.length,
      latestAppointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Delete Doctor ----------
// Removes a doctor document. Cancels any pending appointments for that doctor.
const deleteDoctor = async (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Cancel all pending appointments for this doctor
    await appointmentModel.updateMany(
      { docId, cancelled: false, isCompleted: false },
      { cancelled: true }
    );

    await doctorModel.findByIdAndDelete(docId);

    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  adminLogin,
  addDoctor,
  allDoctors,
  changeAvailability,
  appointmentsAdmin,
  appointmentCancelAdmin,
  adminDashboard,
  deleteDoctor,
};
