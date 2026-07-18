import User from '../models/userSchema.js';
import bcrypt from 'bcrypt';

class UserService {
  async getAllUsers() {
    return await User.find({ role: 'user' }).sort({ createdAt: -1 });
  }

  async createUser(userData) {
    // Only name + phone required; email and password are optional
    if (!userData.phone) {
      throw new Error('Phone number is required to create a user');
    }

    // Duplicate phone check
    if (userData.phone) {
      const existingPhone = await User.findOne({ phone: userData.phone });
      if (existingPhone) throw new Error(`User with phone ${userData.phone} already exists`);
    }

    // Duplicate email check (only if email provided)
    if (userData.email && userData.email.trim() !== '') {
      const existingEmail = await User.findOne({ email: userData.email });
      if (existingEmail) throw new Error(`User with email ${userData.email} already exists`);
    } else {
      delete userData.email; // Don't store empty string — would fail unique sparse index
    }

    // Password is fully optional for admin-created users
    // If provided, must be at least 6 chars
    if (userData.password && userData.password.trim() !== '') {
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
    } else {
      delete userData.password; // No password — user can log in via OTP/Google later
    }

    return await User.create({ ...userData, createdByAdmin: true });
  }

  async updateUser(id, updateData) {
    // 1. If updating phone/email, check for duplicates (excluding current user)
    if (updateData.phone) {
      const existingPhone = await User.findOne({ phone: updateData.phone, _id: { $ne: id } });
      if (existingPhone) throw new Error(`Phone ${updateData.phone} is already taken by another user`);
    }
    if (updateData.email) {
      const existingEmail = await User.findOne({ email: updateData.email, _id: { $ne: id } });
      if (existingEmail) throw new Error(`Email ${updateData.email} is already taken by another user`);
    }

    if (updateData.password && updateData.password.trim() !== '') {
      // Relaxed 6-char minimum for admin updates
      if (updateData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }
    return await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async toggleUserStatus(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.isActive = !user.isActive;
    await user.save();
    return user;
  }
}

export default new UserService();
