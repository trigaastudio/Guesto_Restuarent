import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
    required: false,
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

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false
  },

  isActive: { 
    type: Boolean, 
    default: true 
  }

}, { timestamps: true });

staffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

staffSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Staff", staffSchema);