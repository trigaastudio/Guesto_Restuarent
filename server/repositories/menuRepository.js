import Menu from '../models/menuSchema.js';

class MenuRepository {
  async create(data) {
    return await Menu.create(data);
  }

  async getAll(filter = {}, skip = 0, limit = 0) {
    let query = Menu.find({ isBlocked: false, ...filter }).populate('category');
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return await query;
  }

  async findAll() {
    return await Menu.find().populate("category").sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Menu.findById(id).populate('category');
  }

  async getByCategory(categoryId) {
    return await Menu.find({ category: categoryId, isBlocked: false }).populate('category');
  }

  async update(id, data) {
    return await Menu.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Menu.findByIdAndDelete(id);
  }
}

export default new MenuRepository();
