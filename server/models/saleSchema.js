const salesSchema = new mongoose.Schema({
  date: {
    type: String, 
    required: true,
    unique: true
  },

  totalRevenue: {
    type: Number,
    default: 0
  },

  totalOrders: {
    type: Number,
    default: 0
  },

  cash: {
    type: Number,
    default: 0
  },

  online: {
    type: Number,
    default: 0
  }

}, { timestamps: true });