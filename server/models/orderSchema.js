import mongoose from "mongoose";
import { emitOrderStatusUpdate } from "../socket.js";

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
    enum: ["admin", "waiter", "user"],
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
      type: String,
      trim: true
    },
    remarks: {
      type: String
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
  deliveryFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "out-for-delivery", "delivered", "cancelled"],
    default: "placed"
  },
  kitchenStatus: {
    type: String,
    enum: ["placed", "preparing", "ready"],
    default: "placed"
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

orderSchema.post('save', function (doc) {
  if (doc._id && doc.orderStatus) {
    emitOrderStatusUpdate(doc._id.toString(), doc.orderStatus);
  }
});

export default mongoose.model("Order", orderSchema);