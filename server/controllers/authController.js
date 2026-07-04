import authService from '../services/authService.js';




const setAuthCookie = (res, role, token) => {
  const cookieName = role === 'admin' ? 'admin_token' : role === 'user' ? 'token' : 'staff_token';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
};

class AuthController {
  async logout(req, res) {
    res.clearCookie('token');
    res.clearCookie('admin_token');
    res.clearCookie('staff_token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      
      
      const jwtToken = authService.generateToken(user._id);
      setAuthCookie(res, user.role, jwtToken);

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
          token
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
      
      const token = authService.generateToken(user._id);
      setAuthCookie(res, user.role, token);

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
          token
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
      
      const token = authService.generateToken(user._id);
      setAuthCookie(res, user.role, token);

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
          token
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
      if (!token) {
        return res.status(400).json({ success: false, message: 'No token provided' });
      }
      const user = await authService.googleLogin(token);
      const jwtToken = authService.generateToken(user._id);
      setAuthCookie(res, user.role, jwtToken);

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
          token: jwtToken
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
      
      const token = authService.generateToken(user._id);
      setAuthCookie(res, user.role, token);

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
          token
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
      
      res.status(200).json({ success: true, message: 'If this email is registered, an OTP will be sent.' });
    }
  }

  async verifyPasswordResetOTP(req, res) {
    try {
      const { email, otp } = req.body;
      
      
      const resetToken = await authService.verifyOTPAndGetResetToken(email, otp);
      if (resetToken) {
        res.status(200).json({ success: true, message: 'OTP verified', resetToken });
      } else {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, newPassword, resetToken } = req.body;
      
      
      await authService.resetPasswordWithToken(email, newPassword, resetToken);
      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

}

export default new AuthController();
