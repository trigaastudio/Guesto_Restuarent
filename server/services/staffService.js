import Staff from '../models/staffSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class StaffService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  async login(employeeId, password) {
    const staff = await Staff.findOne({ employeeId }).select('+password');
    if (!staff) {
      throw new Error('Invalid Employee ID or Password');
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid Employee ID or Password');
    }

    if (!staff.isActive) {
      throw new Error('Your account is deactivated. Please contact admin.');
    }

    return staff;
  }

  async getAllStaff() {
    return await Staff.find().sort({ createdAt: -1 });
  }

  async createStaff(staffData) {
    return await Staff.create(staffData);
  }

  async updateStaff(id, updateData) {
    // findByIdAndUpdate bypasses the pre-save hook, so hash password manually
    if (updateData.password && updateData.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password; // Don't update password if empty
    }
    return await Staff.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteStaff(id) {
    return await Staff.findByIdAndDelete(id);
  }
}

export default new StaffService();
