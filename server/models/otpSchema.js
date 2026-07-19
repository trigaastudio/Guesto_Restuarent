import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // auto-delete after 5 minutes
  },
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
