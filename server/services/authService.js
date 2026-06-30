import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import userRepository from '../repositories/userRepository.js';
import mailSender from '../Utilities/mailSender.js';
import Settings from '../models/settingsSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import OTP from '../models/otpSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  async _sendStylishEmail(email, title, headerText, subText, otp, settings) {
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    const attachments = [];
    const frontendUrl = process.env.FRONTEND_URL || 'https://guestorestaurant.in';
    const logoSrc = `${frontendUrl}/logo-golden.png`;

    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000000;">
          <div style="background-color: #0a0a0a; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; border: 1px solid #1a1a1a;">
            <div style="margin-bottom: 30px;">
              ${logoSrc ? `<img src="${logoSrc}" alt="${restaurantName}" style="height: 60px; width: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">` : ''}
            </div>
            
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px;">${headerText}</h1>
            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">
              ${subText}
            </p>
            
            <div style="background-color: #B91C1C; color: #ffffff; padding: 25px; border-radius: 20px; font-size: 36px; font-weight: 900; letter-spacing: 12px; margin-bottom: 35px; box-shadow: 0 8px 20px rgba(185, 28, 28, 0.4);">
              ${otp}
            </div>
            
            <p style="color: #666666; font-size: 12px; font-weight: 600; text-transform: uppercase; tracking-wider;">
              Valid for 5 minutes only
            </p>
            
            <div style="margin-top: 40px; pt-30px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
              <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 5px;">If you didn't request this code, you can safely ignore this email.</p>
              <p style="color: #ffffff; font-size: 14px; font-weight: 800;">Team ${restaurantName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailSender(email, title, body, attachments);
  }

  async sendOTP(email, phone) {
    
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    
    if (phone) {
      const existingPhone = await userRepository.findByPhone(phone);
      if (existingPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    
    const otp = crypto.randomInt(100000, 999999).toString();
    await OTP.updateOne(
      { email: email.toLowerCase() },
      { $set: { otp, createdAt: Date.now(), attempts: 0 } },
      { upsert: true }
    );

    const settings = await Settings.getSettings();
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    await this._sendStylishEmail(
      email, 
      `Verify your account with ${restaurantName}`,
      "Verification Code",
      `Thank you for choosing <strong>${restaurantName}</strong>. Please use the following code to complete your registration.`,
      otp,
      settings
    );
    return true;
  }

  async verifyOTP(email, otp) {
    const data = await OTP.findOne({ email: email.toLowerCase() });
    if (!data) return false;

    
    if (data.attempts >= 3) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      throw new Error('OTP invalidated due to too many failed attempts. Please request a new OTP.');
    }

    if (data.otp.toString().trim() === otp.toString().trim()) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return true;
    }

    
    await OTP.updateOne({ email: email.toLowerCase() }, { $inc: { attempts: 1 } });
    return false;
  }

  
  
  async verifyOTPAndGetResetToken(email, otp) {
    const isValid = await this.verifyOTP(email, otp);
    if (!isValid) return null;

    
    const resetToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    return resetToken;
  }

  async sendPasswordResetOTP(email) {
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      
      return true;
    }

    
    const otp = crypto.randomInt(100000, 999999).toString();
    await OTP.updateOne(
      { email: email.toLowerCase() },
      { $set: { otp, createdAt: Date.now(), attempts: 0 } },
      { upsert: true }
    );

    const settings = await Settings.getSettings();
    const restaurantName = settings.restaurantDetails.name || "GuestO";

    await this._sendStylishEmail(
      email,
      `Password Reset for ${restaurantName}`,
      "Reset Your Password",
      `You requested to reset your password. Please use the following code to verify your identity.`,
      otp,
      settings
    );
    return true;
  }

  async sendChangeEmailOTP(newEmail) {
    const existing = await userRepository.findByEmail(newEmail.toLowerCase().trim());
    if (existing) {
      throw new Error('User with this email already exists');
    }

    
    const otp = crypto.randomInt(100000, 999999).toString();
    await OTP.updateOne(
      { email: newEmail.toLowerCase() },
      { $set: { otp, createdAt: Date.now(), attempts: 0 } },
      { upsert: true }
    );

    const settings = await Settings.getSettings();
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    await this._sendStylishEmail(
      newEmail, 
      `Verify your new email for ${restaurantName}`,
      "Verify New Email",
      `Please use the following verification code to change your email to this address.`,
      otp,
      settings
    );
    return true;
  }

  async sendChangePasswordOTP(email) {
    
    const otp = crypto.randomInt(100000, 999999).toString();
    await OTP.updateOne(
      { email: email.toLowerCase() },
      { $set: { otp, createdAt: Date.now(), attempts: 0 } },
      { upsert: true }
    );

    const settings = await Settings.getSettings();
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    await this._sendStylishEmail(
      email, 
      `Change Password Verification - ${restaurantName}`,
      "Verification Code",
      `Please use the following verification code to authorize changing your password.`,
      otp,
      settings
    );
    return true;
  }

  async googleLogin(token) {
    try {
      
      
      
      
      
      const oauth2Client = new OAuth2Client();
      oauth2Client.setCredentials({ access_token: token });

      const response = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo'
      });

      const payload = response.data;

      if (!payload || !payload.email) {
        throw new Error('Failed to retrieve user info from Google');
      }

      const { email, name, picture, sub } = payload;
      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          name,
          email,
          googleId: sub,
          role: 'user',
          isActive: true
        });
      }

      if (user.role !== 'user') {
        const error = new Error('Access denied. Admin accounts cannot use Google login here.');
        error.statusCode = 403;
        throw error;
      }

      if (!user.isActive) {
        const error = new Error('Your account has been deactivated. Please contact support.');
        error.statusCode = 403;
        throw error;
      }

      return user;
    } catch (error) {
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  async checkExistingUser(email) {
    return await userRepository.findByEmail(email);
  }

  async register(userData) {
    const { email, phone, password } = userData;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,64}$/;
    
    if (!password || !passwordRegex.test(password)) {
      throw new Error('Password must be 8-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    const existingUserByEmail = await userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUserByPhone = await userRepository.findByPhone(phone);
    if (existingUserByPhone) {
      throw new Error('User with this phone number already exists');
    }

    return await userRepository.create(userData);
  }

  async login(email, password, requiredRole = 'user') {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (requiredRole) {
      const isAdminType = user.role === 'admin' || user.role === 'staff';
      const isUserType = user.role === 'user';

      if (requiredRole === 'admin' && !isAdminType) {
        const error = new Error('Access denied. Only admin or staff accounts can log in here.');
        error.statusCode = 403;
        throw error;
      }

      if (requiredRole === 'user' && !isUserType) {
        const error = new Error('Access denied. Admin accounts cannot log in from the user portal.');
        error.statusCode = 403;
        throw error;
      }
    }

    if (!user.isActive) {
      const error = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    return user;
  }

  
  
  async resetPasswordWithToken(email, newPassword, resetToken) {
    if (!resetToken) {
      throw new Error('Reset token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      throw new Error('Invalid or expired reset token. Please request a new OTP.');
    }

    if (decoded.purpose !== 'password_reset' || decoded.email !== email.toLowerCase().trim()) {
      throw new Error('Invalid reset token');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,64}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      throw new Error('Password must be 8-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    const user = await userRepository.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
    return true;
  }

  
  async resetPassword(email, newPassword) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,64}$/;

    if (!newPassword || !passwordRegex.test(newPassword)) {
      throw new Error('Password must be 8-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    const user = await userRepository.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
    return true;
  }
}

export default new AuthService();
