import User from '../models/userSchema.js';
import bcrypt from 'bcrypt';

class UserService {
  async getAllUsers() {
    return await User.find({ role: 'user' }).sort({ createdAt: -1 });
  }

  async createUser(userData) {
    // 1. Validate that at least phone or email is present
    if (!userData.phone && !userData.email) {
      throw new Error('Either Phone or Email is required to create a user');
    }

    // 2. Check for duplicate phone
    if (userData.phone) {
      const existingPhone = await User.findOne({ phone: userData.phone });
      if (existingPhone) throw new Error(`User with phone ${userData.phone} already exists`);
    }

    // 3. Check for duplicate email
    if (userData.email) {
      const existingEmail = await User.findOne({ email: userData.email });
      if (existingEmail) throw new Error(`User with email ${userData.email} already exists`);
    }

    return await User.create(userData);
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
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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
