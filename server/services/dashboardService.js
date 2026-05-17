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
      topDishes,
      monthlyTrend,
      outOfStockCount,
      lowStockCount,
      stockAlerts
    ] = await Promise.all([
      // 1. Total Revenue
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // 2. Today Revenue & Profit
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: today } } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$totalAmount' },
            totalCost: { $sum: { $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.costPrice'] }] }
            }}}
          } 
        }
      ]),

      // 3. Total Orders
      Order.countDocuments(),

      // 4. Total Customers
      User.countDocuments({ role: 'user' }),

      // 5. Total Menu Items
      Menu.countDocuments(),

      // 6. Placed Orders
      Order.countDocuments({ orderStatus: 'placed' }),

      // 7. Processing Orders
      Order.countDocuments({ orderStatus: 'processing' }),

      // 8. Table Stats
      Table.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: 1 }, 
          available: { $sum: { $cond: [{ $eq: ['$status', 'empty'] }, 1, 0] } } 
        } }
      ]),

      // 9. Recent Orders
      Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),

      // 10. Revenue Trend (Last 7 days)
      this.getRevenueTrend(),

      // 11. Top Dishes
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { 
          _id: '$items.menuItem', 
          name: { $first: '$items.name' },
          orders: { $sum: '$items.quantity' },
          unitPrice: { $first: '$items.price' }
        } },
        {
          $lookup: {
            from: 'menus',
            localField: '_id',
            foreignField: '_id',
            as: 'menuInfo'
          }
        },
        { $unwind: { path: '$menuInfo', preserveNullAndEmptyArrays: true } },
        { $project: {
          _id: 1,
          name: { $ifNull: ['$name', '$menuInfo.name'] },
          orders: 1,
          image: '$menuInfo.image',
          price: { $ifNull: ['$menuInfo.price', '$unitPrice'] },
          offerPrice: '$menuInfo.offerPrice',
          variants: '$menuInfo.variants',
          description: '$menuInfo.description',
          foodType: '$menuInfo.foodType',
          isCombo: '$menuInfo.isCombo',
          comboItems: '$menuInfo.comboItems',
          totalStock: '$menuInfo.totalStock'
        } },
        { $match: { name: { $ne: null } } },
        { $sort: { orders: -1 } },
        { $limit: 5 }
      ]),

      // 12. Monthly Revenue Trend
      this.getMonthlyRevenueTrend(),

      // 13. Out of Stock Items
      Menu.countDocuments({ totalStock: 0 }),

      // 14. Low Stock Items (Threshold: 10)
      Menu.countDocuments({ totalStock: { $gt: 0, $lte: 10 } }),

      // 15. Stock Alerts (Items to display)
      Menu.find({ totalStock: { $lte: 10 } })
        .sort({ totalStock: 1 })
        .limit(5)
        .populate('category', 'name')
    ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;
    const todayRevenue = todayRevenueData[0]?.total || 0;
    const todayCost = todayRevenueData[0]?.totalCost || 0;
    const todayProfit = todayRevenue - todayCost;
    const activeOrdersCount = await Order.countDocuments({ orderStatus: { $ne: 'cancelled' } });
    const avgOrderValue = activeOrdersCount > 0 ? (totalRevenue / activeOrdersCount) : 0;

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
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
        alerts: stockAlerts
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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill missing days with 0
    const fullTrend = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill missing days of the month with 0
    const fullTrend = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i);
      const dateStr = date.toISOString().split('T')[0];
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
