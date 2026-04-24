import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('IP')) {
      console.log('👉 TIP: Make sure your current IP address is whitelisted in MongoDB Atlas Network Access.');
    }
    process.exit(1);
  }
};

export default connectDB;
