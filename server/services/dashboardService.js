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
      pendingOrders,
      inProgressOrders,
      tableStats,
      recentOrders,
      revenueTrend,
      topDishes,
      monthlyTrend
    ] = await Promise.all([
      // 1. Total Revenue
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // 2. Today Revenue
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // 3. Total Orders
      Order.countDocuments(),

      // 4. Total Customers
      User.countDocuments({ role: 'user' }),

      // 5. Total Menu Items
      Menu.countDocuments(),

      // 6. Pending Orders
      Order.countDocuments({ status: 'pending' }),

      // 7. Orders in Progress
      Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready'] } }),

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
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        { $group: { 
          _id: '$items.menuItem', 
          name: { $first: '$items.name' },
          orders: { $sum: '$items.quantity' }
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
          name: 1,
          orders: 1,
          image: '$menuInfo.image'
        } },
        { $sort: { orders: -1 } },
        { $limit: 5 }
      ]),

      // 12. Monthly Revenue Trend
      this.getMonthlyRevenueTrend()
    ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;
    const todayRevenue = todayRevenueData[0]?.total || 0;
    const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
    const avgOrderValue = completedOrdersCount > 0 ? (totalRevenue / completedOrdersCount) : 0;

    return {
      metrics: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        totalCustomers,
        totalMenuItems,
        avgOrderValue
      },
      orderStats: {
        pending: pendingOrders,
        inProgress: inProgressOrders
      },
      tableStats: {
        total: tableStats[0]?.total || 0,
        available: tableStats[0]?.available || 0
      },
      recentOrders,
      revenueTrend,
      monthlyTrend,
      topDishes
    };
  }

  async getRevenueTrend() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trend = await Order.aggregate([
      { 
        $match: { 
          status: 'completed', 
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
          status: 'completed', 
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
