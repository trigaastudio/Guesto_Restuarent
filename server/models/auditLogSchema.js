import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId
  },
  actionSource: {
    type: String,
    enum: ['user', 'admin', 'staff', 'waiter', 'kitchen', 'delivery', 'outside'],
    required: true
  },
  action: { 
    type: String, 
    required: true 
  },
  resource: {
    type: String,
    required: true 
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId 
  },
  details: { 
    type: Object 
  },
  ipAddress: {
    type: String
  },
  date: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
