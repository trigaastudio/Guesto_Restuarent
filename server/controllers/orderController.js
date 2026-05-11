import Order from '../models/orderSchema.js';
import Cart from '../models/cartSchema.js';
import User from '../models/userSchema.js';
import Counter from '../models/counterSchema.js';
import Menu from '../models/menuSchema.js';
import Settings from '../models/settingsSchema.js';
import { getIO } from '../socket.js';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const expandUrl = async (url) => {
  if (!url || !url.includes('maps.app.goo.gl') && !url.includes('share.google')) return url;
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    return response.url;
  } catch (error) {
    console.error('Expand URL Error:', error);
    return url;
  }
};

const extractCoordinates = (url) => {
  if (!url) return null;
  // Look for lat,lng pair. Try to find one that looks like coordinates.
  const coordRegex = /([-.\d]+),([-.\d]+)/g;
  let match;
  while ((match = coordRegex.exec(url)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && Math.abs(lat) > 0.01) {
      return { lat, lng };
    }
  }
  return null;
};

const calculateRoadDistance = async (lat1, lon1, lat2, lon2) => {
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000; // convert meters to km
    }
    return calculateDistance(lat1, lon1, lat2, lon2);
  } catch (error) {
    console.error('OSRM Distance Error:', error);
    return calculateDistance(lat1, lon1, lat2, lon2);
  }
};

const getNextOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `ORD-${counter.seq.toString().padStart(4, '0')}`;
};

const checkStockAvailability = async (items) => {
  for (const item of items) {
    const menuDoc = await Menu.findById(item.menuItem);
    if (!menuDoc) continue;

    const variant = menuDoc.variants.find(v => v.size === item.size);
    const multiplier = variant && variant.stockValue ? variant.stockValue : 1;
    const amountNeeded = item.quantity * multiplier;

    if (menuDoc.totalStock < amountNeeded) {
      return { available: false, itemName: menuDoc.name };
    }

    if (variant && variant.includedItems && variant.includedItems.length > 0) {
      for (const included of variant.includedItems) {
        const includedDoc = await Menu.findById(included.menuItem);
        if (!includedDoc) continue;
        const totalNeeded = item.quantity * included.quantity;
        if (includedDoc.totalStock < totalNeeded) {
          return { available: false, itemName: `${includedDoc.name} (ingredient)` };
        }
      }
    }
  }
  return { available: true };
};

const handleStock = async (items, type = 'reduce') => {
  for (const item of items) {
    try {
      const menuDoc = await Menu.findById(item.menuItem);
      if (!menuDoc) continue;

      const variant = menuDoc.variants.find(v => v.size === item.size);
      const multiplier = variant && variant.stockValue ? variant.stockValue : 1;
      const amount = item.quantity * multiplier;
      const factor = type === 'reduce' ? -1 : 1;

      // Update main item stock
      const updatedMenu = await Menu.findByIdAndUpdate(
        item.menuItem,
        { $inc: { totalStock: factor * amount } },
        { new: true }
      );

      // Force floor at 0 if it somehow went negative
      if (updatedMenu && updatedMenu.totalStock < 0) {
        await Menu.findByIdAndUpdate(item.menuItem, { totalStock: 0 });
        updatedMenu.totalStock = 0;
      }

      // Real-time Stock Alerts (Only on reduction)
      if (type === 'reduce' && updatedMenu) {
        if (updatedMenu.totalStock <= 0) {
          getIO().emit('stockAlert', {
            type: 'outOfStock',
            itemId: updatedMenu._id,
            name: updatedMenu.name,
            message: `CRITICAL: ${updatedMenu.name} is now OUT OF STOCK!`
          });
        } else if (updatedMenu.totalStock <= 5) {
          getIO().emit('stockAlert', {
            type: 'lowStock',
            itemId: updatedMenu._id,
            name: updatedMenu.name,
            message: `ALERT: ${updatedMenu.name} is running low (${updatedMenu.totalStock} left)`
          });
        }
      }

      // Update included items stock
      if (variant && variant.includedItems && variant.includedItems.length > 0) {
        for (const included of variant.includedItems) {
          const includedReduction = item.quantity * included.quantity;
          const updatedIncluded = await Menu.findByIdAndUpdate(
            included.menuItem,
            { $inc: { totalStock: factor * includedReduction } },
            { new: true }
          );

          if (updatedIncluded && updatedIncluded.totalStock < 0) {
            await Menu.findByIdAndUpdate(included.menuItem, { totalStock: 0 });
            updatedIncluded.totalStock = 0;
          }

          // Stock Alerts for included items
          if (type === 'reduce' && updatedIncluded) {
            if (updatedIncluded.totalStock <= 0) {
              getIO().emit('stockAlert', {
                type: 'outOfStock',
                itemId: updatedIncluded._id,
                name: updatedIncluded.name,
                message: `CRITICAL: ${updatedIncluded.name} (ingredient) is now OUT OF STOCK!`
              });
            } else if (updatedIncluded.totalStock <= 5) {
              getIO().emit('stockAlert', {
                type: 'lowStock',
                itemId: updatedIncluded._id,
                name: updatedIncluded.name,
                message: `ALERT: ${updatedIncluded.name} (ingredient) is running low (${updatedIncluded.totalStock} left)`
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error handling stock for item ${item.menuItem}:`, error);
    }
  }
};

const restoreStock = async (items) => {
  await handleStock(items, 'restore');
};

class OrderController {
  // --- USER FACING METHODS ---

  async placeOrder(req, res) {
    try {
      const { items, address, paymentMethod, totalAmount, subtotal, discount, tax, razorpayOrderId, razorpayPaymentId } = req.body;

      // Check Stock First
      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }

      // Handle Wallet Payment
      if (paymentMethod === 'wallet') {
        const user = await User.findById(req.user._id);
        const orderTotal = totalAmount; // totalAmount should already include fee/tax/discount
        
        if (user.walletBalance < orderTotal) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        user.walletBalance -= orderTotal;
        user.walletTransactions.push({
          amount: orderTotal,
          type: 'debit',
          description: `Payment for Order`
        });
        await user.save();
      }

      // Determine Order Source and Type
      const isUser = req.user.role === 'user';
      const finalOrderSource = isUser ? 'user' : (req.user.role || 'admin');
      const finalOrderType = isUser ? 'delivery' : (req.body.orderType || 'dine-in');

      const orderNumber = await getNextOrderNumber();

      // Calculate delivery fee on server for security
      let deliveryFee = 0;
      if (finalOrderType === 'delivery' && address.location) {
        const settings = await Settings.getSettings();
        const { freeDistanceLimit, chargePerExtraKm } = settings.deliverySettings || { freeDistanceLimit: 5, chargePerExtraKm: 10 };
        const restLat = settings.restaurantDetails?.location?.lat || parseFloat(process.env.RESTAURANT_LAT || '10.668194');
        const restLng = settings.restaurantDetails?.location?.lng || parseFloat(process.env.RESTAURANT_LNG || '76.025111');

        // Try to match coordinates from Google Maps URL or string
        let targetUrl = address.location;
        if (targetUrl.includes('maps.app.goo.gl') || targetUrl.includes('share.google')) {
          targetUrl = await expandUrl(targetUrl);
        }

        const coords = extractCoordinates(targetUrl);
        if (coords) {
          const { lat: userLat, lng: userLng } = coords;
          const distance = await calculateRoadDistance(userLat, userLng, restLat, restLng);
          if (distance > freeDistanceLimit) {
            deliveryFee = Math.ceil(distance - freeDistanceLimit) * chargePerExtraKm;
          }
        }
      }

      const newOrder = new Order({
        customer: req.user._id,
        orderNumber,
        orderType: finalOrderType,
        orderSource: finalOrderSource,
        items: items.map(item => ({
          menuItem: item.menuItem,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          kitchenStatus: 'placed'
        })),
        customerDetails: {
          name: address.recipientName || address.name || req.user.name,
          phone: address.mobile || address.phone || req.user.phone,
          address: address.address,
          location: address.location || '',
          remarks: req.body.remarks || ''
        },
        address: {
          recipientName: address.recipientName || address.name || req.user.name,
          mobile: address.mobile || address.phone || req.user.phone,
          address: address.address,
          location: address.location || ''
        },
        paymentMethod: paymentMethod || 'cod',
        subtotal,
        deliveryFee: deliveryFee || req.body.deliveryFee || 0,
        discount: discount || 0,
        tax: tax || 0,
        totalAmount: subtotal + (deliveryFee || req.body.deliveryFee || 0) - (discount || 0) + (tax || 0),
        orderStatus: 'placed',
        kitchenStatus: 'placed',
        paymentStatus: (paymentMethod === 'wallet' || paymentMethod === 'online') ? 'paid' : 'pending',
        razorpayOrderId,
        razorpayPaymentId
      });

      if (finalOrderType === 'dine-in') {
        newOrder.table = req.body.tableId;
        newOrder.sessionId = req.body.sessionId || `SES-${Date.now()}`;
      }

      await newOrder.save();

      // Reduce Stock
      await handleStock(items, 'reduce');

      // Update wallet transaction description with order number
      if (paymentMethod === 'wallet') {
        const user = await User.findById(req.user._id);
        const lastTx = user.walletTransactions[user.walletTransactions.length - 1];
        lastTx.description = `Payment for Order #${newOrder.orderNumber}`;
        await user.save();
      }

      // Clear cart
      await Cart.findOneAndDelete({ customer: req.user._id }).catch(() => { });
      await Cart.findOneAndDelete({ user: req.user._id }).catch(() => { });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: newOrder
      });

      // Global Notification
      getIO().emit('newOrder', {
        order: newOrder,
        message: `🔔 New ${newOrder.orderType.toUpperCase()} Order Received! (#${newOrder.orderNumber})`
      });
    } catch (error) {
      console.error('Order Error Details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error placing order'
      });
    }
  }

  async getMyOrders(req, res) {
    try {
      const orders = await Order.find({ customer: req.user._id })
        .populate('items.menuItem')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.orderStatus !== 'placed') {
        return res.status(400).json({
          success: false,
          message: `Only newly placed orders can be cancelled. Current status: ${order.orderStatus}`
        });
      }

      // Restore Stock
      await restoreStock(order.items);

      // Refund to wallet if paid
      if (order.paymentStatus === 'paid') {
        const user = await User.findById(req.user._id);
        user.walletBalance += order.totalAmount;
        user.walletTransactions.push({
          amount: order.totalAmount,
          type: 'credit',
          description: `Refund for Cancelled Order #${order.orderNumber}`
        });
        await user.save();
        order.paymentStatus = 'refunded';
      }

      order.orderStatus = 'cancelled';
      await order.save();

      res.status(200).json({
        success: true,
        message: order.paymentStatus === 'refunded' 
          ? 'Order cancelled and amount refunded to your wallet' 
          : 'Order cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        error: error.message
      });
    }
  }

  // --- ADMIN FACING METHODS ---

  async createCounterOrder(req, res) {
    try {
      const { customerDetails, items, orderType, paymentMethod, subtotal, tax, deliveryFee, discount, totalAmount, cashReceived, balance } = req.body;

      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }

      const orderNumber = await getNextOrderNumber();

      let paymentStatus = 'pending';
      if (paymentMethod === 'cash' && cashReceived >= totalAmount) {
        paymentStatus = 'paid';
      }

      const newOrder = new Order({
        orderNumber,
        orderType: orderType || 'takeaway',
        orderSource: 'admin',
        orderStatus: 'placed',
        customerDetails: {
          name: customerDetails?.name || 'Walk-in',
          phone: customerDetails?.phone,
          address: customerDetails?.address,
          location: customerDetails?.location,
        },
        items: items.map(item => ({
          ...item,
          kitchenStatus: 'placed'
        })),
        subtotal,
        tax,
        deliveryFee: deliveryFee || 0,
        discount,
        totalAmount,
        paymentMethod,
        cashReceived: cashReceived || 0,
        balance: balance || 0,
        paymentStatus
      });

      await newOrder.save();
      await handleStock(items, 'reduce');

      res.status(201).json({ success: true, data: newOrder });
      
      getIO().emit('newOrder', {
        order: newOrder,
        message: `🔔 New ${newOrder.orderType.toUpperCase()} Order Received! (#${newOrder.orderNumber})`
      });
      getIO().emit('ordersUpdated');
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { type } = req.query;
      const query = type ? { orderType: type } : {};
      const orders = await Order.find(query)
        .populate('items.menuItem', 'name image')
        .populate('table', 'tableNumber')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const originalOrder = await Order.findById(id);
      if (!originalOrder) return res.status(404).json({ success: false, message: 'Order not found' });

      // Operational Rule
      if (
        originalOrder.orderStatus === 'processing' && 
        updateData.orderStatus && 
        updateData.orderStatus !== 'processing' && 
        updateData.orderStatus !== 'cancelled' && 
        originalOrder.kitchenStatus !== 'ready'
      ) {
        return res.status(403).json({ 
          success: false, 
          message: 'Order status cannot be updated until the Kitchen marks all items as "Ready".' 
        });
      }

      if (updateData.orderStatus === 'cancelled' && originalOrder.orderStatus !== 'cancelled') {
        await restoreStock(originalOrder.items);
      }

      if (updateData.cashReceived !== undefined || updateData.totalAmount !== undefined) {
        const cash = updateData.cashReceived ?? originalOrder.cashReceived;
        const total = updateData.totalAmount ?? originalOrder.totalAmount;
        if (originalOrder.paymentMethod === 'cash' && cash >= total && total > 0) {
          updateData.paymentStatus = 'paid';
        }
      }

      if (originalOrder.orderType === 'delivery' && originalOrder.orderSource === 'user' && updateData.items) {
        return res.status(403).json({ success: false, message: 'User delivery orders cannot have their items modified by admin' });
      }

      Object.assign(originalOrder, updateData);
      const order = await originalOrder.save();
      await order.populate([
        { path: 'items.menuItem', select: 'name image' },
        { path: 'table', select: 'tableNumber' }
      ]);

      getIO().emit('ordersUpdated');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.orderStatus !== 'cancelled') {
        await restoreStock(order.items);
      }

      await Order.findByIdAndDelete(id);
      getIO().emit('ordersUpdated');
      res.json({ success: true, message: 'Order deleted and stock restored' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateItemStatus(req, res) {
    try {
      const { orderId, itemId } = req.params;
      const { kitchenStatus } = req.body;

      const allowedStatuses = ['placed', 'preparing', 'ready', 'delayed'];
      if (!allowedStatuses.includes(kitchenStatus)) {
        return res.status(400).json({ success: false, message: `Invalid kitchen status: "${kitchenStatus}"` });
      }

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      item.kitchenStatus = kitchenStatus;
      await order.save();
      await order.populate('items.menuItem', 'name image');

      getIO().emit('ordersUpdated');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      if (order.orderType === 'delivery' && order.orderSource === 'user') {
        return res.status(403).json({ success: false, message: 'User delivery orders cannot have their items modified by admin' });
      }

      order.items.push(...items.map(item => ({ ...item, kitchenStatus: 'placed' })));
      await order.save();
      await handleStock(items, 'reduce');

      await order.populate('items.menuItem', 'name image');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeItem(req, res) {
    try {
      const { orderId, itemId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      if (order.orderType === 'delivery' && order.orderSource === 'user') {
        return res.status(403).json({ success: false, message: 'User delivery orders cannot have their items modified by admin' });
      }

      const item = order.items.id(itemId);
      if (item) {
        await handleStock([item], 'restore');
        order.items.pull(itemId);
        await order.save();
        await order.populate('items.menuItem', 'name image');
      }

      getIO().emit('ordersUpdated');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateItemQuantity(req, res) {
    try {
      const { orderId, itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      const diff = quantity - item.quantity;
      if (diff > 0) {
        const stockCheck = await checkStockAvailability([{ menuItem: item.menuItem, quantity: diff, size: item.size }]);
        if (!stockCheck.available) {
          return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
        }
        await handleStock([{ menuItem: item.menuItem, quantity: diff, size: item.size }], 'reduce');
      } else if (diff < 0) {
        await handleStock([{ menuItem: item.menuItem, quantity: Math.abs(diff), size: item.size }], 'restore');
      }

      item.quantity = quantity;
      item.totalPrice = (item.unitPrice || item.price || 0) * quantity;

      await order.save();
      await order.populate('items.menuItem', 'name image');

      getIO().emit('ordersUpdated');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateOrderItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      await restoreStock(order.items);
      order.items = items.map(item => ({
        ...item,
        kitchenStatus: item.kitchenStatus || 'placed'
      }));

      if (req.body.customerDetails) {
        order.customerDetails = req.body.customerDetails;
      }

      await order.save();
      await handleStock(order.items, 'reduce');

      await order.populate('items.menuItem', 'name image');
      getIO().emit('ordersUpdated');
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async clearHistory(req, res) {
    try {
      const { orderType, startDate, endDate, ids } = req.query;
      let query = {};

      if (ids) {
        query = { _id: { $in: ids.split(',') } };
      } else {
        query = {
          $or: [
            { orderStatus: 'delivered', paymentStatus: 'paid' },
            { orderStatus: 'cancelled' }
          ]
        };

        if (orderType && orderType !== 'all') {
          query.orderType = orderType;
        }

        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
          }
        }
      }

      const result = await Order.deleteMany(query);
      getIO().emit('ordersUpdated');
      res.json({ success: true, message: `${result.deletedCount} orders cleared`, deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OrderController();
