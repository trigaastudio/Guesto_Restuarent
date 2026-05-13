

import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  description: {
    type: String,
    trim: true
  },

  offerPrice: {
    type: Number,
    min: 0
  },

  hasOffer: {
    type: Boolean,
    default: false
  },

  variants: [
    {
      size: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      costPrice: {
        type: Number,
        default: 0,
        min: 0
      },
      stockValue: {
        type: Number,
        default: 1
      },
      includedItems: [
        {
          menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu"
          },
          name: String, // Optional: store name for easy display if needed
          quantity: {
            type: Number,
            default: 1
          }
        }
      ]
    }
  ],

  image: {
    type: String
  },

  foodType: {
    type: String,
    enum: ["veg", "non-veg"],
    default: "veg"
  },

  totalStock: {
    type: Number,
    required: true,
    default: 0
  },

  isBlocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Menu", menuSchema);