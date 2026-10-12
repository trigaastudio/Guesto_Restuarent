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
    enum: ['pending', 'settled'], // pending = yet to be deducted, settled = deducted/cleared from wages
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
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const WageAdvance = mongoose.model('WageAdvance', wageAdvanceSchema);
export default WageAdvance;
