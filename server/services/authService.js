import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import userRepository from '../repositories/userRepository.js';
import mailSender from '../Utilities/mailSender.js';

const otps = new Map();

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
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
    
    const title = "Verification Code for GuestO";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #f59e0b; text-align: center;">Welcome to GuestO!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
          ${otp}
        </div>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `;
    await mailSender(email, title, body);
    return true;
  }

  async verifyOTP(email, otp) {
    const data = otps.get(email.toLowerCase());
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
      otps.delete(email);
      return false;
    }
    if (data.otp.toString().trim() === otp.toString().trim()) {
      otps.delete(email);
      return true;
    }
    return false;
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

  async login(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    if (user.role !== 'user') {
      const error = new Error('Access denied. Admin accounts cannot log in from the user portal.');
      error.statusCode = 403;
      throw error;
    }
    return user;
  }
}

export default new AuthService();
