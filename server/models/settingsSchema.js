import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // 1. Store Profile (The Identity Hub)
  restaurantDetails: {
    name: {
      type: String,
      default: 'Guesto Restaurant',
      trim: true
    },
    tagline: {
      type: String,
      default: 'Taste of Tradition',
      trim: true
    },
    contactNumber: {
      type: String,
      default: '7034805085,9947649007',
      trim: true
    },
    email: {
      type: String,
      default: 'restaurantguesto@gmail.com',
      trim: true
    },
    address: {
      type: String,
      default: 'Chammannur, Athirthi',
      trim: true
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },

  deliverySettings: {
    enabled: { type: Boolean, default: true },
    pricingType: { type: String, enum: ['zone', 'distance'], default: 'distance' },
    freeDistanceLimit: { type: Number, default: 5 },
    chargePerExtraKm: { type: Number, default: 10 },
    zones: [
      {
        name: { type: String, required: true },
        fee: { type: Number, required: true, default: 0 }
      }
    ]
  },

  // Branding (Logo System)
  branding: {
    logoGold: {
      type: String,
      default: '/logo-golden.png'
    },
    logoDark: {
      type: String,
      default: '/logo-dark.png'
    },
    logoMonochrome: {
      type: String,
      default: ''
    }
  },

  // 2. Operational Settings
  operationalSettings: {
    taxPercentage: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    preparationTime: { type: Number, default: 30 },
    isStoreOpen: { type: Boolean, default: true }
  },

  // 3. Payment Settings
  paymentSettings: {
    upiId: { type: String, default: '' },
    merchantName: { type: String, default: 'Guesto' },
    enableCOD: { type: Boolean, default: true },
    enableOnlinePayments: { type: Boolean, default: false }
  },

  // 4. Printing Settings
  printingSettings: {
    billHeader: { type: String, default: 'GUESTO RESTAURENT' },
    billFooter: { type: String, default: 'THANK YOU FOR VISITING!' }
  },

  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }
}, {
  timestamps: true
});

// Singleton helper
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
