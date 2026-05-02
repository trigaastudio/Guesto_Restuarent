import User from '../models/userSchema.js';
import bcrypt from 'bcrypt';

class UserService {
  async getAllUsers() {
    return await User.find({ role: 'user' }).sort({ createdAt: -1 });
  }

  async createUser(userData) {
    return await User.create(userData);
  }

  async updateUser(id, updateData) {
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
