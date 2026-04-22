import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  orderType: {
    type: String,
    enum: ["dine-in", "takeaway", "delivery"],
    required: true
  },

  orderSource: {
    type: String,
    enum: ["admin", "waiter", "online"],
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.orderType === "delivery";
    }
  },


  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: function () {
      return this.orderType === "dine-in";
    }
  },

  sessionId: {
    type: String,
    required: function () {
      return this.orderType === "dine-in";
    }
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },

  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        required: true
      },
      size: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],

 
  customerDetails: {

    
    name: {
      type: String,
      required: function () {
        return this.orderType === "takeaway" || this.orderType === "delivery";
      }
    },


    phone: {
      type: String,
      required: function () {
        return this.orderType === "takeaway" || this.orderType === "delivery";
      }
    },


    address: {
      type: String,
      required: function () {
        return this.orderType === "delivery";
      }
    },


    location: {
      lat: {
        type: Number,
        required: function () {
          return this.orderType === "delivery";
        }
      },
      lng: {
        type: Number,
        required: function () {
          return this.orderType === "delivery";
        }
      }
    },


    remarks: {
      type: String,
      required: function () {
        return this.orderType === "takeaway";
      }
    }

  },

  subtotal: {
    type: Number,
    default: 0
  },

  tax: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "preparing",
      "ready",
      "served",
      "picked",
      "out-for-delivery",
      "delivered",
      "completed",
      "cancelled"
    ],
    default: "pending"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "online", "cod"]
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);