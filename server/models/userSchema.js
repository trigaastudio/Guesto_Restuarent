import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      function() { return !this.googleId; },
      "Password is required"
    ],
    validate: {
      validator: function(v) {
        // If googleId exists and password is empty, it's valid
        if (this.googleId && !v) return true;
        // Otherwise, it must match the regex
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
    trim: true 
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