import menuRepository from '../repositories/menuRepository.js';
import menuService from "../services/menuService.js";

export const createMenu = async (req, res) => {
  try {
    const menu = await menuService.createMenu(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMenus = async (req, res) => {
  try {
    const { category, page, limit, all } = req.query;

    if (all === 'true') {
      const menus = await menuService.getAllMenus();
      return res.status(200).json(menus);
    }

    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const menus = await menuRepository.getAll(filter, skip, parseInt(limit));
      return res.status(200).json(menus);
    }

    const menus = await menuRepository.getAll(filter);
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenuById = async (req, res) => {
  try {
    const menu = await menuRepository.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const menu = await menuService.updateMenu(req.params.id, req.body);
    res.status(200).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    await menuService.deleteMenu(req.params.id);
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
