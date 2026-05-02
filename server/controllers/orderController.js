import Order from '../models/orderSchema.js';
import Cart from '../models/cartSchema.js';

const placeOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, totalAmount, subtotal, deliveryFee, platformFee } = req.body;

    // Dynamic metadata with safety checks
    const allowedTypes = ['online', 'dining', 'take-away'];
    const allowedSources = ['user', 'admin', 'waiter', 'staff'];

    const finalOrderType = allowedTypes.includes(req.body.orderType)
      ? req.body.orderType
      : (req.user.role === 'user' ? 'online' : 'dining');

    const finalOrderSource = allowedSources.includes(req.user.role)
      ? req.user.role
      : 'user';

    const orderNumber = `GO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = new Order({
      user: req.user._id,
      orderNumber,
      items: items.map(item => ({
        menuItem: item.menuItem,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      })),
      address: {
        recipientName: address.name || address.recipientName,
        mobile: address.phone || address.mobile,
        address: address.address,
        type: address.type,
        location: address.location
      },
      paymentMethod,
      totalAmount,
      subtotal,
      deliveryFee,
      platformFee,
      orderType: finalOrderType,
      orderSource: finalOrderSource,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    });

    await newOrder.save();

    // Clear cart after placing order
    await Cart.findOneAndDelete({ user: req.user._id });

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
    const orders = await Order.find({ user: req.user._id })
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
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus !== 'placed') {
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

export default {
  placeOrder,
  getMyOrders,
  cancelOrder
};
