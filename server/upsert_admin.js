import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userSchema.js';

dotenv.config();

const upsertAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const email = 'restaurantguesto@gmail.com';
    const password = 'guesto@07';
    
    let admin = await User.findOne({ email });
    
    if (admin) {
      console.log('Admin exists, updating password and ensuring role...');
      admin.password = password;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log('Admin updated successfully.');
    } else {
      console.log('Admin does not exist, creating new admin...');
      admin = new User({
        name: 'Guesto Admin',
        email,
        password,
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('Admin created successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

upsertAdmin();
