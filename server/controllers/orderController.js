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

class OrderController {
  async createCounterOrder(req, res) {
    try {
      const { customerDetails, items, paymentMethod, subtotal, tax, discount, totalAmount } = req.body;
      
      const orderNumber = await getNextOrderNumber();
      
      const newOrder = new Order({
        orderNumber,
        orderType: 'takeaway', 
        orderSource: 'admin',
        customerDetails: {
          name: customerDetails?.name || 'Walk-in',
          phone: customerDetails?.phone,
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
        paymentStatus: 'pending', 
        status: 'confirmed'  // Counter orders are confirmed at POS
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
      
      // Emit socket event for real-time update
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
      const { status, paymentStatus, customerDetails } = req.body;
      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (customerDetails) {
        updateData.customerDetails = customerDetails;
      }

      const order = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      
      // Emit socket event for real-time update
      getIO().emit('ordersUpdated');

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findByIdAndDelete(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      res.json({ success: true, message: 'Order deleted successfully' });
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
        await order.save();
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OrderController();
