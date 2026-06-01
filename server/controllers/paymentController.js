import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/orderSchema.js';
import { getIO } from '../socket.js';

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay API keys are missing in .env');
      return res.status(500).json({ 
        success: false, 
        message: 'Razorpay API keys are not configured on the server.' 
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), 
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Razorpay order',
      error: error.message
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

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.paymentStatus = 'paid';
      order.paymentMethod = 'online';
      order.razorpayOrderId = razorpay_order_id;
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
      
      
      getIO().emit('newOrder', {
        order: order,
        message: `🔔 New ${order.orderType.toUpperCase()} Order Received! (#${order.orderNumber})`
      });
      getIO().emit('ordersUpdated');

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
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

export default {
  createRazorpayOrder,
  verifyPayment
};
