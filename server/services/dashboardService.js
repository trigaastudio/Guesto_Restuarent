import Order from '../models/orderSchema.js';
import User from '../models/userSchema.js';
import Menu from '../models/menuSchema.js';
import Table from '../models/tableSchema.js';
import mongoose from 'mongoose';

class DashboardService {
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRevenueData,
      todayRevenueData,
      totalOrders,
      totalCustomers,
      totalMenuItems,
      placedOrders,
      processingOrders,
      tableStats,
      recentOrders,
      revenueTrend,
      topDishesRaw,
      monthlyTrend,
      outOfStockCount,
      lowStockCount,
      stockAlerts
    ] = await Promise.all([
      
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            totalCost: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.costPrice'] }] }
                }
              }
            }
          }
        }
      ]),

      
      Order.countDocuments({ createdAt: { $gte: today } }),

      
      User.countDocuments({ role: 'user' }),

      
      Menu.countDocuments(),

      
      Order.countDocuments({ orderStatus: 'placed' }),

      
      Order.countDocuments({ orderStatus: 'processing' }),

      
      Table.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: [{ $eq: ['$status', 'empty'] }, 1, 0] } }
          }
        }
      ]),

      
      Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),

      
      this.getRevenueTrend(),

      
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.menuItem',
            orders: { $sum: '$items.quantity' }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { orders: -1 } },
        { $limit: 5 }
      ]),

      
      this.getMonthlyRevenueTrend(),

      
      Menu.aggregate([
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $addFields: { effectiveStock: { $cond: [{ $or: [{ $eq: ['$cat.isSharedStock', true] }, { $eq: ['$cat.stockactive', true] }] }, { $max: [{ $ifNull: ['$cat.totalStock', 0] }, { $ifNull: ['$totalStock', 0] }] }, { $ifNull: ['$totalStock', 0] }] } } },
        { $match: { effectiveStock: { $lte: 0 } } },
        { $count: 'count' }
      ]),

      
      Menu.aggregate([
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $addFields: { effectiveStock: { $cond: [{ $or: [{ $eq: ['$cat.isSharedStock', true] }, { $eq: ['$cat.stockactive', true] }] }, { $max: [{ $ifNull: ['$cat.totalStock', 0] }, { $ifNull: ['$totalStock', 0] }] }, { $ifNull: ['$totalStock', 0] }] } } },
        { $match: { effectiveStock: { $gt: 0, $lte: 10 } } },
        { $count: 'count' }
      ]),

      
      Menu.aggregate([
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $addFields: { effectiveStock: { $cond: [{ $or: [{ $eq: ['$cat.isSharedStock', true] }, { $eq: ['$cat.stockactive', true] }] }, { $max: [{ $ifNull: ['$cat.totalStock', 0] }, { $ifNull: ['$totalStock', 0] }] }, { $ifNull: ['$totalStock', 0] }] } } },
        { $match: { effectiveStock: { $lte: 10 } } },
        { $sort: { effectiveStock: 1 } },
        { $limit: 5 },
        { $project: { name: 1, image: 1, effectiveStock: 1, 'category.name': '$cat.name' } }
      ])
    ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;
    const todayRevenue = todayRevenueData[0]?.total || 0;
    const todayCost = todayRevenueData[0]?.totalCost || 0;
    const todayProfit = todayRevenue - todayCost;
    const activeOrdersCount = await Order.countDocuments({ orderStatus: { $ne: 'cancelled' } });
    const avgOrderValue = activeOrdersCount > 0 ? (totalRevenue / activeOrdersCount) : 0;

    const topDishesIds = topDishesRaw.map(d => d._id);
    const populatedMenus = await Menu.find({ _id: { $in: topDishesIds } })
      .populate('category')
      .populate('comboItems.menuItem')
      .lean();
      
    const topDishes = topDishesRaw.map(d => {
      const menu = populatedMenus.find(m => m._id.toString() === d._id?.toString());
      return menu ? { ...menu, orders: d.orders } : null;
    }).filter(Boolean);

    return {
      metrics: {
        totalRevenue,
        todayRevenue,
        todayProfit,
        totalOrders,
        totalCustomers,
        totalMenuItems,
        avgOrderValue
      },
      orderStats: {
        placed: placedOrders,
        processing: processingOrders
      },
      tableStats: {
        total: tableStats[0]?.total || 0,
        available: tableStats[0]?.available || 0
      },
      recentOrders,
      revenueTrend,
      monthlyTrend,
      topDishes,
      stockStats: {
        outOfStock: outOfStockCount[0]?.count || 0,
        lowStock: lowStockCount[0]?.count || 0,
        alerts: stockAlerts.map(a => ({
          ...a,
          totalStock: a.effectiveStock 
        }))
      }
    };
  }

  async getRevenueTrend() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trend = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt",
              timezone: "+05:30"
            } 
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    
    const fullTrend = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const dayData = trend.find(t => t._id === dateStr);

      fullTrend.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayData ? dayData.revenue : 0
      });
    }

    return fullTrend;
  }

  async getMonthlyRevenueTrend() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const trend = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: firstDayOfMonth }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt",
              timezone: "+05:30"
            } 
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    
    const fullTrend = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i);
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const dayData = trend.find(t => t._id === dateStr);

      fullTrend.push({
        date: dateStr,
        day: i.toString(),
        revenue: dayData ? dayData.revenue : 0
      });
    }

    return fullTrend;
  }
}

export default new DashboardService();
