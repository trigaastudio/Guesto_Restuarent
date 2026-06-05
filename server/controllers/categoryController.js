import categoryRepository from '../repositories/categoryRepository.js';
import categoryService from "../services/categoryService.js";
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, useClones: false });

export const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    cache.flushAll();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const cacheKey = 'all_categories';
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.status(200).json(cachedData);

    const categories = categoryService 
      ? await categoryService.getAllCategories() 
      : await categoryRepository.getAll();
    
    cache.set(cacheKey, categories);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    cache.flushAll();
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    cache.flushAll();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
