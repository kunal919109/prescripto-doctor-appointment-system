import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
    // bcrypt hash, salt rounds = 10
  },
  image: {
    type: String,
    required: true
    // Cloudinary secure_url
  },
  speciality: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    default: '1 Year'
  },
  about: {
    type: String,
    maxlength: 500,
    default: ''
  },
  available: {
    type: Boolean,
    default: true
  },
  fees: {
    type: Number,
    required: true,
    min: 0.01
  },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  slots_booked: {
    type: Object,
    // e.g. { "12_07_2025": ["9:00 AM", "9:30 AM"] }
    default: {}
  },
  date: {
    type: Number,
    default: () => Date.now()
  }
}, { minimize: false }); // preserve empty objects in slots_booked

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);
export default doctorModel;
