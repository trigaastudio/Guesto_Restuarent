import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },

  email: {
    type: String,
    trim: true,
    lowercase: true

  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },

  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  role: {
    type: String,
    enum: ["admin", "waiter", "kitchen", "cashier", "delivery"],
    required: true
  },

  isActive: { 
    type: Boolean, 
    default: true 
  }

}, { timestamps: true });

export default mongoose.model("Staff", staffSchema);