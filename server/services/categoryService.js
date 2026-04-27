import categoryRepository from "../repositories/categoryRepository.js";

class CategoryService {
  async createCategory(data) {
    return await categoryRepository.create(data);
  }

  async getAllCategories() {
    return await categoryRepository.findAll();
  }

  async updateCategory(id, data) {
    return await categoryRepository.update(id, data);
  }

  async deleteCategory(id) {
    return await categoryRepository.delete(id);
  }
}

export default new CategoryService();
