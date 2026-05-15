import menuRepository from "../repositories/menuRepository.js";
import { emitStockUpdate } from "../socket.js";

class MenuService {
  async createMenu(data) {
    return await menuRepository.create(data);
  }

  async getAllMenus() {
    return await menuRepository.findAll();
  }

  async updateMenu(id, data) {
    const updated = await menuRepository.update(id, data);
    if (updated) {
      emitStockUpdate(updated._id, updated.totalStock, updated.isBlocked);
    }
    return updated;
  }

  async deleteMenu(id) {
    return await menuRepository.delete(id);
  }
}

export default new MenuService();
