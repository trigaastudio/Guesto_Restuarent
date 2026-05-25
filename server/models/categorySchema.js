

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
  },

  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  isSharedStock: {
    type: Boolean,
    default: false
  },

  totalStock: {
    type: Number,
    default: 0
  },

  stockactive: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Category", categorySchema);