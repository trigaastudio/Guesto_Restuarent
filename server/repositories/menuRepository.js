import Menu from '../models/menuSchema.js';

class MenuRepository {
  async create(data) {
    if (data.variants && data.variants.length > 0) {
      const prices = data.variants.map(v => v.price).filter(p => typeof p === 'number' && !isNaN(p));
      if (prices.length > 0) {
        data.price = Math.min(...prices);
      }
    }
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
        select: 'name variants totalStock isBlocked'
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
        select: 'name variants totalStock isBlocked'
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
        select: 'name variants totalStock isBlocked'
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
        select: 'name variants totalStock isBlocked'
      });
  }

  async update(id, data) {
    if (data.variants && data.variants.length > 0) {
      const prices = data.variants.map(v => v.price).filter(p => typeof p === 'number' && !isNaN(p));
      if (prices.length > 0) {
        data.price = Math.min(...prices);
      }
    }
    return await Menu.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async delete(id) {
    return await Menu.findByIdAndDelete(id);
  }
}

export default new MenuRepository();
