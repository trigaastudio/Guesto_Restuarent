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
    type: Number, // Percentage for discount, or flat value
    default: 0
  },
  minQuantity: {
    type: Number, // Minimum quantity required to trigger the offer
    default: 1
  },
  bannerImage: {
    type: String, // URL of the poster
    required: true
  },
  cloudinaryPublicId: {
    type: String
  },
  // Scheduling logic
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
  // Target items or categories
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
    default: 0 // Higher priority banners show first
  }
}, { timestamps: true });

export default mongoose.model('Offer', offerSchema);
