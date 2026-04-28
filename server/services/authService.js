import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import mailSender from '../Utilities/mailSender.js';

const otps = new Map();

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  async sendOTP(email) {
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
      otps.delete(email.toLowerCase());
      return false;
    }
    if (data.otp.toString().trim() === otp.toString().trim()) {
      otps.delete(email.toLowerCase());

      return true;
    }
    return false;
  }

  async googleLogin(token) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      const payload = await response.json();

      if (!payload || payload.error || !payload.email) {
        throw new Error(payload?.error_description || 'Invalid Google token');
      }

      const { email, name } = payload;
      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          name,
          email,
          password: Math.random().toString(36).slice(-10),
          role: 'user',
          isActive: true
        });
      }

      if (user.role !== 'user') {
        const error = new Error('Access denied. Admin accounts cannot use Google login here.');
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

  // Updated to handle both User and Admin logins
  async login(email, password, requiredRole = 'user') {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    
    // Role validation
    if (requiredRole === 'admin' && user.role !== 'admin') {
      const error = new Error('Access denied. Not an administrator.');
      error.statusCode = 403;
      throw error;
    }
    
    if (requiredRole === 'user' && user.role !== 'user') {

      const error = new Error('Access denied. Admin accounts cannot log in from the user portal.');
      error.statusCode = 403;
      throw error;
    }
    return user;
  }
}

export default new AuthService();
