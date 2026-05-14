import authService from '../services/authService.js';

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password, 'user');
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password, 'admin');
      
      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async googleLogin(req, res) {
    try {
      console.log('📬 Received Google login request...');
      const { token } = req.body;
      if (!token) {
        console.error('❌ No token provided in request body');
        return res.status(400).json({ success: false, message: 'No token provided' });
      }
      const user = await authService.googleLogin(token);

      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async sendOTP(req, res) {
    try {
      const { email, phone } = req.body;

      await authService.sendOTP(email, phone);
      res.status(200).json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async registerWithOTP(req, res) {
    try {
      const { email, otp, userData } = req.body;
      const isOTPValid = await authService.verifyOTP(email, otp);

      if (!isOTPValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      const user = await authService.register(userData);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async sendPasswordResetOTP(req, res) {
    try {
      const { email } = req.body;
      await authService.sendPasswordResetOTP(email);
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyPasswordResetOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const isValid = await authService.verifyOTP(email, otp);
      if (isValid) {
        res.status(200).json({ success: true, message: 'OTP verified' });
      } else {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      await authService.resetPassword(email, newPassword);
      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();
