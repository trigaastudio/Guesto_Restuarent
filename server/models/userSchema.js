import mongoose from "mongoose";
import bcrypt from "bcrypt"; 

const userSchema = new mongoose.Schema({

  name: { 
    type: String, 
    required: [true, "Name is required"], 
    trim: true 
  },

  avatar: {
    type: String,
    default: ""
  },

  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [
      function() { return !this.googleId && !this.createdByAdmin; },
      "Password is required"
    ],
    validate: {
      validator: function(v) {
        // No password needed for Google or admin-created users
        if (this.googleId && !v) return true;
        if (this.createdByAdmin && !v) return true;
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/.test(v);
      },
      message: "Password must contain uppercase, lowercase, number, and special character"
    },
    select: false 
  },

  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user"
  },

  phone: { 
    type: String, 
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, "Phone number must be 7-15 digits, optionally starting with +"]
  },

  addresses: [{
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    landmark: { type: String, trim: true },
    location: { type: String, trim: true },
    type: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home"
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  isActive: { 
    type: Boolean, 
    default: true 
  },

  lastLogin: {
    type: Date
  },

  createdByAdmin: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);