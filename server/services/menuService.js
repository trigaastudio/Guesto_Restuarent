import menuRepository from "../repositories/menuRepository.js";

class MenuService {
  async createMenu(data) {
    return await menuRepository.create(data);
  }

  async getAllMenus() {
    return await menuRepository.findAll();
  }

  async updateMenu(id, data) {
    return await menuRepository.update(id, data);
  }

  async deleteMenu(id) {
    return await menuRepository.delete(id);
  }
}

export default new MenuService();
