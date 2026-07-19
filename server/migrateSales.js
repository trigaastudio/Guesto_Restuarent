import mongoose from 'mongoose';
import Order from './models/orderSchema.js';
import Sale from './models/saleSchema.js';
import 'dotenv/config.js';
import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB. Starting migration...');
    const orders = await Order.find({
      $or: [
        { orderStatus: 'completed' },
        { orderStatus: 'delivered', paymentStatus: 'paid' },
        { orderType: 'dine-in', orderStatus: 'billed', paymentStatus: 'paid' }
      ]
    });

    console.log(`Found ${orders.length} orders to migrate.`);
    let migrated = 0;
    
    for (const order of orders) {
      await Sale.findOneAndUpdate(
        { orderId: order._id },
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          orderSource: order.orderSource,
          orderStatus: order.orderStatus,
          totalAmount: order.totalAmount,
          items: order.items.map(item => ({
            menuItem: item.menuItem,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            costPrice: item.costPrice || 0
          })),
          paymentMethod: order.paymentMethod || 'cash',
          createdAt: order.createdAt
        },
        { upsert: true, new: true }
      );
      migrated++;
    }

    console.log(`Successfully migrated ${migrated} sales records.`);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Migration failed:', err);
    mongoose.connection.close();
  });
