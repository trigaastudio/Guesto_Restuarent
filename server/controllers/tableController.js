import Table from '../models/tableSchema.js';
import Order from '../models/orderSchema.js';
import { emitTablesUpdated, getIO } from '../socket.js';
import { logAdminAction } from '../services/auditService.js';


export const createTable = async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    
    await logAdminAction(req, 'CREATE_TABLE', 'Table', table._id, { tableNumber: table.tableNumber, capacity: table.capacity });

    res.status(201).json(table);
    emitTablesUpdated();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getTables = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const tables = await Table.find(filter).sort({ tableNumber: 1 });

    const activeOrders = await Order.find({
      orderType: 'dine-in',
      orderStatus: { $nin: ['cancelled', 'completed'] },
      $or: [
        { orderStatus: { $nin: ['billed', 'delivered'] } },
        { paymentStatus: { $ne: 'paid' } }
      ]
    }).populate('items.menuItem', 'name image price');

    
    const tablesWithActivity = tables.map(table => {
      const tableObj = table.toObject();

      let groupTables = [table];
      let groupTableIds = [table._id.toString()];
      let totalCapacity = table.capacity || 4;

      if (table.mergedGroup && table.mergedGroup.length > 0) {
        groupTables = tables.filter(t => table.mergedGroup.includes(t.tableNumber));
        groupTableIds = groupTables.map(t => t._id.toString());
        totalCapacity = groupTables.reduce((sum, t) => sum + (t.capacity || 4), 0);
      }

      tableObj.capacity = totalCapacity;

      
      tableObj.activeOrders = activeOrders.filter(
        order => order.table && groupTableIds.includes(order.table.toString())
      );

      const totalOccupied = tableObj.activeOrders.reduce((sum, o) => sum + (o.occupiedSeats || 0), 0);

      if (totalOccupied > 0) {
        tableObj.status = 'occupied';
        tableObj.occupiedSeats = totalOccupied;
        if (table.status !== 'occupied' || table.occupiedSeats !== totalOccupied) {
          Table.findByIdAndUpdate(table._id, { status: 'occupied', occupiedSeats: totalOccupied }).exec().catch(err => console.error(err));
        }
      } else {
        tableObj.status = 'available';
        tableObj.occupiedSeats = 0;
        if (table.status !== 'available' || table.occupiedSeats !== 0) {
          Table.findByIdAndUpdate(table._id, { status: 'available', occupiedSeats: 0 }).exec().catch(err => console.error(err));
        }
      }
      return tableObj;
    });

    res.status(200).json(tablesWithActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    
    await logAdminAction(req, 'UPDATE_TABLE', 'Table', table._id, { updatedFields: Object.keys(req.body) });

    res.status(200).json(table);
    emitTablesUpdated();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    await logAdminAction(req, 'DELETE_TABLE', 'Table', table._id, { tableNumber: table.tableNumber });

    res.status(200).json({ message: 'Table deleted successfully' });
    emitTablesUpdated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const mergeTables = async (req, res) => {
  try {
    const { sourceTableId, destinationTableId } = req.body;

    if (!sourceTableId || !destinationTableId) {
      return res.status(400).json({ message: 'Source and destination table IDs are required' });
    }

    if (sourceTableId === destinationTableId) {
      return res.status(400).json({ message: 'Cannot merge a table into itself.' });
    }

    
    const activeOrders = await Order.find({
      table: sourceTableId,
      orderType: 'dine-in',
      orderStatus: { $nin: ['cancelled', 'completed'] },
      $or: [
        { orderStatus: { $nin: ['billed', 'delivered'] } },
        { paymentStatus: { $ne: 'paid' } }
      ]
    });

    if (activeOrders.length === 0) {
      return res.status(400).json({ message: 'No active orders found on the source table to merge.' });
    }

    
    const sourceTable = await Table.findById(sourceTableId);
    const destinationTable = await Table.findById(destinationTableId);

    const sourceSeats = sourceTable ? (sourceTable.occupiedSeats || 0) : 0;
    const destSeats = destinationTable ? (destinationTable.occupiedSeats || 0) : 0;
    const destCapacity = destinationTable ? (destinationTable.capacity || 4) : 4;
    const newDestSeats = Math.min(destCapacity, destSeats + sourceSeats);

    
    for (const order of activeOrders) {
      order.table = destinationTableId;
      await order.save(); 
    }

    
    await Table.findByIdAndUpdate(sourceTableId, { status: 'available', occupiedSeats: 0 });

    
    await Table.findByIdAndUpdate(destinationTableId, { 
      status: 'occupied', 
      occupiedSeats: newDestSeats 
    });

    await logAdminAction(req, 'MERGE_TABLES', 'Table', destinationTableId, { sourceTableId, mergedOrdersCount: activeOrders.length });

    res.status(200).json({ message: `Successfully merged ${activeOrders.length} orders into the new table.` });
    emitTablesUpdated();
    getIO().to('staff_room').emit('ordersUpdated');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const coshareMergeTables = async (req, res) => {
  try {
    const { tableNumbers } = req.body;
    if (!tableNumbers || !Array.isArray(tableNumbers) || tableNumbers.length < 2) {
      return res.status(400).json({ message: "Please select at least 2 tables to merge." });
    }

    const tables = await Table.find({ tableNumber: { $in: tableNumbers }, isActive: true });
    if (tables.length !== tableNumbers.length) {
      return res.status(404).json({ message: "One or more selected tables were not found." });
    }

    
    await Table.updateMany(
      { tableNumber: { $in: tableNumbers } },
      { $set: { mergedGroup: tableNumbers } }
    );

    await logAdminAction(req, 'COSHARE_TABLES', 'Table', null, { tableNumbers });

    res.status(200).json({ message: `Tables ${tableNumbers.join(", ")} merged successfully.`, mergedGroup: tableNumbers });
    emitTablesUpdated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const coshareUnmergeTables = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required." });
    }

    const table = await Table.findOne({ tableNumber, isActive: true });
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }

    const group = table.mergedGroup || [];
    if (group.length === 0) {
      return res.status(400).json({ message: "This table is not merged." });
    }

    await Table.updateMany(
      { tableNumber: { $in: group } },
      { $set: { mergedGroup: [] } }
    );

    await logAdminAction(req, 'UNMERGE_TABLES', 'Table', table._id, { unmergedGroup: group });

    res.status(200).json({ message: "Tables unmerged successfully." });
    emitTablesUpdated();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
