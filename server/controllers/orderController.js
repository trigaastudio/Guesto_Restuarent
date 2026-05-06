import Order from '../models/orderSchema.js';
import Counter from '../models/counterSchema.js';
import Menu from '../models/menuSchema.js';
import { getIO } from '../socket.js';

const getNextOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `ORD-${counter.seq.toString().padStart(4, '0')}`;
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
      await Menu.findByIdAndUpdate(item.menuItem, {
        $inc: { totalStock: factor * amount }
      });

      // Update included items stock
      if (variant && variant.includedItems && variant.includedItems.length > 0) {
        for (const included of variant.includedItems) {
          const includedReduction = item.quantity * included.quantity;
          await Menu.findByIdAndUpdate(included.menuItem, {
            $inc: { totalStock: factor * includedReduction }
          });
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
  async createCounterOrder(req, res) {
    try {
      const { customerDetails, items, orderType, paymentMethod, subtotal, tax, discount, totalAmount, cashReceived, balance } = req.body;

      const orderNumber = await getNextOrderNumber();

      // Auto-set payment status for cash
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
        discount,
        totalAmount,
        paymentMethod,
        cashReceived: cashReceived || 0,
        balance: balance || 0,
        paymentStatus
      });

      await newOrder.save();

      // Reduce Stock
      await handleStock(items, 'reduce');

      res.status(201).json({ success: true, data: newOrder });
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

      // Fetch original order first to check status change
      const originalOrder = await Order.findById(id);
      if (!originalOrder) return res.status(404).json({ success: false, message: 'Order not found' });

      // NEW OPERATIONAL RULE: Cannot move past 'processing' unless kitchen is 'ready'
      // Allow moving TO processing, and allow CANCELLING anytime.
      // But moving FROM processing to anything else requires kitchen 'ready'.
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

      // Handle Stock Recovery if cancelled
      if (updateData.orderStatus === 'cancelled' && originalOrder.orderStatus !== 'cancelled') {
        await restoreStock(originalOrder.items);
      }

      // Handle Auto-Payment Status for cash updates
      if (updateData.cashReceived !== undefined || updateData.totalAmount !== undefined) {
        const cash = updateData.cashReceived ?? originalOrder.cashReceived;
        const total = updateData.totalAmount ?? originalOrder.totalAmount;
        if (originalOrder.paymentMethod === 'cash' && cash >= total && total > 0) {
          updateData.paymentStatus = 'paid';
        }
      }

      // Restrict editing items for user delivery orders
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

      // Restore stock if not already cancelled
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

      // Validate kitchenStatus value
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

      // Emit socket event for real-time update
      getIO().emit('ordersUpdated');

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Update item status error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      if (order.orderType === 'delivery' && order.orderSource === 'user') {
        return res.status(403).json({ success: false, message: 'User delivery orders cannot have their items modified by admin' });
      }

      order.items.push(...items.map(item => ({ ...item, kitchenStatus: 'placed' })));

      // Recalculate Totals
      const newSubtotal = order.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
      order.subtotal = newSubtotal;
      order.totalAmount = newSubtotal + (order.tax || 0) - (order.discount || 0);

      // Update cash details if provided or recalculate
      if (req.body.cashReceived !== undefined) {
        order.cashReceived = req.body.cashReceived;
      }

      if (order.paymentMethod === 'cash') {
        order.balance = (order.cashReceived || 0) - order.totalAmount;
      }

      await order.save();

      // Reduce Stock for new items
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
        // Restore Stock
        await handleStock([item], 'restore');
        order.items.pull(itemId);

        // Recalculate Totals
        const newSubtotal = order.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
        order.subtotal = newSubtotal;
        order.totalAmount = newSubtotal + (order.tax || 0) - (order.discount || 0);

        // Recalculate Balance if it's a cash payment
        if (order.paymentMethod === 'cash' && order.cashReceived > 0) {
          order.balance = order.cashReceived - order.totalAmount;
        }

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

      // Handle Stock
      const diff = quantity - item.quantity;
      if (diff !== 0) {
        await handleStock([{ menuItem: item.menuItem, quantity: Math.abs(diff), size: item.size }], diff > 0 ? 'reduce' : 'restore');
      }

      item.quantity = quantity;
      item.totalPrice = (item.unitPrice || item.price || 0) * quantity;

      // Recalculate Totals
      // Totals and balance are handled by pre-save hook
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

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      // Restore old stock
      await restoreStock(order.items);

      // Update items
      order.items = items.map(item => ({
        ...item,
        kitchenStatus: item.kitchenStatus || 'placed'
      }));

      // Recalculate Totals (Handled by pre-save hook)

      // Update address/location if provided
      if (req.body.deliveryAddress !== undefined) {
        if (!order.address) order.address = {};
        order.address.address = req.body.deliveryAddress;
      }
      if (req.body.deliveryLocation !== undefined) {
        if (!order.address) order.address = {};
        order.address.location = req.body.deliveryLocation;
      }
      if (req.body.customerDetails) {
        order.customerDetails = req.body.customerDetails;
      }

      await order.save();
      
      // Reduce new stock
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
