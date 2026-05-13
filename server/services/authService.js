import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import userRepository from '../repositories/userRepository.js';
import mailSender from '../Utilities/mailSender.js';
import Settings from '../models/settingsSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const otps = new Map();

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  async _sendStylishEmail(email, title, headerText, subText, otp, settings) {
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    // Explicitly use the golden logo from public folder for maximum visibility in all modes
    let primaryLogoPath = '/logo-golden.png';
    
    const attachments = [];
    let logoSrc = '';

    // Function to handle logo resolution
    const resolveLogo = (logoPathToUse, cidName) => {
      const logoFileName = 'logo-golden.png';
      const logoPath = path.join(__dirname, '..', '..', 'client', 'public', logoFileName);
        
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: logoFileName,
          path: logoPath,
          cid: cidName
        });
        return `cid:${cidName}`;
      }
      return '';
    };

    logoSrc = resolveLogo(primaryLogoPath, 'restaurantLogo');

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
    // Check if user already exists with this email
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    // Check if user already exists with this phone
    if (phone) {
      const existingPhone = await userRepository.findByPhone(phone);
      if (existingPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otps.set(email.toLowerCase(), { otp, expiresAt });

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
    const data = otps.get(email.toLowerCase());
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
      otps.delete(email.toLowerCase());
      return false;
    }
    if (data.otp.toString().trim() === otp.toString().trim()) {
      otps.delete(email.toLowerCase());
      return true;
    }
    return false;
  }

  async sendPasswordResetOTP(email) {
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otps.set(email.toLowerCase(), { otp, expiresAt });

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

  async googleLogin(token) {
    try {
      console.log('🚀 Starting Google login with token...');

      // Create a local client instance for thread-safety and set credentials
      const oauth2Client = new OAuth2Client();
      oauth2Client.setCredentials({ access_token: token });

      // Use the library's request mechanism which handles SSL better than default fetch
      const response = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo'
      });

      const payload = response.data;

      if (!payload || !payload.email) {
        console.error('❌ Google API Error: Invalid payload', payload);
        throw new Error('Failed to retrieve user info from Google');
      }

      console.log('✅ Google User Info retrieved:', payload.email);

      const { email, name, picture } = payload;
      let user = await userRepository.findByEmail(email);

      if (!user) {
        console.log('👤 Creating new user from Google info...');
        user = await userRepository.create({
          name,
          email,
          password: Math.random().toString(36).slice(-10),
          role: 'user',
          isActive: true
        });
      }

      if (user.role !== 'user') {
        console.warn('🚫 Non-user role attempted Google login:', user.role);
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
      console.error('🔥 Google Login Service Error:', error.message);
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  async checkExistingUser(email) {
    return await userRepository.findByEmail(email);
  }

  async register(userData) {
    const { email, phone } = userData;

    console.log(`🔍 Checking registration for Email: "${email}" and Phone: "${phone}"`);

    const existingUserByEmail = await userRepository.findByEmail(email);
    if (existingUserByEmail) {
      console.log(`❌ Match found for email: ${email}`);
      throw new Error('User with this email already exists');
    }

    const existingUserByPhone = await userRepository.findByPhone(phone);
    if (existingUserByPhone) {
      console.log(`❌ Match found for phone: ${phone}`);
      throw new Error('User with this phone number already exists');
    }

    console.log(`✅ No existing user found. Creating new user...`);
    return await userRepository.create(userData);
  }

  async login(email, password, requiredRole = 'user') {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (requiredRole && user.role !== requiredRole) {
      const errorMessage = requiredRole === 'admin' 
        ? 'Access denied. Only admin accounts can log in here.' 
        : 'Access denied. Admin accounts cannot log in from the user portal.';
      const error = new Error(errorMessage);
      error.statusCode = 403;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    return user;
  }

  async resetPassword(email, newPassword) {
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
