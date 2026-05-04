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
    enum: ["dine-in", "takeaway", "delivery", "online"],
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
      enum: ["pending", "preparing", "ready"],
      default: "pending"
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
  totalAmount: { type: Number, default: 0 },
  cashReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  // Status Management
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "out-for-delivery", "delivered", "completed", "cancelled"],
    default: "placed"
  },

  kitchenStatus: {
    type: String,
    enum: ["pending", "preparing", "ready"],
    default: "pending"
  },

  isLocked: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["pending", "failed", "refunded", "completed"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "online", "cod"]
  }
}, { timestamps: true, strict: true });

// Pre-save hook: Data Consistency & Calculations
orderSchema.pre('save', async function () {
  // 1. Financial Calculations
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount')) {
    this.subtotal = this.items.reduce((acc, item) =>
      acc + (item.totalPrice || (item.price * item.quantity) || 0), 0
    );
    this.totalAmount = Math.max(0, this.subtotal + this.tax - this.discount);
  }

  // 2. Cash Balance Calculation
  if (this.paymentMethod === 'cash') {
    this.balance = (this.cashReceived || 0) - this.totalAmount;
  }



  // 4. Kitchen Status Aggregation
  if (this.items && this.items.length > 0) {
    const statuses = this.items.map(i => i.kitchenStatus);
    if (statuses.every(s => s === "ready")) {
      this.kitchenStatus = "ready";
    } else if (statuses.some(s => s === "preparing" || s === "ready")) {
      this.kitchenStatus = "preparing";
    } else {
      this.kitchenStatus = "pending";
    }

    // Auto-lock if kitchen starts
    if (this.kitchenStatus !== "pending") this.isLocked = true;
  }

  // 5. Address/Customer Sync (Bidirectional)
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
  } else if (this.isModified('address') && !this.isModified('customerDetails')) {
    let lat = null, lng = null;
    if (typeof this.address?.location === 'string') {
      const match = this.address.location.match(/q=([\d.-]+),([\d.-]+)/);
      if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
    }
    this.customerDetails = {
      ...this.customerDetails,
      name: this.address?.recipientName || "Walk-in",
      phone: this.address?.mobile || "",
      address: this.address?.address || "",
      location: lat && lng ? { lat, lng } : (this.address?.location || "")
    };
  }
});

export default mongoose.model("Order", orderSchema);
