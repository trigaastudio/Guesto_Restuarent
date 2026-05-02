import categoryRepository from '../repositories/categoryRepository.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryRepository.getAll();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
