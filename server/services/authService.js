import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  async register(userData) {
    const { email, phone } = userData;

   
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
