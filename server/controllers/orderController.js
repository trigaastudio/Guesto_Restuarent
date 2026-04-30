import Order from '../models/orderSchema.js';
import Counter from '../models/counterSchema.js';
import Menu from '../models/menuSchema.js';
import Size from '../models/sizeSchema.js';
import { getIO } from '../socket.js';

const getNextOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `ORD-${counter.seq.toString().padStart(4, '0')}`;
};

const restoreStock = async (items) => {
  for (const item of items) {
    try {
      const sizeDoc = await Size.findOne({ name: item.size });
      const multiplier = sizeDoc ? sizeDoc.value : 1;
      const restoreAmount = item.quantity * multiplier;

      await Menu.findByIdAndUpdate(item.menuItem, {
        $inc: { totalStock: restoreAmount }
      });
    } catch (error) {
      console.error(`Error restoring stock for item ${item.menuItem}:`, error);
    }
  }
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
        status: 'confirmed',
        customerDetails: {
          name: customerDetails?.name || 'Walk-in',
          phone: customerDetails?.phone,
          address: customerDetails?.address,
          location: customerDetails?.location,
        },
        items: items.map(item => ({
          ...item,
          kitchenStatus: 'pending'
        })),
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        cashReceived: cashReceived || 0,
        balance: balance || 0,
        paymentStatus, 
        status: 'confirmed'
      });

      await newOrder.save();

      // Reduce Stock
      for (const item of items) {
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const reductionAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: -reductionAmount }
        });
      }

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
      const orders = await Order.find(query).sort({ createdAt: -1 });
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

      // Handle Stock Recovery if cancelled
      if (updateData.status === 'cancelled' && originalOrder.status !== 'cancelled') {
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

      const order = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after' }
      );

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
      if (order.status !== 'cancelled') {
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
      const allowedStatuses = ['pending', 'preparing', 'delayed', 'ready'];
      if (!allowedStatuses.includes(kitchenStatus)) {
        return res.status(400).json({ success: false, message: `Invalid kitchen status: "${kitchenStatus}"` });
      }

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      item.kitchenStatus = kitchenStatus;
      await order.save();
      
      // Emit socket event for real-time update
      getIO().emit('ordersUpdated');

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Update item status error:', error);
      // Log to a file for debugging
      import('fs').then(fs => {
        fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.stack}\n`);
      });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.isLocked) {
        return res.status(403).json({ success: false, message: 'Order is locked and cannot be edited' });
      }

      order.items.push(...items.map(item => ({ ...item, kitchenStatus: 'pending' })));
      
      // Recalculate Totals
      const newSubtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);
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
      for (const item of items) {
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const reductionAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: -reductionAmount }
        });
      }

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

      if (order.isLocked) {
        return res.status(403).json({ success: false, message: 'Order is locked and cannot be edited' });
      }

      const item = order.items.id(itemId);
      if (item) {
        // Restore Stock
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const restoreAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: restoreAmount }
        });

        order.items.pull(itemId);
        
        // Recalculate Totals
        const newSubtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);
        order.subtotal = newSubtotal;
        order.totalAmount = newSubtotal + (order.tax || 0) - (order.discount || 0);
        
        // Recalculate Balance if it's a cash payment
        if (order.paymentMethod === 'cash' && order.cashReceived > 0) {
          order.balance = order.cashReceived - order.totalAmount;
        }

        await order.save();
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OrderController();
