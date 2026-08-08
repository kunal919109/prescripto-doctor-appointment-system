import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';

// ---------- In-memory rate limiter for doctor login ----------
// Blocks after 5 consecutive failures within a 15-minute window.
// For production multi-instance deployments, replace with Redis-backed limiter.
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(email) {
  const now = Date.now();
  const record = loginAttempts.get(email) || { attempts: 0, windowStart: now };

  // Reset window if expired
  if (now - record.windowStart > WINDOW_MS) {
    loginAttempts.set(email, { attempts: 1, windowStart: now });
    return { blocked: false };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000);
    return { blocked: true, retryAfter };
  }

  record.attempts++;
  loginAttempts.set(email, record);
  return { blocked: false };
}

function resetLoginAttempts(email) {
  loginAttempts.delete(email);
}

// ---------- Doctor Login ----------
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Rate limit check
    const rateCheck = checkLoginRateLimit(email);
    if (rateCheck.blocked) {
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${rateCheck.retryAfter} seconds.`
      });
    }

    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Successful login — reset rate limit counter
    resetLoginAttempts(email);

    const token = jwt.sign(
      { id: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Doctor List (public) ----------
// Returns only available doctors; password excluded.
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ available: true }).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Get Doctor Profile ----------
const doctorProfile = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.docId).select('-password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, profileData: doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Update Doctor Profile ----------
// Accepts: fees, address, available, about.
const updateDoctorProfile = async (req, res) => {
  try {
    const { fees, address, available, about } = req.body;

    // Validate fees
    if (fees !== undefined) {
      const feeNum = Number(fees);
      if (isNaN(feeNum) || feeNum <= 0) {
        return res.status(400).json({ success: false, message: 'Fee must be a positive number' });
      }
      if (feeNum > 99999.99) {
        return res.status(400).json({ success: false, message: 'Fee must not exceed 99,999.99' });
      }
    }

    // Validate bio length
    if (about && about.length > 500) {
      return res.status(400).json({ success: false, message: 'Bio must not exceed 500 characters' });
    }

    // Validate address length
    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    if (parsedAddress) {
      const addressLength = (parsedAddress.line1 || '').length + (parsedAddress.line2 || '').length;
      if (addressLength > 200) {
        return res.status(400).json({ success: false, message: 'Address must not exceed 200 characters total' });
      }
    }

    const updateData = {};
    if (fees !== undefined) updateData.fees = Number(fees);
    if (parsedAddress !== undefined) updateData.address = parsedAddress;
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (about !== undefined) updateData.about = about;

    await doctorModel.findByIdAndUpdate(req.docId, updateData);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Doctor Dashboard ----------
// Returns earnings (sum of completed appointment fees), counts, and 5 latest appointments.
const doctorDashboard = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({ docId: req.docId });

    // Total earnings = sum of fees for completed appointments
    const earnings = appointments
      .filter(a => a.isCompleted)
      .reduce((sum, a) => sum + a.amount, 0);

    // Unique patient IDs
    const uniquePatients = new Set(appointments.map(a => String(a.userId)));

    // Completed and pending counts
    const completed = appointments.filter(a => a.isCompleted).length;
    const pending = appointments.filter(a => !a.cancelled && !a.isCompleted).length;

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: uniquePatients.size,
      completed,
      pending,
      latestAppointments: appointments
        .sort((a, b) => b.date - a.date)
        .slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Doctor's Appointments ----------
const appointmentsDoctor = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({ docId: req.docId })
      .sort({ date: -1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Mark Appointment Complete ----------
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (String(appointment.docId) !== String(req.docId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    // Must be pending to complete
    if (appointment.cancelled || appointment.isCompleted) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Cancel Appointment (Doctor) ----------
const appointmentCancelDoctor = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (String(appointment.docId) !== String(req.docId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (appointment.cancelled || appointment.isCompleted) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    // Mark cancelled
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release the slot
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

export {
  loginDoctor,
  doctorList,
  doctorProfile,
  updateDoctorProfile,
  doctorDashboard,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancelDoctor,
};
