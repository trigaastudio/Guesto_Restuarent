import mongoose from 'mongoose';

const wageAdvanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WageEmployee',
    required: [true, 'Employee is required'],
    index: true,
  },
  date: {
    type: Date,
    required: [true, 'Advance date is required'],
    default: Date.now,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Advance amount is required'],
    min: [0, 'Amount must be positive'],
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Balance amount cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash',
  },
  reason: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'settled'],
    default: 'pending',
    index: true,
  },
  settledDate: {
    type: Date,
  },
  settledNotes: {
    type: String,
    trim: true,
    default: '',
  },
  payments: [{
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const WageAdvance = mongoose.model('WageAdvance', wageAdvanceSchema);
export default WageAdvance;
