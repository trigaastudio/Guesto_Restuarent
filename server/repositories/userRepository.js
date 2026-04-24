import User from '../models/userSchema.js';

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findByEmailWithPassword(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findByPhone(phone) {
    return await User.findOne({ phone });
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }
}

export default new UserRepository();
