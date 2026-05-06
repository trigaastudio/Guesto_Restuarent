import Order from '../models/orderSchema.js';
import Cart from '../models/cartSchema.js';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const placeOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, totalAmount, subtotal, discount, tax } = req.body;

    // Determine Order Source and Type based on User Role
    const isUser = req.user.role === 'user';
    const finalOrderSource = isUser ? 'user' : (req.user.role || 'admin');
    const finalOrderType = isUser ? 'delivery' : (req.body.orderType || 'dine-in');

    const orderNumber = `GO-${Math.floor(1000 + Math.random() * 9000)}`;

    // Calculate delivery fee on server for security
    let deliveryFee = 0;
    if (finalOrderType === 'delivery' && address.location) {
      const urlMatch = address.location.match(/q=([-.\d]+),([-.\d]+)/);
      if (urlMatch) {
        const userLat = parseFloat(urlMatch[1]);
        const userLng = parseFloat(urlMatch[2]);
        const restLat = parseFloat(process.env.RESTAURANT_LAT || '10.668194');
        const restLng = parseFloat(process.env.RESTAURANT_LNG || '76.025111');
        const distance = calculateDistance(userLat, userLng, restLat, restLng);
        if (distance > 5) {
          deliveryFee = Math.ceil(distance - 5) * 10;
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
        price: item.price
      })),
      customerDetails: {
        name: address.recipientName || address.name || req.user.name,
        phone: address.mobile || address.phone || req.user.phone,
        address: address.address,
        location: address.location || '',
        remarks: req.body.remarks || ''
      },
      paymentMethod: paymentMethod || 'cod',
      subtotal,
      deliveryFee: deliveryFee || req.body.deliveryFee || 0,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount: subtotal + deliveryFee - (discount || 0) + (tax || 0),
      orderStatus: 'placed',
      kitchenStatus: 'placed',
      paymentStatus: (paymentMethod === 'cod' || paymentMethod === 'cash') ? 'pending' : 'paid'
    });

    // Handle dine-in specific fields if present
    if (finalOrderType === 'dine-in') {
      newOrder.table = req.body.tableId;
      newOrder.sessionId = req.body.sessionId || `SES-${Date.now()}`;
    }

    await newOrder.save();

    // Clear cart after placing order
    await Cart.findOneAndDelete({ customer: req.user._id }).catch(() => { }); // Attempt both field names
    await Cart.findOneAndDelete({ user: req.user._id }).catch(() => { });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder
    });
  } catch (error) {
    console.error('Order Error Details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error placing order'
    });
  }
};

const getMyOrders = async (req, res) => {
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
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const cancellableStatuses = ['placed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Only newly placed orders can be cancelled. Your order is already ' + order.orderStatus
      });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

export default {
  placeOrder,
  getMyOrders,
  cancelOrder,
  updateOrderStatus
};
