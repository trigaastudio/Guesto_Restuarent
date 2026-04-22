

import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({

  tableNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },

  capacity: {
    type: Number,
    default: 4
  },

  status: {
    type: String,
    enum: ["empty", "partial", "full"],
    default: "empty"
  },

  
  isActive: {
    type: Boolean,
    default: true  
  }

}, { timestamps: true });

export default mongoose.model("Table", tableSchema);