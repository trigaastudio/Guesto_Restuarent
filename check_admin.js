import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/userSchema.js';

dotenv.config({ path: './server/.env' });

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const admin = await User.findOne({ email: 'restaurantguesto@gmail.com' });
    
    if (admin) {
      console.log('Admin found:');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('IsActive:', admin.isActive);
      
      // Note: We can't see the plain password, but we can check the role.
    } else {
      console.log('Admin NOT found in database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAdmin();
