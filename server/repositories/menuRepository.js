import Menu from '../models/menuSchema.js';

class MenuRepository {
  async create(data) {
    return await Menu.create(data);
  }

  async getAll(filter = {}, skip = 0, limit = 0, sortOption = { createdAt: -1 }) {
    let query = Menu.find({ isBlocked: false, ...filter })
      .populate('category')
      .populate({
        path: 'variants.includedItems.menuItem',
        select: 'name'
      })
      .populate({
        path: 'variants.bogoItem',
        select: 'name image'
      })
      .populate({
        path: 'comboItems.menuItem',
        select: 'name variants'
      })
      .sort(sortOption);
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return await query;
  }

  async findAll() {
    return await Menu.find()
      .populate("category")
      .populate({
        path: 'variants.includedItems.menuItem',
        select: 'name'
      })
      .populate({
        path: 'variants.bogoItem',
        select: 'name image'
      })
      .populate({
        path: 'comboItems.menuItem',
        select: 'name variants'
      })
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Menu.findById(id)
      .populate('category')
      .populate({
        path: 'variants.includedItems.menuItem',
        select: 'name'
      })
      .populate({
        path: 'variants.bogoItem',
        select: 'name image'
      })
      .populate({
        path: 'comboItems.menuItem',
        select: 'name variants'
      });
  }

  async getByCategory(categoryId) {
    return await Menu.find({ category: categoryId, isBlocked: false })
      .populate('category')
      .populate({
        path: 'variants.includedItems.menuItem',
        select: 'name'
      })
      .populate({
        path: 'variants.bogoItem',
        select: 'name image'
      })
      .populate({
        path: 'comboItems.menuItem',
        select: 'name variants'
      });
  }

  async update(id, data) {
    return await Menu.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async delete(id) {
    return await Menu.findByIdAndDelete(id);
  }
}

export default new MenuRepository();
