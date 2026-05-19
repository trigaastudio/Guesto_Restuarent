

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

  occupiedSeats: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["available", "occupied", "billing"],
    default: "available"
  },


  isActive: {
    type: Boolean,
    default: true
  },

  mergedGroup: {
    type: [Number],
    default: []
  }

}, { timestamps: true });

export default mongoose.model("Table", tableSchema);