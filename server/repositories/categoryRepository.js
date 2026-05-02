import Category from '../models/categorySchema.js';

class CategoryRepository {
  async getAll() {
    return await Category.find({ isActive: true });
  }

  async findById(id) {
    return await Category.findById(id);
  }
}

export default new CategoryRepository();
