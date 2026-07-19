import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    required: true
  },
  orderSource: {
    type: String,
    required: true
  },
  orderStatus: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true
    },
    name: {
      type: String
    },
    size: {
      type: String,
      default: 'regular'
    },
    quantity: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    costPrice: {
      type: Number,
      required: true,
      default: 0
    }
  }],
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add index for fast querying by date and orderType
saleSchema.index({ createdAt: -1 });
saleSchema.index({ orderType: 1 });
saleSchema.index({ orderSource: 1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;