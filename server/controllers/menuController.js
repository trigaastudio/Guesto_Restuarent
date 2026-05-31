import menuRepository from '../repositories/menuRepository.js';
import menuService from "../services/menuService.js";
import mongoose from "mongoose";

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
    const { category, page, limit, all, search, dietary } = req.query;
    const sortBy = req.query.sortBy || req.query.sort;

    if (all === 'true') {
      const menus = await menuService.getAllMenus();
      return res.status(200).json(menus);
    }

    let filter = {};
    
    // Fetch active categories
    const Category = mongoose.model('Category');
    const activeCategories = await Category.find({ isActive: { $ne: false } }).select('_id');
    const activeCategoryIds = activeCategories.map(c => c._id);

    if (category && category !== 'all') {
      // Ensure specific category is active
      if (activeCategoryIds.some(id => id.toString() === category)) {
        filter.category = category;
      } else {
        // Force no results if requested category is inactive
        filter.category = null;
      }
    } else {
      // Only include items from active categories by default
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
          // Fallback to offerType if no items or categories are explicitly linked
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
      // Handled custom below
    }

    if (page && limit) {
      if (sortBy === 'rating') {
        const Order = mongoose.model('Order');
        const topDishesRaw = await Order.aggregate([
          { $match: { orderStatus: { $ne: 'cancelled' } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.menuItem',
              orders: { $sum: '$items.quantity' }
            }
          },
          { $sort: { orders: -1 } }
        ]);

        const topDishMap = {};
        topDishesRaw.forEach((d, index) => {
          if (d._id) topDishMap[d._id.toString()] = index;
        });

        const allMenus = await menuRepository.getAll(filter, 0, 0, {});
        
        allMenus.sort((a, b) => {
          const indexA = topDishMap[a._id.toString()] ?? Infinity;
          const indexB = topDishMap[b._id.toString()] ?? Infinity;
          return indexA - indexB;
        });

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedMenus = allMenus.slice(skip, skip + parseInt(limit));
        return res.status(200).json(paginatedMenus);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const menus = await menuRepository.getAll(filter, skip, parseInt(limit), sortOption);
      return res.status(200).json(menus);
    }

    if (sortBy === 'rating') {
        const Order = mongoose.model('Order');
        const topDishesRaw = await Order.aggregate([
          { $match: { orderStatus: { $ne: 'cancelled' } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.menuItem',
              orders: { $sum: '$items.quantity' }
            }
          },
          { $sort: { orders: -1 } }
        ]);

        const topDishMap = {};
        topDishesRaw.forEach((d, index) => {
          if (d._id) topDishMap[d._id.toString()] = index;
        });

        const menus = await menuRepository.getAll(filter, 0, 0, {});
        
        menus.sort((a, b) => {
          const indexA = topDishMap[a._id.toString()] ?? Infinity;
          const indexB = topDishMap[b._id.toString()] ?? Infinity;
          return indexA - indexB;
        });

        return res.status(200).json(menus);
    }

    const menus = await menuRepository.getAll(filter, 0, 0, sortOption);
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
