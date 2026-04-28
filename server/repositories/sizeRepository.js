import Size from "../models/sizeSchema.js";

class SizeRepository {
  async create(data) {
    return await Size.create(data);
  }

  async findAll() {
    return await Size.find().sort({ value: 1 });
  }

  async findById(id) {
    return await Size.findById(id);
  }

  async update(id, data) {
    return await Size.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async delete(id) {
    return await Size.findByIdAndDelete(id);
  }
}

export default new SizeRepository();
