import sizeRepository from "../repositories/sizeRepository.js";

class SizeService {
  async createSize(data) {
    return await sizeRepository.create(data);
  }

  async getAllSizes() {
    return await sizeRepository.findAll();
  }

  async updateSize(id, data) {
    return await sizeRepository.update(id, data);
  }

  async deleteSize(id) {
    return await sizeRepository.delete(id);
  }
}

export default new SizeService();
