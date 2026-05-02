import Menu from '../models/menuSchema.js';

class MenuRepository {
  async getAll(filter = {}, skip = 0, limit = 0) {
    let query = Menu.find({ isBlocked: false, ...filter }).populate('category');
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return await query;
  }

  async findById(id) {
    return await Menu.findById(id).populate('category');
  }

  async getByCategory(categoryId) {
    return await Menu.find({ category: categoryId, isBlocked: false }).populate('category');
  }
}

export default new MenuRepository();
