import express from 'express';
import Order from '../models/orderSchema.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();




router.get('/sales', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, orderType, orderSource, menuItem } = req.query;
    
    let query = { orderStatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (orderType && orderType !== 'all') query.orderType = orderType;
    if (orderSource && orderSource !== 'all') query.orderSource = orderSource;
    if (menuItem && menuItem !== 'all') query['items.menuItem'] = menuItem;

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name category')
      .sort({ createdAt: -1 });

    
    const stats = orders.reduce((acc, order) => {
      acc.totalRevenue += order.totalAmount;
      order.items.forEach(item => {
        acc.totalCost += (item.quantity * (item.costPrice || 0));
        acc.totalQty += item.quantity;
      });
      return acc;
    }, { totalRevenue: 0, totalCost: 0, totalQty: 0 });

    stats.totalProfit = stats.totalRevenue - stats.totalCost;

    res.json({ success: true, data: { orders, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.get('/periodic', protect, admin, async (req, res) => {
  try {
    const { orderType, orderSource, menuItem } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const aggregateByDate = async (startDate) => {
      let matchQuery = { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate } };
      
      if (orderType && orderType !== 'all') matchQuery.orderType = orderType;
      if (orderSource && orderSource !== 'all') matchQuery.orderSource = orderSource;
      if (menuItem && menuItem !== 'all') {
        const mongoose = await import('mongoose');
        matchQuery['items.menuItem'] = new mongoose.Types.ObjectId(menuItem);
      }

      return Order.aggregate([
        { $match: matchQuery },
        { $group: { 
          _id: null, 
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: { $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.costPrice'] }] }
          }}}
        }}
      ]);
    };

    const [daily, weekly, monthly, yearly] = await Promise.all([
      aggregateByDate(today),
      aggregateByDate(firstDayOfWeek),
      aggregateByDate(firstDayOfMonth),
      aggregateByDate(firstDayOfYear)
    ]);

    res.json({
      success: true,
      data: {
        daily: daily[0] || { revenue: 0, cost: 0 },
        weekly: weekly[0] || { revenue: 0, cost: 0 },
        monthly: monthly[0] || { revenue: 0, cost: 0 },
        yearly: yearly[0] || { revenue: 0, cost: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.get('/items', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, orderType, orderSource, menuItem } = req.query;
    let matchQuery = { orderStatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    if (orderType && orderType !== 'all') matchQuery.orderType = orderType;
    if (orderSource && orderSource !== 'all') matchQuery.orderSource = orderSource;
    
    let itemMatchQuery = null;
    if (menuItem && menuItem !== 'all') {
      const mongoose = await import('mongoose');
      const menuItemId = new mongoose.Types.ObjectId(menuItem);
      matchQuery['items.menuItem'] = menuItemId;
      itemMatchQuery = { 'items.menuItem': menuItemId };
    }

    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$items' }
    ];

    if (itemMatchQuery) {
      pipeline.push({ $match: itemMatchQuery });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'menus',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuInfo'
        }
      },
      { $unwind: { path: '$menuInfo', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { menuItem: '$items.menuItem', size: '$items.size' },
        name: { $first: { $ifNull: ['$items.name', '$menuInfo.name'] } },
        size: { $first: '$items.size' },
        qty: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        cost: { $sum: { $multiply: ['$items.quantity', '$items.costPrice'] } }
      }}
    );

    const itemStats = await Order.aggregate(pipeline.concat([
      { $addFields: { profit: { $subtract: ['$revenue', '$cost'] } } },
      { $sort: { qty: -1 } }
    ]));

    res.json({ success: true, data: itemStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
