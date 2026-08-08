import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
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
    // stored as bcrypt hash — never plain-text
  },
  image: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/non_existing_id.png'
  },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Not Selected'],
    default: 'Not Selected'
  },
  dob: {
    type: String,
    default: 'Not Selected'
  },
  phone: {
    type: String,
    default: '0000000000'
  }
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;
