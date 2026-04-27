import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing connection to:', process.env.MONGODB_URI.split('@')[1]); // Log host only for privacy
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('FULL ERROR:', err);
    process.exit(1);
  }
};

testConnection();
