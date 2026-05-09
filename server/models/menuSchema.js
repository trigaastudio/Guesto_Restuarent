

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
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      stockValue: {
        type: Number,
        default: 1,
        min: 0.1
      },
      includedItems: [
        {
          menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu"
          },
          quantity: {
            type: Number,
            default: 1
          }
        }
      ]
    }
  ],

  variants: [
    {
      size: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        min: 0
      },
      stockValue: {
        type: Number,
        default: 1
      },
      includedItems: [String]
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