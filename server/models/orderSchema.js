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
      name: String,
      size: String,
      image: {
        type: String,
        default: ''
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      },
      kitchenStatus: {
        type: String,
        enum: ["pending", "preparing", "delayed", "ready"],
        default: "pending"
      }
    }
  ],

  customerDetails: {
    name: {
      type: String,
      default: "Walk-in"
    },
    phone: String,
    address: String,
    location: {
      lat: Number,
      lng: Number
    },
    remarks: String
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
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled"
    ],
    default: "pending"
  },

  kitchenStatus: {
    type: String,
    enum: ["pending", "preparing", "delayed", "ready"],
    default: "pending"
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "online", "cod"]
  }

}, { timestamps: true });

// Pre-save hook to derive kitchenStatus and handle locking
orderSchema.pre('save', async function () {
  if (this.items && this.items.length > 0) {
    const statuses = this.items.map(i => i.kitchenStatus);
    
    if (statuses.every(s => s === "ready")) {
      this.kitchenStatus = "ready";
    } else if (statuses.some(s => s === "delayed")) {
      this.kitchenStatus = "delayed";
    } else if (statuses.some(s => s === "preparing" || s === "ready")) {
      this.kitchenStatus = "preparing";
    } else {
      this.kitchenStatus = "pending";
    }

    // Automatic locking logic
    if (this.kitchenStatus !== "pending") {
      this.isLocked = true;
    }
  }
});

export default mongoose.model("Order", orderSchema);