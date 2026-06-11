import menuRepository from '../repositories/menuRepository.js';
import menuService from "../services/menuService.js";
import mongoose from "mongoose";
import { logAdminAction } from '../services/auditService.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 120, useClones: false }); 
export const menuCache = cache; 

export const createMenu = async (req, res) => {
  try {
    const menu = await menuService.createMenu(req.body);
    
    await logAdminAction(req, 'CREATE_MENU', 'Menu', menu._id, { name: menu.name, price: menu.price });
    cache.flushAll();

    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMenus = async (req, res) => {
  try {
    const { category, page, limit, all, search, dietary } = req.query;
    const sortBy = req.query.sortBy || req.query.sort;

    const cacheKey = JSON.stringify(req.query);
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.status(200).json(cachedData);

    if (all === 'true') {
      const menus = await menuService.getAllMenus();
      cache.set(cacheKey, menus);
      return res.status(200).json(menus);
    }

    let filter = {};
    
    
    const Category = mongoose.model('Category');
    const activeCategories = await Category.find({ isActive: { $ne: false } }).select('_id');
    const activeCategoryIds = activeCategories.map(c => c._id);

    if (category && category !== 'all') {
      
      if (activeCategoryIds.some(id => id.toString() === category)) {
        filter.category = category;
      } else {
        
        filter.category = null;
      }
    } else {
      
      filter.category = { $in: activeCategoryIds };
    }

    if (req.query.offerId) {
      const Offer = mongoose.model('Offer');
      const offer = await Offer.findById(req.query.offerId);
      if (offer) {
        const itemIds = offer.applicableItems?.map(i => i.menuItem) || [];
        const categoryIds = offer.applicableCategories || [];
        
        if (itemIds.length > 0 || categoryIds.length > 0) {
          filter.$or = [
            { _id: { $in: itemIds } },
            { category: { $in: categoryIds } }
          ];
        } else {
          
          if (offer.offerType === 'bogo') {
            filter['variants.isBOGO'] = true;
          } else if (offer.offerType === 'combo') {
            filter.isCombo = true;
          } else if (offer.offerType === 'discount') {
            const Category = mongoose.model('Category');
            const discountedCategories = await Category.find({ discountPercentage: { $gt: 0 } }).select('_id');
            const discountedCategoryIds = discountedCategories.map(c => c._id);
            
            filter.$or = [
                { discountPercentage: { $gt: 0 } },
                { category: { $in: discountedCategoryIds } }
            ];
          }
        }
      }
    }

    if (req.query.bogo === 'true') {
      filter['variants.isBOGO'] = true;
    }

    if (req.query.combo === 'true') {
      filter.isCombo = true;
    }
    
    if (req.query.discount === 'true') {
      const Category = mongoose.model('Category');
      const discountedCategories = await Category.find({ discountPercentage: { $gt: 0 } }).select('_id');
      const discountedCategoryIds = discountedCategories.map(c => c._id);
      
      filter.$or = [
          { discountPercentage: { $gt: 0 } },
          { category: { $in: discountedCategoryIds } }
      ];
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (dietary && dietary !== 'all') {
      filter.foodType = dietary;
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price-low') {
      sortOption = { price: 1 };
    } else if (sortBy === 'price-high') {
      sortOption = { price: -1 };
    } else if (sortBy === 'name-az') {
      sortOption = { name: 1 };
    } else if (sortBy === 'rating') {
      sortOption = { salesCount: -1 };
    }

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const menus = await menuRepository.getAll(filter, skip, parseInt(limit), sortOption);
      cache.set(cacheKey, menus);
      return res.status(200).json(menus);
    }

    const menus = await menuRepository.getAll(filter, 0, 0, sortOption);
    cache.set(cacheKey, menus);
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
    
    await logAdminAction(req, 'UPDATE_MENU', 'Menu', menu._id, { updatedFields: Object.keys(req.body) });
    cache.flushAll();

    res.status(200).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    await menuService.deleteMenu(req.params.id);

    await logAdminAction(req, 'DELETE_MENU', 'Menu', req.params.id, {});
    cache.flushAll();

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
