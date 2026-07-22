import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/orderSchema.js';
import Cart from '../models/cartSchema.js';
import { getIO } from '../socket.js';

const createRazorpayOrder = async (req, res) => {
  try {
    const { currency = 'INR', receipt } = req.body;

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ 
        success: false, 
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    
    
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.menuItem',
      select: 'price variants'
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    
    let serverTotal = 0;
    for (const item of cart.items) {
      const menuItem = item.menuItem;
      if (!menuItem) continue;
      let price = menuItem.price || 0;
      if (item.size && menuItem.variants?.length > 0) {
        const variant = menuItem.variants.find(v => v.size === item.size);
        if (variant?.price) price = variant.price;
      }
      serverTotal += price * item.quantity;
    }

    serverTotal = Math.round(serverTotal);

    if (serverTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid cart total' });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: serverTotal * 100, 
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }

    res.status(200).json({
      success: true,
      data: order,
      serverTotal 
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: isDev ? error.message : 'Error creating payment order'
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    
    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    );

    if (isAuthentic) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Ownership check
      if (order.customer && order.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // SEC-03 Guard 1: Prevent re-paying an already-paid or refunded order
      if (order.paymentStatus === 'paid') {
        return res.status(409).json({ success: false, message: 'This order has already been paid.' });
      }

      // SEC-03 Guard 2: Ensure razorpay_order_id matches what was stored for this order
      if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ success: false, message: 'Payment order ID mismatch. Verification failed.' });
      }

      // SEC-03 Guard 3: Prevent replay — ensure this payment_id has never been used before
      const duplicate = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'This payment has already been processed.' });
      }

      order.paymentStatus = 'paid';
      order.paymentMethod = 'online';
      order.razorpayOrderId = razorpay_order_id;
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
      
      getIO().to('staff_room').emit('newOrder', {
        order: order,
        message: `🔔 New ${order.orderType.toUpperCase()} Order Received! (#${order.orderNumber})`
      });
      getIO().to('staff_room').emit('ordersUpdated');

      res.status(200).json({
        success: true,
        message: 'Payment verified and order updated successfully',
        data: order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: isDev ? error.message : 'Error verifying payment'
    });
  }
};

export default {
  createRazorpayOrder,
  verifyPayment
};
