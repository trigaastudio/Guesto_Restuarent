import Category from '../models/categorySchema.js';

class CategoryRepository {
  async create(data) {
    return await Category.create(data);
  }

  async getAll() {
    return await Category.find({ isActive: true });
  }

  async findAll(filter = {}) {
    const pipeline = [];

    // Apply the initial filter/match stage if provided
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    pipeline.push(
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
          isSharedStock: 1,
          createdAt: 1,
          itemCount: { $size: "$menus" },
          totalStock: "$totalStock",
          stockactive: 1,
          hideFromCustomer: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    return await Category.aggregate(pipeline);
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
