import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Lazily initialised Razorpay instance (only created when needed)
let razorpayInstance;
function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────

// POST /api/user/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Required field checks
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    // Validate name length
    if (name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be between 1 and 100 characters' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Validate password length
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    }

    // Check for duplicate email
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name: name.trim(), email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────

// GET /api/user/get-profile
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, userData: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/update-profile  (multipart/form-data)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, dob, gender, address } = req.body;

    // Validate name
    if (name !== undefined) {
      if (!name || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Name must be between 1 and 100 characters' });
      }
    }

    // Validate phone (7–15 digits)
    if (phone !== undefined) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return res.status(400).json({ success: false, message: 'Phone must be between 7 and 15 digits' });
      }
    }

    // Validate dob is a past date
    if (dob && dob !== 'Not Selected') {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth must be a valid past date' });
      }
    }

    // Validate address length
    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    if (parsedAddress) {
      const totalLength = (parsedAddress.line1 || '').length + (parsedAddress.line2 || '').length;
      if (totalLength > 255) {
        return res.status(400).json({ success: false, message: 'Address must not exceed 255 characters' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;
    if (gender) updateData.gender = gender;
    if (parsedAddress) updateData.address = parsedAddress;

    // Handle optional image upload
    if (req.file) {
      const imageResult = await uploadToCloudinary(req.file.buffer, { folder: 'prescripto/users' });
      updateData.image = imageResult.secure_url;
    }

    const updatedUser = await userModel.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');

    res.json({ success: true, message: 'Profile updated successfully', userData: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
//  APPOINTMENTS
// ─────────────────────────────────────────────

// GET /api/user/appointments
const listAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({ userId: req.userId })
      .sort({ date: -1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/book-appointment
const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: 'Doctor, date and time slot are required' });
    }

    const doctor = await doctorModel.findById(docId).select('-password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.available) {
      return res.status(400).json({ success: false, message: 'Doctor is not available' });
    }

    // Check if slot is already booked
    const bookedSlots = doctor.slots_booked[slotDate] || [];
    if (bookedSlots.includes(slotTime)) {
      return res.status(409).json({ success: false, message: 'This slot is no longer available' });
    }

    // Check for duplicate booking by same patient for same slot
    const duplicate = await appointmentModel.findOne({
      userId: req.userId,
      docId,
      slotDate,
      slotTime,
      cancelled: false,
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'You have already booked this slot' });
    }

    // Get patient data snapshot
    const user = await userModel.findById(req.userId).select('-password');

    // Create appointment
    const appointmentData = {
      userId: req.userId,
      docId,
      slotDate,
      slotTime,
      userData: user.toObject(),
      docData: doctor.toObject(),
      amount: doctor.fees,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Atomically mark slot as booked
    await doctorModel.findByIdAndUpdate(docId, {
      $set: { [`slots_booked.${slotDate}`]: [...bookedSlots, slotTime] }
    });

    res.json({ success: true, message: 'Appointment booked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/cancel-appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (String(appointment.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (appointment.cancelled || appointment.isCompleted) {
      return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' });
    }

    // Mark cancelled
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release slot
    const doctor = await doctorModel.findById(appointment.docId);
    if (doctor) {
      const slots = doctor.slots_booked[appointment.slotDate] || [];
      const updatedSlots = slots.filter(t => t !== appointment.slotTime);
      await doctorModel.findByIdAndUpdate(appointment.docId, {
        $set: { [`slots_booked.${appointment.slotDate}`]: updatedSlots }
      });
    }

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
//  PAYMENT — RAZORPAY
// ─────────────────────────────────────────────

// POST /api/user/payment-razorpay
// Creates a Razorpay order for a pending, unpaid appointment.
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.payment) {
      return res.status(400).json({ success: false, message: 'This appointment has already been paid' });
    }

    if (appointment.cancelled) {
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled appointment' });
    }

    const order = await getRazorpay().orders.create({
      amount:   Math.round(appointment.amount * 100), // paise
      currency: 'INR',
      receipt:  String(appointmentId),
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(502).json({ success: false, message: 'Payment service temporarily unavailable' });
  }
};

// POST /api/user/verifyRazorpay
// Verifies HMAC-SHA256 signature and marks appointment as paid.
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Reconstruct expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Fetch order to get the appointment ID from the receipt field
    const order = await getRazorpay().orders.fetch(razorpay_order_id);
    await appointmentModel.findByIdAndUpdate(order.receipt, { payment: true });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listAppointments,
  bookAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
};
