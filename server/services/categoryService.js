import categoryRepository from "../repositories/categoryRepository.js";
import { emitCategoryUpdate } from "../socket.js";

class CategoryService {
  async createCategory(data) {
    const result = await categoryRepository.create(data);
    emitCategoryUpdate();
    return result;
  }

  async getAllCategories() {
    return await categoryRepository.findAll();
  }

  async updateCategory(id, data) {
    const result = await categoryRepository.update(id, data);
    emitCategoryUpdate();
    return result;
  }

  async deleteCategory(id) {
    const result = await categoryRepository.delete(id);
    emitCategoryUpdate();
    return result;
  }
}

export default new CategoryService();
