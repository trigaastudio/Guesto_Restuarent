import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  offerType: {
    type: String,
    enum: ['bogo', 'discount', 'combo'],
    required: true
  },
  offerValue: {
    type: Number, 
    default: 0
  },
  minQuantity: {
    type: Number, 
    default: 1
  },
  bannerImage: {
    type: String, 
    required: true
  },
  cloudinaryPublicId: {
    type: String
  },
  
  isWeekendOnly: {
    type: Boolean,
    default: false
  },
  specificDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  
  applicableItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu'
    },
    selectedSize: {
      type: String,
      default: '' // Empty means all sizes or no specific size required
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  priority: {
    type: Number,
    default: 0 
  }
}, { timestamps: true });

export default mongoose.model('Offer', offerSchema);
