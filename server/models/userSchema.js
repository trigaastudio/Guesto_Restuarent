import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({

  name: { 
    type: String, 
    required: [true, "Name is required"], 
    trim: true 
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false 
  },

  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user"
  },

  phone: { 
    type: String, 
    trim: true 
  },

  address: {
    type: {
      type: String,
      enum: ["home", "office"],
      default: "home"
    },

    street: {
      type: String,
      trim: true
    },

    isDefault: {
      type: Boolean,
      default: false
    },
  
    area: {
      type: String,
      trim: true
    },

    city: {
      type: String,
      trim: true
    },

    state: {
      type: String,
      trim: true
    },

    pincode: {
      type: String,
      trim: true
    },

    country: {
      type: String,
      default: "India"
    },


    location: {
      lat: Number,
      lng: Number
    }
  },

  isActive: { 
    type: Boolean, 
    default: true 
  },

  lastLogin: {
    type: Date
  }

}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);