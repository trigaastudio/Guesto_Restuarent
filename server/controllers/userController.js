import User from '../models/userSchema.js';
import userService from '../services/userService.js';
import authService from '../services/authService.js';
import { logAdminAction } from '../services/auditService.js';

class UserController {
  
  async getProfile(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const userObj = user.toObject();
      userObj.hasPassword = !!user.password;
      delete userObj.password;

      res.status(200).json({
        success: true,
        data: userObj
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addAddress(req, res) {
    try {
      const userId = req.user._id;
      const { name, phone, address, landmark, location, type, isDefault } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      
      const defaultStatus = user.addresses.length === 0 ? true : isDefault;

      user.addresses.push({ name, phone, address, landmark, location, type, isDefault: defaultStatus });
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Address added successfully',
        data: user.addresses
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAddresses(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      res.status(200).json({
        success: true,
        data: user ? user.addresses : []
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async setDefaultAddress(req, res) {
    try {
      const userId = req.user._id;
      const { addressId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.addresses.forEach(addr => {
        addr.isDefault = (addr._id.toString() === addressId);
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Default address updated',
        data: user.addresses
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateAddress(req, res) {
    try {
      const userId = req.user._id;
      const { addressId } = req.params;
      const { name, phone, address, landmark, location, type } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const addrIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
      if (addrIndex === -1) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }

      user.addresses[addrIndex] = {
        ...user.addresses[addrIndex].toObject(),
        name,
        phone,
        address,
        landmark,
        location,
        type
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: user.addresses
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const userId = req.user._id;
      const { addressId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
        data: user.addresses
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword, otp } = req.body;

      if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required' });
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required' });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid current password' });
        }
      }

      
      const isOtpValid = await authService.verifyOTP(user.email, otp);
      if (!isOtpValid) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const { name, phone } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      
      if (phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
        if (existingPhone) {
          return res.status(400).json({ success: false, message: 'Phone number already taken by another account' });
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { name, phone },
        { returnDocument: 'after', runValidators: true }
      ).select('-password');

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendChangeEmailOTP(req, res) {
    try {
      const { newEmail } = req.body;
      if (!newEmail) {
        return res.status(400).json({ success: false, message: 'New email address is required' });
      }
      await authService.sendChangeEmailOTP(newEmail);
      res.status(200).json({ success: true, message: 'Verification OTP sent to new email' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendChangePasswordOTP(req, res) {
    try {
      const email = req.user.email;
      await authService.sendChangePasswordOTP(email);
      res.status(200).json({ success: true, message: 'Verification OTP sent to your email' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async changeEmail(req, res) {
    try {
      const userId = req.user._id;
      const { currentPassword, newEmail, otp } = req.body;

      if (!newEmail) {
        return res.status(400).json({ success: false, message: 'New email is required' });
      }
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required' });
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required' });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid current password' });
        }
      }

      
      const isOtpValid = await authService.verifyOTP(newEmail, otp);
      if (!isOtpValid) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      
      const existingEmail = await User.findOne({ email: newEmail.toLowerCase().trim(), _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already taken by another account' });
      }

      user.email = newEmail.toLowerCase().trim();
      await user.save();

      
      const updatedUser = user.toObject();
      updatedUser.hasPassword = !!user.password;
      delete updatedUser.password;

      res.status(200).json({
        success: true,
        message: 'Email updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateAvatar(req, res) {
    try {
      const userId = req.user._id;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image' });
      }
      const avatarPath = req.file.path;
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarPath },
        { returnDocument: 'after' }
      ).select('-password');
      res.status(200).json({
        success: true,
        message: 'Profile picture updated',
        data: user
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createUser(req, res) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await logAdminAction(req, 'UPDATE_USER', 'User', user._id, { updatedFields: Object.keys(req.body) });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const user = await userService.deleteUser(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await logAdminAction(req, 'DELETE_USER', 'User', user._id, { email: user.email });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const user = await userService.toggleUserStatus(req.params.id);
      
      
      try {
        const { emitAccountStatusUpdate } = await import('../socket.js');
        emitAccountStatusUpdate(user._id.toString(), user.isActive);
      } catch (err) {
        console.error('Socket notification failed:', err);
      }

      await logAdminAction(req, 'TOGGLE_USER_STATUS', 'User', user._id, { newStatus: user.isActive ? 'Active' : 'Blocked' });

      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new UserController();
