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
    // Standardized to kebab-case, removed redundancies
    enum: ["dine-in", "takeaway", "delivery"],
    required: true
  },
  orderSource: {
    type: String,
    enum: ["admin", "waiter", "user"],
    required: true
  },

  // Linked Entities (Bidirectional compatibility)
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Team app compatibility
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
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
    }
  }],

  // Customer & Delivery Info (Bidirectional sync)
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

  // Financials
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 }, // Added from snippet
  totalAmount: { type: Number, default: 0 },
  cashReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  // Status Management
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "out-for-delivery", "delivered", "cancelled"],
    default: "placed"
  },

  kitchenStatus: {
    type: String,
    enum: ["placed", "preparing", "ready", "delayed"],
    default: "placed"
  },

  remarks: { type: String, trim: true }, // Added for easy top-level access
  isLocked: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "online", "cod"]
  }
}, { timestamps: true, strict: true });

// Pre-validation hook: Data Consistency & Calculations
orderSchema.pre('validate', async function () {
  // 1. Financial Calculations (Including Delivery Fee)
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount') || this.isModified('deliveryFee')) {
    this.subtotal = this.items.reduce((acc, item) =>
      acc + (item.totalPrice || (item.price * item.quantity) || 0), 0
    );
    // Formula: Subtotal + Tax + DeliveryFee - Discount
    this.totalAmount = Math.max(0, this.subtotal + (this.tax || 0) + (this.deliveryFee || 0) - (this.discount || 0));
  }

  // 2. Cash Balance Calculation
  if (this.paymentMethod === 'cash' || this.paymentMethod === 'cod') {
    this.balance = (this.cashReceived || 0) - this.totalAmount;
  }

  // 3. Payment Status Auto-Update
  if (this.paymentMethod === 'online') {
    this.paymentStatus = 'paid';
  }

  // 4. Kitchen Status Aggregation
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

  // 5. Address/Customer Sync
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

// Added Socket Notification from snippet
orderSchema.post('save', function (doc) {
  try {
    const { getIO } = require('../socket.js');
    if (doc._id) {
      getIO().emit('ordersUpdated');
    }
  } catch (err) {
    // Silent catch if socket isn't ready
  }
});

export default mongoose.model("Order", orderSchema);
