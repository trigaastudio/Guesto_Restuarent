import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true
    },
    size: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  address: {
    recipientName: String,
    mobile: String,
    address: String,
    type: { type: String },
    location: String
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'processing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  subtotal: Number,
  deliveryFee: Number,
  platformFee: Number,
  totalAmount: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['online', 'dining', 'take-away'],
    default: 'online'
  },
  orderSource: {
    type: String,
    enum: ['user', 'admin', 'waiter', 'staff'],
    default: 'user'
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;