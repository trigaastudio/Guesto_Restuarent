import Table from '../models/tableSchema.js';
import Order from '../models/orderSchema.js';

// Create a new table
export const createTable = async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tables (with active orders populated)
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
    
    const activeOrders = await Order.find({
      orderType: 'dine-in',
      orderStatus: { $nin: ['cancelled', 'delivered'] }
    }).populate('items.menuItem', 'name image price');

    // Attach active orders to their respective tables
    const tablesWithActivity = tables.map(table => {
      const tableObj = table.toObject();
      tableObj.activeOrders = activeOrders.filter(
        order => order.table && order.table.toString() === table._id.toString()
      );
      
      // Auto-calculate dynamic status based on orders
      if (tableObj.activeOrders.length > 0) {
        // If all active orders for this table are in "billing" (e.g. they asked for the check)
        // For now we just mark occupied, or "billing" if any order is placed but payment is pending.
        // Let's keep it simple: occupied if there's any active order
        tableObj.status = 'occupied';
      } else {
        tableObj.status = 'available';
      }
      return tableObj;
    });

    res.status(200).json(tablesWithActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a table (e.g. capacity or manual status override)
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.status(200).json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a table (soft delete by setting isActive: false)
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.status(200).json({ message: 'Table deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Merge Table A into Table B
export const mergeTables = async (req, res) => {
  try {
    const { sourceTableId, destinationTableId } = req.body;

    if (!sourceTableId || !destinationTableId) {
      return res.status(400).json({ message: 'Source and destination table IDs are required' });
    }

    if (sourceTableId === destinationTableId) {
      return res.status(400).json({ message: 'Cannot merge a table into itself.' });
    }

    // 1. Find all active orders for the source table
    const activeOrders = await Order.find({
      table: sourceTableId,
      orderType: 'dine-in',
      orderStatus: { $nin: ['cancelled', 'delivered'] }
    });

    if (activeOrders.length === 0) {
      return res.status(400).json({ message: 'No active orders found on the source table to merge.' });
    }

    // 2. Update their table reference to the destination table
    for (const order of activeOrders) {
      order.table = destinationTableId;
      await order.save(); // using save to trigger pre/post hooks
    }

    // 3. Update source table status to available
    await Table.findByIdAndUpdate(sourceTableId, { status: 'available' });
    
    // 4. Update destination table status to occupied
    await Table.findByIdAndUpdate(destinationTableId, { status: 'occupied' });

    res.status(200).json({ message: `Successfully merged ${activeOrders.length} orders into the new table.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
