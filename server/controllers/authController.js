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
          role: user.role,
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
      const user = await authService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
      const { token } = req.body;
      const user = await authService.googleLogin(token);
      
      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
      const { email } = req.body;
      await authService.sendOTP(email);
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
          role: user.role,
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
}

export default new AuthController();
