import mongoose from 'mongoose';
import dotenv from 'dotenv';
import socketPlugin from '../plugins/socketPlugin.js';


mongoose.plugin(socketPlugin);

import Menu from '../models/menuSchema.js';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    
    try {
      const items = await Menu.find({});
      let count = 0;
      for (const item of items) {
        let changed = false;
        if (item.variants && item.variants.length > 0) {
          const prices = item.variants.map(v => v.price).filter(p => typeof p === 'number' && !isNaN(p));
          if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            if (item.price !== minPrice) {
              item.price = minPrice;
              changed = true;
            }
          }
        }
        if (changed) {
          await item.save();
          count++;
        }
      }
      if (count > 0) {
        console.log(`🧹 Migration: Corrected ${count} menu item root prices based on variant minimums.`);
      }
    } catch (migErr) {
      console.error('⚠️ Price Migration Error:', migErr);
    }

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('IP')) {
      console.log('👉 TIP: Make sure your current IP address is whitelisted in MongoDB Atlas Network Access.');
    }
    process.exit(1);
  }
};

export default connectDB;
