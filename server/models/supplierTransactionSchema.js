import mongoose from 'mongoose';

const supplierTransactionSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required'],
    index: true,
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now,
    index: true,
  },
  type: {
    type: String,
    enum: ['expense', 'advance'], // expense = bill / purchase, advance = advance / payment paid
    required: [true, 'Transaction type is required'],
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit', 'Other'],
    default: 'Cash',
  },
  billNumber: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const SupplierTransaction = mongoose.model('SupplierTransaction', supplierTransactionSchema);
export default SupplierTransaction;
