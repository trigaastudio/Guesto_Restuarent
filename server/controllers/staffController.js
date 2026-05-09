import staffService from '../services/staffService.js';

class StaffController {
  async login(req, res) {
    try {
      const { employeeId, password } = req.body;
      const staff = await staffService.login(employeeId, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: staff._id,
          name: staff.name,
          employeeId: staff.employeeId,
          role: staff.role,
          token: staffService.generateToken(staff._id)
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllStaff(req, res) {
    try {
      const staff = await staffService.getAllStaff();
      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createStaff(req, res) {
    try {
      const staff = await staffService.createStaff(req.body);
      res.status(201).json({
        success: true,
        message: 'Staff created successfully',
        data: staff
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateStaff(req, res) {
    try {
      const staff = await staffService.updateStaff(req.params.id, req.body);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff not found'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Staff updated successfully',
        data: staff
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteStaff(req, res) {
    try {
      const staff = await staffService.deleteStaff(req.params.id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff not found'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Staff deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async requestCredentialChange(req, res) {
    try {
      const { currentPassword, logoUrl } = req.body;
      const staffId = req.user._id; // Take ID from verified token
      const result = await staffService.requestCredentialChange(staffId, currentPassword, logoUrl);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async verifyCredentialChange(req, res) {
    try {
      const { otp, newEmail, newPassword } = req.body;
      const staffId = req.user._id; // Take ID from verified token
      const result = await staffService.verifyAndChangeCredentials(staffId, otp, newEmail, newPassword);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new StaffController();
