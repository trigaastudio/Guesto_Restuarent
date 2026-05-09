

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  
  name: {
    type: String, 
    required: true,
    unique: true,     
    trim: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },

  image: {
    type: String,
    default: ""
  }

}, { timestamps: true });

export default mongoose.model("Category", categorySchema);