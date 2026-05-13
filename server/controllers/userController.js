import User from '../models/userSchema.js';
import userService from '../services/userService.js';

class UserController {
  // --- USER FACING METHODS ---
  async getProfile(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.status(200).json({
        success: true,
        data: user
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

      // If this is the first address, make it default
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
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid current password' });
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

  async updateAvatar(req, res) {
    try {
      const userId = req.user._id;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image' });
      }
      const avatarPath = `/uploads/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarPath },
        { new: true }
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

  // --- ADMIN FACING METHODS ---
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
      
      // Real-time socket notification for status change
      try {
        const { emitAccountStatusUpdate } = await import('../socket.js');
        emitAccountStatusUpdate(user._id.toString(), user.isActive);
      } catch (err) {
        console.error('Socket notification failed:', err);
      }

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
