import Category from '../models/categorySchema.js';

class CategoryRepository {
  async create(data) {
    return await Category.create(data);
  }

  async getAll() {
    return await Category.find({ isActive: true });
  }

  async findAll() {
    return await Category.aggregate([
      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "category",
          as: "menus"
        }
      },
      {
        $project: {
          name: 1,
          image: 1,
          isActive: 1,
          discountPercentage: 1,
          createdAt: 1,
          itemCount: { $size: "$menus" },
          totalStock: { $sum: "$menus.totalStock" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
