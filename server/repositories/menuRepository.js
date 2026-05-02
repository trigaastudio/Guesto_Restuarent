import Menu from "../models/menuSchema.js";

class MenuRepository {
  async create(data) {
    return await Menu.create(data);
  }

  async findAll() {
    return await Menu.find().populate("category").sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Menu.findById(id).populate("category");
  }

  async update(id, data) {
    return await Menu.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async delete(id) {
    return await Menu.findByIdAndDelete(id);
  }
}

export default new MenuRepository();
