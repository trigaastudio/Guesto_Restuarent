import authService from '../services/authService.js';

// Helper to set the correct auth cookie
// HIGH-7 FIX: sameSite changed from 'lax' to 'strict'
// HIGH-7 FIX: Admin tokens expire in 8h, user tokens in 7 days (was 30 days for all)
const setAuthCookie = (res, role, token) => {
  const cookieName = role === 'admin' ? 'admin_token' : role === 'staff' ? 'staff_token' : 'token';
  const isAdmin = role === 'admin' || role === 'staff';

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',                                      // HIGH-7 FIX: was 'lax'
    maxAge: isAdmin
      ? 8 * 60 * 60 * 1000                                  // Admin/Staff: 8 hours
      : 7 * 24 * 60 * 60 * 1000                             // User: 7 days (was 30 days)
  });

  return cookieName;
};

class AuthController {
  async logout(req, res) {
    // Clear all possible auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    res.clearCookie('token', cookieOptions);
    res.clearCookie('admin_token', cookieOptions);
    res.clearCookie('staff_token', cookieOptions);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      // CRIT-3 FIX: Was using undefined variable 'token' as fallback
      // Now uses a single clearly-named variable with no ambiguous ternary
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
          createdAt: user.createdAt
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
      // CRIT-3 FIX: Was using undefined variable 'jwtToken' as condition
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
          createdAt: user.createdAt
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
      // CRIT-3 FIX: Was using undefined variable 'jwtToken' as condition
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
          createdAt: user.createdAt
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
          createdAt: user.createdAt
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
      // CRIT-3 FIX: Was using undefined variable 'jwtToken' as fallback
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
          createdAt: user.createdAt
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
      // MED-8 FIX: Don't reveal whether an email exists — use generic message
      res.status(200).json({ success: true, message: 'If this email is registered, an OTP will be sent.' });
    }
  }

  async verifyPasswordResetOTP(req, res) {
    try {
      const { email, otp } = req.body;
      // MED-8 FIX: After OTP verification, generate a short-lived signed reset token
      // This links the OTP verification step to the actual password reset — prevents bypassing OTP
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
      // MED-8 FIX: Now requires a valid resetToken issued after OTP verification
      // Previously, this endpoint could be called directly without OTP verification
      await authService.resetPasswordWithToken(email, newPassword, resetToken);
      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();
