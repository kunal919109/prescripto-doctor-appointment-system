import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  slotDate: {
    type: String,
    required: true
    // format: "DD_MM_YYYY"  e.g. "12_07_2025"
  },
  slotTime: {
    type: String,
    required: true
    // 12-hour format  e.g. "10:00 AM"
  },
  userData: {
    type: Object,
    required: true
    // snapshot of user data at booking time
  },
  docData: {
    type: Object,
    required: true
    // snapshot of doctor data at booking time
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Number,
    default: () => Date.now()
    // booking timestamp
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  payment: {
    type: Boolean,
    default: false
    // true once Razorpay signature verified
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);
export default appointmentModel;
