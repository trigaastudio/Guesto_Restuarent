import crypto from 'crypto';
import Order from '../models/orderSchema.js';
import Cart from '../models/cartSchema.js';
import User from '../models/userSchema.js';
import Counter from '../models/counterSchema.js';
import Menu from '../models/menuSchema.js';
import Category from '../models/categorySchema.js';
import Settings from '../models/settingsSchema.js';
import { getIO, emitStockUpdate, emitCategoryStockUpdate } from '../socket.js';

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
    const menuDoc = await Menu.findById(item.menuItem).populate('category');
    if (!menuDoc) continue;

    const variant = menuDoc.variants.find(v => v.size === item.size);
    const multiplier = variant && variant.stockValue ? variant.stockValue : 1;
    const amountNeeded = item.quantity * multiplier;

    if (menuDoc.category && menuDoc.category.isSharedStock) {
      if (menuDoc.category.totalStock < amountNeeded) {
        return { available: false, itemName: menuDoc.name };
      }
    } else if (menuDoc.totalStock < amountNeeded) {
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

    if (menuDoc.isCombo && menuDoc.comboItems && menuDoc.comboItems.length > 0) {
      for (const comboItem of menuDoc.comboItems) {
        const comboDoc = await Menu.findById(comboItem.menuItem);
        if (!comboDoc) continue;
        const totalNeeded = item.quantity * comboItem.quantity;
        if (comboDoc.totalStock < totalNeeded) {
          return { available: false, itemName: `${comboDoc.name} (combo item)` };
        }
      }
    }
  }
  return { available: true };
};

const handleStock = async (items, type = 'reduce') => {
  for (const item of items) {
    try {
      const menuDoc = await Menu.findById(item.menuItem).populate('category');
      if (!menuDoc) continue;

      const variant = menuDoc.variants.find(v => v.size === item.size);
      const multiplier = variant && variant.stockValue ? variant.stockValue : 1;
      const amount = item.quantity * multiplier;
      const factor = type === 'reduce' ? -1 : 1;

      if (menuDoc.category && menuDoc.category.isSharedStock) {
        // Update shared category stock
        const updatedCategory = await Category.findByIdAndUpdate(
          menuDoc.category._id,
          { $inc: { totalStock: factor * amount } },
          { returnDocument: 'after' }
        );

        if (updatedCategory && updatedCategory.totalStock < 0) {
          await Category.findByIdAndUpdate(menuDoc.category._id, { totalStock: 0 });
          updatedCategory.totalStock = 0;
        }

        if (updatedCategory) {
          emitCategoryStockUpdate(updatedCategory._id, updatedCategory.totalStock);
        }

        if (type === 'reduce' && updatedCategory) {
          if (updatedCategory.totalStock <= 0) {
            getIO().emit('stockAlert', {
              type: 'outOfStock',
              itemId: updatedCategory._id, // Might need distinction from menuItemId on client
              name: updatedCategory.name,
              message: `CRITICAL: ${updatedCategory.name} Category is now OUT OF STOCK!`
            });
          } else if (updatedCategory.totalStock <= 5) {
            getIO().emit('stockAlert', {
              type: 'lowStock',
              itemId: updatedCategory._id,
              name: updatedCategory.name,
              message: `ALERT: ${updatedCategory.name} Category is running low (${updatedCategory.totalStock} left)`
            });
          }
        }
      } else {
        // Update main item stock
        const updatedMenu = await Menu.findByIdAndUpdate(
          item.menuItem,
          { $inc: { totalStock: factor * amount } },
          { returnDocument: 'after' }
        );

        // Force floor at 0 if it somehow went negative
        if (updatedMenu && updatedMenu.totalStock < 0) {
          await Menu.findByIdAndUpdate(item.menuItem, { totalStock: 0 });
          updatedMenu.totalStock = 0;
        }

        if (updatedMenu) {
          emitStockUpdate(updatedMenu._id, updatedMenu.totalStock);
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
      }

      // Update included items stock
      if (variant && variant.includedItems && variant.includedItems.length > 0) {
        for (const included of variant.includedItems) {
          const includedReduction = item.quantity * included.quantity;
          const updatedIncluded = await Menu.findByIdAndUpdate(
            included.menuItem,
            { $inc: { totalStock: factor * includedReduction } },
            { returnDocument: 'after' }
          );

          if (updatedIncluded && updatedIncluded.totalStock < 0) {
            await Menu.findByIdAndUpdate(included.menuItem, { totalStock: 0 });
            updatedIncluded.totalStock = 0;
          }

          if (updatedIncluded) {
            emitStockUpdate(updatedIncluded._id, updatedIncluded.totalStock);
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

      // Update combo items stock
      if (menuDoc.isCombo && menuDoc.comboItems && menuDoc.comboItems.length > 0) {
        for (const comboItem of menuDoc.comboItems) {
          const comboReduction = item.quantity * comboItem.quantity;
          const updatedComboItem = await Menu.findByIdAndUpdate(
            comboItem.menuItem,
            { $inc: { totalStock: factor * comboReduction } },
            { returnDocument: 'after' }
          );

          if (updatedComboItem && updatedComboItem.totalStock < 0) {
            await Menu.findByIdAndUpdate(comboItem.menuItem, { totalStock: 0 });
            updatedComboItem.totalStock = 0;
          }

          if (updatedComboItem) {
            emitStockUpdate(updatedComboItem._id, updatedComboItem.totalStock);
          }

          // Stock Alerts for combo items
          if (type === 'reduce' && updatedComboItem) {
            if (updatedComboItem.totalStock <= 0) {
              getIO().emit('stockAlert', {
                type: 'outOfStock',
                itemId: updatedComboItem._id,
                name: updatedComboItem.name,
                message: `CRITICAL: ${updatedComboItem.name} (combo item) is now OUT OF STOCK!`
              });
            } else if (updatedComboItem.totalStock <= 5) {
              getIO().emit('stockAlert', {
                type: 'lowStock',
                itemId: updatedComboItem._id,
                name: updatedComboItem.name,
                message: `ALERT: ${updatedComboItem.name} (combo item) is running low (${updatedComboItem.totalStock} left)`
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

const checkStoreStatusHelper = (settings) => {
  if (!settings?.operationalSettings) return { isOpen: true };
  const { isStoreOpen, isHolidayMode, businessHours } = settings.operationalSettings;
  
  if (isHolidayMode) return { isOpen: false, reason: 'holiday' };
  if (isStoreOpen === false) return { isOpen: false, reason: 'manual_close' };

  // BULLETPROOF IST CALCULATION (UTC + 5:30)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (330 * 60000));

  const day = istDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Check if today is a closed day
  const closedDays = businessHours?.closedDays || [];
  const isClosedToday = closedDays.some(d => d.toLowerCase() === day.toLowerCase());
  if (isClosedToday) {
    return { isOpen: false, reason: 'closed_day' };
  }

  if (businessHours?.open && businessHours?.close) {
    // Robust Time Parsing (Handles "11:00", "11.00", etc.)
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.replace('.', ':').split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    };

    // Format HH:mm string to 12-hour AM/PM format
    const format12Hour = (timeStr) => {
      if (!timeStr) return '';
      const parts = timeStr.replace('.', ':').split(':');
      let h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      const mStr = m < 10 ? `0${m}` : m;
      return `${h}:${mStr} ${ampm}`;
    };

    const currentTime = istDate.getHours() * 60 + istDate.getMinutes();
    const openMinutes = parseTime(businessHours.open);
    const closeMinutes = parseTime(businessHours.close);

    let isStoreCurrentlyOpen = true;
    let reason = '';

    if (closeMinutes < openMinutes) {
      // CROSSES MIDNIGHT (e.g. 11:00 AM to 12:57 AM the next morning)
      if (currentTime >= openMinutes || currentTime <= closeMinutes) {
        isStoreCurrentlyOpen = true;
      } else {
        isStoreCurrentlyOpen = false;
        reason = `We open at ${format12Hour(businessHours.open)}`;
      }
    } else {
      // DOES NOT CROSS MIDNIGHT (e.g. 09:00 AM to 10:00 PM)
      if (currentTime >= openMinutes && currentTime <= closeMinutes) {
        isStoreCurrentlyOpen = true;
      } else {
        isStoreCurrentlyOpen = false;
        if (currentTime < openMinutes) {
          reason = `We open at ${format12Hour(businessHours.open)}`;
        } else {
          reason = `We closed at ${format12Hour(businessHours.close)}`;
        }
      }
    }

    if (!isStoreCurrentlyOpen) {
      return { isOpen: false, reason };
    }
  }

  return { isOpen: true };
};

class OrderController {
  // --- USER FACING METHODS ---

  async placeOrder(req, res) {
    try {
      const { items, address, paymentMethod, totalAmount, subtotal, discount, tax, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      // Determine Order Source and Type
      const isUser = req.user.role === 'user';
      const finalOrderSource = isUser ? 'user' : (req.user.role || 'admin');
      const finalOrderType = isUser ? 'delivery' : (req.body.orderType || 'dine-in');

      const settings = await Settings.getSettings();

      // Check Store Status (Holidays, Working Hours) for customer orders
      if (finalOrderSource === 'user') {
        const storeStatus = checkStoreStatusHelper(settings);
        if (!storeStatus.isOpen) {
          let msg = 'Store is currently closed.';
          if (storeStatus.reason === 'holiday') {
            msg = 'We are closed for holidays. Please order again when we reopen.';
          } else if (storeStatus.reason === 'closed_day') {
            msg = 'We are closed today. Please order again tomorrow.';
          } else if (storeStatus.reason === 'manual_close') {
            msg = 'The store is currently closed. Please check back later.';
          } else if (storeStatus.reason) {
            msg = `The store is currently closed (${storeStatus.reason}).`;
          }
          return res.status(400).json({ success: false, message: msg });
        }
      }

      // Check Minimum Order Amount
      if (totalAmount < 140) {
        return res.status(400).json({ success: false, message: 'Minimum order amount is ₹140 to proceed to payment.' });
      }

      // Check Stock First
      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }

      // Verify Razorpay Payment Signature for online payments
      if (paymentMethod === 'online') {
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ success: false, message: 'Payment verification details are missing.' });
        }

        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        const isAuthentic = expectedSignature === razorpaySignature;
        if (!isAuthentic) {
          return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
        }
      }

      // Wallet Payment logic removed

      const orderNumber = await getNextOrderNumber();

      // Calculate delivery fee on server for security
      let deliveryFee = 0;
      if (finalOrderType === 'delivery' && address.location) {
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
        items: await Promise.all(items.map(async item => {
          const menuDoc = await Menu.findById(item.menuItem);
          const variant = menuDoc?.variants?.find(v => v.size === item.size);
          
          let comboItems = [];
          if (menuDoc?.isCombo && menuDoc.comboItems) {
            comboItems = await Promise.all(menuDoc.comboItems.map(async ci => {
              const subDoc = await Menu.findById(ci.menuItem);
              return { name: subDoc?.name || 'Combo Item', quantity: ci.quantity, price: ci.price };
            }));
          }

          let includedItems = [];
          if (variant?.includedItems) {
            includedItems = await Promise.all(variant.includedItems.map(async ii => {
              const incDoc = await Menu.findById(ii.menuItem);
              return { name: incDoc?.name || 'Add-on Item', quantity: ii.quantity };
            }));
          }

          return {
            menuItem: item.menuItem,
            name: menuDoc?.name || item.name || 'Unknown Item',
            image: menuDoc?.image || item.image || '',
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            unitPrice: item.price,
            costPrice: variant?.costPrice || 0,
            totalPrice: item.price * item.quantity,
            kitchenStatus: 'placed',
            bogoItem: item.bogoItem || null,
            comboItems,
            includedItems
          };
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
        platformFee: req.body.platformFee || 0,
        discount: discount || 0,
        tax: tax || 0,
        totalAmount: subtotal + (deliveryFee || req.body.deliveryFee || 0) + (req.body.platformFee || 0) + (tax || 0),
        orderStatus: 'placed',
        kitchenStatus: 'placed',
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'unpaid',
        razorpayOrderId,
        razorpayPaymentId,
        remarks: req.body.remarks || ''
      });

      if (finalOrderType === 'dine-in') {
        newOrder.table = req.body.tableId;
        newOrder.sessionId = req.body.sessionId || `SES-${Date.now()}`;
      }

      await newOrder.save();

      // Reduce Stock
      await handleStock(items, 'reduce');

      // Wallet transaction update removed

      // Clear cart
      await Cart.findOneAndDelete({ customer: req.user._id }).catch(() => { });
      await Cart.findOneAndDelete({ user: req.user._id }).catch(() => { });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: newOrder
      });

      // Global Notification (COD and Paid Online Orders)
      if (newOrder.paymentMethod === 'cod' || newOrder.paymentStatus === 'paid') {
        getIO().emit('newOrder', {
          order: newOrder,
          message: `🔔 New ${newOrder.orderType.toUpperCase()} Order Received! (#${newOrder.orderNumber})`
        });
        getIO().emit('ordersUpdated');
      }
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
          message: 'This order has already been accepted and can no longer be cancelled.'
        });
      }

      if (order.kitchenStatus !== 'placed') {
        return res.status(400).json({
          success: false,
          message: `The kitchen has already started preparing your meal. It can no longer be cancelled.`
        });
      }

      // Restore Stock
      await restoreStock(order.items);

      // Mark refunded if paid
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }

      order.orderStatus = 'cancelled';
      await order.save();

      res.status(200).json({
        success: true,
        message: order.paymentStatus === 'refunded'
          ? 'Order cancelled and amount refunded'
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

      let paymentStatus = req.body.paymentStatus || 'unpaid';
      if ((paymentMethod === 'cash' || paymentMethod === 'upi/card') && cashReceived >= totalAmount) {
        paymentStatus = 'paid';
      }

      const newOrder = new Order({
        orderNumber,
        orderType: orderType || 'takeaway',
        orderSource: req.body.orderSource || 'admin',
        orderStatus: orderType === 'dine-in' ? 'placed' : 'processing',
        occupiedSeats: req.body.occupiedSeats || 0,
        customerDetails: {
          name: customerDetails?.name || 'Walk-in',
          phone: customerDetails?.phone,
          address: customerDetails?.address,
          location: customerDetails?.location,
        },
        items: await Promise.all(items.map(async item => {
          const menuDoc = await Menu.findById(item.menuItem);
          const variant = menuDoc?.variants?.find(v => v.size === item.size);
          
          let comboItems = [];
          if (menuDoc?.isCombo && menuDoc.comboItems) {
            comboItems = await Promise.all(menuDoc.comboItems.map(async ci => {
              const subDoc = await Menu.findById(ci.menuItem);
              return { name: subDoc?.name || 'Combo Item', quantity: ci.quantity, price: ci.price };
            }));
          }

          let includedItems = [];
          if (variant?.includedItems) {
            includedItems = await Promise.all(variant.includedItems.map(async ii => {
              const incDoc = await Menu.findById(ii.menuItem);
              return { name: incDoc?.name || 'Add-on Item', quantity: ii.quantity };
            }));
          }

          return {
            ...item,
            name: menuDoc?.name || item.name,
            image: menuDoc?.image || item.image,
            costPrice: variant?.costPrice || 0,
            kitchenStatus: 'placed',
            bogoItem: item.bogoItem || null,
            comboItems,
            includedItems
          };
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

      if (orderType === 'dine-in' && req.body.tableId) {
        newOrder.table = req.body.tableId;
      }

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

      // Filter: Show successful payments, COD/Cash orders, OR ANY Dine-In/Takeaway order
      // This allows active tables and counter orders to be visible while still hiding failed/unpaid online/delivery orders
      query.$or = [
        { paymentStatus: 'paid' },
        { paymentMethod: { $in: ['cod', 'cash'] } },
        { orderType: 'dine-in' },
        { orderType: 'takeaway' },
        { orderSource: 'admin' }
      ];

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

      // Auto-mark as paid when delivered
      if (updateData.orderStatus === 'delivered') {
        updateData.paymentStatus = 'paid';
        updateData.paidAmount = updateData.totalAmount ?? originalOrder.totalAmount;
      }

      if (updateData.cashReceived !== undefined || updateData.totalAmount !== undefined) {
        const cash = updateData.cashReceived ?? originalOrder.cashReceived;
        const total = updateData.totalAmount ?? originalOrder.totalAmount;
        if (originalOrder.paymentMethod === 'cash' && cash >= total && total > 0) {
          updateData.paymentStatus = 'paid';
          updateData.paidAmount = total;
        }
      }

      if (originalOrder.orderType === 'delivery' && originalOrder.orderSource === 'user' && updateData.items) {
        return res.status(403).json({ success: false, message: 'User delivery orders cannot have their items modified by admin' });
      }

      Object.assign(originalOrder, updateData);

      if (!["cash", "upi/card", "online", "cod", "wallet", "Not Specified"].includes(originalOrder.paymentMethod)) {
        originalOrder.paymentMethod = 'Not Specified';
      }
      if (!["paid", "unpaid", "refunded"].includes(originalOrder.paymentStatus)) {
        originalOrder.paymentStatus = 'unpaid';
      }

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

  async updateAllItemsStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { kitchenStatus } = req.body;

      const allowedStatuses = ['placed', 'preparing', 'ready', 'delayed'];
      if (!allowedStatuses.includes(kitchenStatus)) {
        return res.status(400).json({ success: false, message: `Invalid kitchen status: "${kitchenStatus}"` });
      }

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Important: iterate through Mongoose Document Array properly
      let isChanged = false;
      order.items.forEach(item => {
        if (item.kitchenStatus !== kitchenStatus) {
          item.kitchenStatus = kitchenStatus;
          isChanged = true;
        }
      });

      if (isChanged) {
        order.markModified('items');
        await order.save();
      }
      
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

      const enrichedItems = await Promise.all(items.map(async item => {
        const menuDoc = await Menu.findById(item.menuItem);
        const variant = menuDoc?.variants?.find(v => v.size === item.size);
        return {
          ...item,
          name: menuDoc?.name || item.name,
          image: menuDoc?.image || item.image,
          costPrice: variant?.costPrice || 0,
          kitchenStatus: 'placed'
        };
      }));
      order.items.push(...enrichedItems);
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

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (['cancelled', 'delivered'].includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: 'Finalized orders cannot be modified' });
      }

      await restoreStock(order.items);

      const stockCheck = await checkStockAvailability(items);
      if (!stockCheck.available) {
        await handleStock(order.items, 'reduce');
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${stockCheck.itemName}` });
      }
      order.items = await Promise.all(items.map(async item => {
        const menuDoc = await Menu.findById(item.menuItem);
        const variant = menuDoc?.variants?.find(v => v.size === item.size);
        const unitPrice = item.unitPrice || item.price || variant?.price || 0;
        const quantity = item.quantity || 1;
        return {
          ...item,
          name: menuDoc?.name || item.name,
          image: menuDoc?.image || item.image,
          unitPrice,
          price: unitPrice,
          costPrice: variant?.costPrice || 0,
          totalPrice: item.totalPrice || (unitPrice * quantity),
          kitchenStatus: item.kitchenStatus || 'placed'
        };
      }));

      if (req.body.customerDetails) {
        order.customerDetails = req.body.customerDetails;
      }

      if (req.body.paymentMethod !== undefined) {
        order.paymentMethod = req.body.paymentMethod;
      }
      if (req.body.paymentStatus !== undefined) {
        order.paymentStatus = req.body.paymentStatus;
      }
      if (req.body.cashReceived !== undefined) {
        order.cashReceived = req.body.cashReceived;
      }
      if (req.body.balance !== undefined) {
        order.balance = req.body.balance;
      }

      const subtotal = order.items.reduce((acc, item) => acc + (item.totalPrice || ((item.unitPrice || item.price || 0) * item.quantity)), 0);
      order.subtotal = subtotal;
      order.totalAmount = subtotal + (order.deliveryFee || 0) + (order.platformFee || 0) + (order.tax || 0);

      if (!["cash", "upi/card", "online", "cod", "Not Specified"].includes(order.paymentMethod)) {
        order.paymentMethod = 'Not Specified';
      }

      if (!["paid", "unpaid", "refunded"].includes(order.paymentStatus)) {
        order.paymentStatus = 'unpaid';
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
            { orderType: 'dine-in', orderStatus: 'billed', paymentStatus: 'paid' },
            { orderType: { $ne: 'dine-in' }, orderStatus: 'delivered', paymentStatus: 'paid' },
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
