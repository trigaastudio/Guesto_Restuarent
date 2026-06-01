import mongoose from "mongoose";
import { getIO, emitOrderStatusUpdate } from "../socket.js";
import Table from "./tableSchema.js";


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

  
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  occupiedSeats: { type: Number, default: 0 },
  sessionId: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    name: String,
    size: String,
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: {
      type: Number,
      min: 0,
      required: function () { return !this.price; }
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    price: Number, // Team app compatibility
    totalPrice: {
      type: Number,
      min: 0,
      required: function () { return !this.price; }
    },
    kitchenStatus: {
      type: String,
      enum: ["placed", "preparing", "ready", "delayed"],
      default: "placed"
    },
    bogoItem: {
      name: String,
      size: String,
      quantity: { type: Number, default: 1 }
    },
    comboItems: [{
      name: String,
      quantity: { type: Number, default: 1 },
      price: Number
    }],
    includedItems: [{
      name: String,
      quantity: { type: Number, default: 1 }
    }]
  }],

  // Customer & Delivery Info
  assignedDeliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  customerDetails: {
    name: { type: String, default: "Walk-in" },
    phone: String,
    address: String,
    location: mongoose.Schema.Types.Mixed,
    remarks: String
  },
  address: {
    recipientName: String,
    mobile: String,
    address: String,
    type: { type: String },
    location: String
  },

  
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  cashReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },

  
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "billed", "out-for-delivery", "delivered", "cancelled"],
    default: "placed"
  },
  kitchenStatus: {
    type: String,
    enum: ["placed", "preparing", "ready", "delayed"],
    default: "placed"
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "unpaid", "refunded"],
    default: "unpaid"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi/card", "online", "cod", "wallet", "Not Specified"],
    default: "Not Specified"
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  remarks: { type: String, trim: true },
  rejectionReason: { type: String, default: '' },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true, strict: true });

// Pre-validation hook: Data Consistency & Calculations
orderSchema.pre('validate', async function () {
  
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount') || this.isModified('deliveryFee') || this.isModified('platformFee')) {
    this.subtotal = this.items.reduce((acc, item) =>
      acc + (item.totalPrice || (item.price * item.quantity) || 0), 0
    );
    this.totalAmount = Math.max(0, this.subtotal + (this.tax || 0) + (this.deliveryFee || 0) + (this.platformFee || 0));
  }

  
  if (this.paymentMethod === 'cash' || this.paymentMethod === 'cod') {
    this.balance = (this.cashReceived || 0) - this.totalAmount;
  }

  
  if (this.paymentMethod === 'wallet') {
    if (this.paymentStatus === 'unpaid') {
      this.paymentStatus = 'paid';
    }
  }

  
  if (this.items && this.items.length > 0) {
    const statuses = this.items.map(i => i.kitchenStatus);
    if (statuses.some(s => s === "delayed")) {
      this.kitchenStatus = "delayed";
    } else if (statuses.every(s => s === "ready")) {
      this.kitchenStatus = "ready";
    } else if (statuses.some(s => s === "preparing" || s === "ready")) {
      this.kitchenStatus = "preparing";
    } else {
      this.kitchenStatus = "placed";
    }

    if (this.kitchenStatus !== "placed") this.isLocked = true;
  }

  
  if (this.isModified('customerDetails') && !this.isModified('address')) {
    this.address = {
      ...this.address,
      recipientName: this.customerDetails?.name || "Walk-in",
      mobile: this.customerDetails?.phone || "",
      address: this.customerDetails?.address || "",
      location: typeof this.customerDetails?.location === 'object' ?
        `📍 Maps: https://www.google.com/maps?q=${this.customerDetails.location.lat},${this.customerDetails.location.lng}` :
        (this.customerDetails?.location || "")
    };
  }
});

// Helper to dynamically update Table occupancy based on active orders
async function updateTableOccupancy(tableId) {
  if (!tableId) return;
  try {
    const Order = mongoose.model('Order');
    const activeOrders = await Order.find({
      table: tableId,
      orderType: 'dine-in',
      orderStatus: { $nin: ['cancelled', 'completed'] },
      $or: [
        { orderStatus: { $nin: ['billed', 'delivered'] } },
        { paymentStatus: { $ne: 'paid' } }
      ]
    });
    const totalSeats = activeOrders.reduce((sum, o) => sum + (o.occupiedSeats || 0), 0);
    const status = totalSeats > 0 ? 'occupied' : 'available';
    await Table.findByIdAndUpdate(tableId, { occupiedSeats: totalSeats, status });
  } catch (err) {
    console.error("Error updating table occupancy in post hook:", err);
  }
}

// Post-save hook for real-time notifications and Table occupancy sync
orderSchema.post('save', async function (doc) {
  try {
    if (doc._id) {
      // General update for all listeners
      getIO().emit('ordersUpdated');

      // Specific status update for tracking
      if (doc.orderStatus) {
        emitOrderStatusUpdate(doc._id.toString(), doc.orderStatus, doc.kitchenStatus);
      }

      // Sync Table occupiedSeats & status
      if (doc.table && doc.orderType === 'dine-in') {
        await updateTableOccupancy(doc.table);
      }
    }
  } catch (err) {
    console.error("Socket / table sync error in orderSchema post-save:", err);
  }
});

// Post-findOneAndDelete hook to clean up Table occupancy when an order is deleted
orderSchema.post('findOneAndDelete', async function (doc) {
  try {
    if (doc && doc.table && doc.orderType === 'dine-in') {
      await updateTableOccupancy(doc.table);
    }
  } catch (err) {
    console.error("Error in orderSchema post-findOneAndDelete table occupancy sync:", err);
  }
});

export default mongoose.model("Order", orderSchema);

