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

  addresses: [{
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    location: { type: String, trim: true },
    type: {
      type: String,
      enum: ["home", "office"],
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
  }

}, { timestamps: true });


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);