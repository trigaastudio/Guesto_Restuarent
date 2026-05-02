import menuRepository from '../repositories/menuRepository.js';

export const getMenus = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const menus = await menuRepository.getAll(filter, skip, parseInt(limit));
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
