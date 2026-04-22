const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null
  },

  deliveryStatus: {
    type: String,
    enum: ["pending", "assigned", "out-for-delivery", "delivered"],
    default: "pending"
  }

}, { timestamps: true });