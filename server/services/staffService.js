import Staff from '../models/staffSchema.js';
import User from '../models/userSchema.js';
import OTP from '../models/otpSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    return await Staff.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
  }

  async deleteStaff(id) {
    return await Staff.findByIdAndDelete(id);
  }

  async requestCredentialChange(staffId, currentPassword, logoUrl) {
    let account = await Staff.findById(staffId).select('+password');
    if (!account) {
      account = await User.findById(staffId).select('+password');
    }

    if (!account) throw new Error('Account not found');

    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) throw new Error('Invalid current password');

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save to OTP collection (email is used as identifier)
    await OTP.create({ email: account.email, otp, logoUrl });

    return { message: 'OTP sent to your email' };
  }

  async verifyAndChangeCredentials(staffId, otp, newEmail, newPassword) {
    let account = await Staff.findById(staffId);
    if (!account) {
      account = await User.findById(staffId);
    }

    if (!account) throw new Error('Account not found');

    // Find latest OTP for this account's email
    const otpDoc = await OTP.findOne({ email: account.email }).sort({ createdAt: -1 });
    if (!otpDoc || otpDoc.otp !== otp) {
      throw new Error('Invalid or expired OTP');
    }

    // Update credentials
    if (newEmail) account.email = newEmail;
    if (newPassword) account.password = newPassword; // Pre-save hook will handle hashing

    await account.save();
    await OTP.deleteMany({ email: account.email }); // Clear OTPs

    return { message: 'Credentials updated successfully' };
  }
}

export default new StaffService();
