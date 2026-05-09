import Category from '../models/categorySchema.js';

class CategoryRepository {
  async create(data) {
    return await Category.create(data);
  }

  async getAll() {
    return await Category.find({ isActive: true });
  }

  async findAll() {
    return await Category.find().sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
