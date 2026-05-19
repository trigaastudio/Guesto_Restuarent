import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TableSchema = new mongoose.Schema({
  tableNumber: Number,
  capacity: Number,
  occupiedSeats: Number,
  status: String,
  mergedGroup: [Number]
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  orderType: String,
  orderStatus: String,
  occupiedSeats: Number,
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' }
}, { timestamps: true });

const Table = mongoose.model('Table', TableSchema);
const Order = mongoose.model('Order', OrderSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const tables = await Table.find({ tableNumber: { $in: [4, 5] } });
  console.log("TABLES:");
  console.log(JSON.stringify(tables, null, 2));

  const activeOrders = await Order.find({
    orderType: 'dine-in',
    orderStatus: { $nin: ['cancelled', 'delivered'] }
  });
  console.log("ACTIVE DINE-IN ORDERS:");
  console.log(JSON.stringify(activeOrders, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
