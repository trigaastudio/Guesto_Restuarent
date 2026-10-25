import express from 'express';
import Order from '../models/orderSchema.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sales', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, orderType, orderSource, menuItem } = req.query;
    
    let matchQuery = { orderStatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    if (orderType && orderType !== 'all') matchQuery.orderType = orderType;
    if (orderSource && orderSource !== 'all') matchQuery.orderSource = orderSource;
    if (menuItem && menuItem !== 'all') {
      const mongoose = await import('mongoose');
      matchQuery['items.menuItem'] = new mongoose.Types.ObjectId(menuItem);
    }

    // Use aggregation instead of fetching all documents for performance
    const [aggregateResult, totalOrders] = await Promise.all([
      Order.aggregate([
        { $match: matchQuery },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: { $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', { $multiply: ['$$this.quantity', { $ifNull: ['$$this.costPrice', 0] }] }] }
          }}},
          totalQty: { $sum: { $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.quantity'] }
          }}}
        }}
      ]),
      Order.countDocuments(matchQuery)
    ]);

    const agg = aggregateResult[0] || { totalRevenue: 0, totalCost: 0, totalQty: 0 };
    const stats = {
      totalRevenue: agg.totalRevenue,
      totalCost: agg.totalCost,
      totalQty: agg.totalQty,
      totalProfit: agg.totalRevenue - agg.totalCost,
      totalOrders
    };

    res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error('Sales report error:', error);
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
      let matchQuery = { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } };
      
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
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.createdAt.$gte = start;
      }
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

// Payment method breakdown (Cash vs UPI/Card vs Online etc.)
router.get('/payment-breakdown', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, orderType, orderSource } = req.query;
    let matchQuery = { orderStatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    if (orderType && orderType !== 'all') matchQuery.orderType = orderType;
    if (orderSource && orderSource !== 'all') matchQuery.orderSource = orderSource;

    const orders = await Order.find(matchQuery)
      .select('paymentMethod paymentHistory totalAmount paidAmount')
      .lean();

    const paymentBreakdownMap = {};
    orders.forEach(order => {
      const isSplit = order.paymentMethod === 'split';
      const history = Array.isArray(order.paymentHistory) && order.paymentHistory.length > 0 ? order.paymentHistory : [];

      if (isSplit && history.length > 0) {
        let historyTotal = 0;
        history.forEach(item => {
          const method = item.method && item.method !== 'split' ? item.method : 'cash';
          const amt = Number(item.amount) || 0;
          historyTotal += amt;
          if (!paymentBreakdownMap[method]) {
            paymentBreakdownMap[method] = { totalRevenue: 0, count: 0 };
          }
          paymentBreakdownMap[method].totalRevenue += amt;
          paymentBreakdownMap[method].count += 1;
        });

        const remainder = Math.max(0, (Number(order.totalAmount) || 0) - historyTotal);
        if (remainder > 0) {
          const fallbackMethod = 'cash';
          if (!paymentBreakdownMap[fallbackMethod]) {
            paymentBreakdownMap[fallbackMethod] = { totalRevenue: 0, count: 0 };
          }
          paymentBreakdownMap[fallbackMethod].totalRevenue += remainder;
        }
      } else {
        let method = order.paymentMethod || 'Not Specified';
        if (method === 'split') method = 'cash';
        const amt = Number(order.totalAmount) || 0;

        if (!paymentBreakdownMap[method]) {
          paymentBreakdownMap[method] = { totalRevenue: 0, count: 0 };
        }
        paymentBreakdownMap[method].totalRevenue += amt;
        paymentBreakdownMap[method].count += 1;
      }
    });

    const breakdown = Object.entries(paymentBreakdownMap)
      .map(([_id, data]) => ({
        _id,
        totalRevenue: data.totalRevenue,
        count: data.count
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('Payment breakdown error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Order type revenue share (Dine-In vs Takeaway vs Delivery)
router.get('/order-type-revenue', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, orderSource } = req.query;
    let matchQuery = { orderStatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    if (orderSource && orderSource !== 'all') matchQuery.orderSource = orderSource;

    const breakdown = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$orderType',
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('Order type revenue error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/clear', protect, admin, async (req, res) => {
  try {
    res.json({ success: true, message: 'Sales clearing is disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
