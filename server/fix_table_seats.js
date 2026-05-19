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

  // Clean up all tables: calculate their correct active seats based on active orders
  const tables = await Table.find({ isActive: true });
  const activeOrders = await Order.find({
    orderType: 'dine-in',
    orderStatus: { $nin: ['cancelled', 'delivered'] }
  });

  for (const table of tables) {
    let groupTableIds = [table._id.toString()];
    if (table.mergedGroup && table.mergedGroup.length > 0) {
      const groupTables = tables.filter(t => table.mergedGroup.includes(t.tableNumber));
      groupTableIds = groupTables.map(t => t._id.toString());
    }

    const tableOrders = activeOrders.filter(
      order => order.table && groupTableIds.includes(order.table.toString())
    );

    const totalOccupied = tableOrders.reduce((sum, o) => sum + (o.occupiedSeats || 0), 0);
    const status = totalOccupied > 0 ? 'occupied' : 'available';

    console.log(`Table ${table.tableNumber}: setting occupiedSeats to ${totalOccupied}, status to ${status}`);
    await Table.findByIdAndUpdate(table._id, { occupiedSeats: totalOccupied, status });
  }

  console.log("Database correction completed successfully!");
  await mongoose.disconnect();
}

run().catch(console.error);
