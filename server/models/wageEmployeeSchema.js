import mongoose from 'mongoose';

const wageEmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    trim: true,
    default: 'Worker',
  },
  monthlyWage: {
    type: Number,
    default: 0,
    min: 0,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

const WageEmployee = mongoose.model('WageEmployee', wageEmployeeSchema);
export default WageEmployee;
