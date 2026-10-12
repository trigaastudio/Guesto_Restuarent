import mongoose from 'mongoose';
import Supplier from '../models/supplierSchema.js';
import SupplierTransaction from '../models/supplierTransactionSchema.js';

// GET all suppliers with aggregated balance
export const getSuppliers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();

    // Aggregate totals for each supplier
    const supplierIds = suppliers.map(s => s._id);
    const aggregates = await SupplierTransaction.aggregate([
      { $match: { supplier: { $in: supplierIds } } },
      {
        $group: {
          _id: '$supplier',
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          totalAdvances: {
            $sum: { $cond: [{ $eq: ['$type', 'advance'] }, '$amount', 0] }
          },
          lastTransactionDate: { $max: '$date' },
          transactionCount: { $sum: 1 },
        }
      }
    ]);

    const aggMap = new Map();
    aggregates.forEach(agg => {
      aggMap.set(agg._id.toString(), {
        totalExpenses: agg.totalExpenses || 0,
        totalAdvances: agg.totalAdvances || 0,
        balance: (agg.totalExpenses || 0) - (agg.totalAdvances || 0), // positive = amount owed to supplier
        lastTransactionDate: agg.lastTransactionDate,
        transactionCount: agg.transactionCount || 0,
      });
    });

    const enrichedSuppliers = suppliers.map(s => {
      const agg = aggMap.get(s._id.toString()) || {
        totalExpenses: 0,
        totalAdvances: 0,
        balance: 0,
        lastTransactionDate: null,
        transactionCount: 0,
      };
      return {
        ...s,
        ...agg,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedSuppliers,
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, category, address, notes, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      category: category?.trim() || 'General',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE supplier
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const supplier = await Supplier.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE supplier
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Delete associated transactions
    await SupplierTransaction.deleteMany({ supplier: id });
    await Supplier.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Supplier and related transactions deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET supplier transactions (expenses & advances)
export const getTransactions = async (req, res) => {
  try {
    const { supplierId, type, startDate, endDate, search, limit = 100, page = 1 } = req.query;
    let query = {};

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      query.supplier = supplierId;
    }

    if (type && ['expense', 'advance'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      // Find suppliers matching search first
      const matchedSuppliers = await Supplier.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const matchedSupplierIds = matchedSuppliers.map(s => s._id);

      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { supplier: { $in: matchedSupplierIds } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      SupplierTransaction.find(query)
        .populate('supplier', 'name category phone contactPerson')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupplierTransaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE supplier transaction (expense or advance)
export const createTransaction = async (req, res) => {
  try {
    const { supplier, date, type, amount, paymentMethod, billNumber, description } = req.body;

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }
    if (!type || !['expense', 'advance'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Transaction type must be expense or advance' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const transaction = await SupplierTransaction.create({
      supplier,
      date: date ? new Date(date) : new Date(),
      type,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      billNumber: billNumber?.trim() || '',
      description: description?.trim() || '',
      recordedBy: req.user?._id,
    });

    const populated = await SupplierTransaction.findById(transaction._id)
      .populate('supplier', 'name category phone contactPerson');

    res.status(201).json({
      success: true,
      message: `${type === 'expense' ? 'Expense' : 'Advance'} recorded successfully`,
      data: populated,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE supplier transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier, date, type, amount, paymentMethod, billNumber, description } = req.body;

    const updateData = {};
    if (supplier) updateData.supplier = supplier;
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (billNumber !== undefined) updateData.billNumber = billNumber.trim();
    if (description !== undefined) updateData.description = description.trim();

    const transaction = await SupplierTransaction.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('supplier', 'name category phone contactPerson');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE supplier transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await SupplierTransaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET supplier summary statistics
export const getSupplierSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [allTimeStats, thisMonthStats, totalSuppliers, activeSuppliers] = await Promise.all([
      SupplierTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalExpenses: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
            },
            totalAdvances: {
              $sum: { $cond: [{ $eq: ['$type', 'advance'] }, '$amount', 0] }
            },
            totalCount: { $sum: 1 },
          }
        }
      ]),
      SupplierTransaction.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        {
          $group: {
            _id: null,
            totalExpenses: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
            },
            totalAdvances: {
              $sum: { $cond: [{ $eq: ['$type', 'advance'] }, '$amount', 0] }
            },
          }
        }
      ]),
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: 'active' }),
    ]);

    const totalExpenses = allTimeStats[0]?.totalExpenses || 0;
    const totalAdvances = allTimeStats[0]?.totalAdvances || 0;
    const monthExpenses = thisMonthStats[0]?.totalExpenses || 0;
    const monthAdvances = thisMonthStats[0]?.totalAdvances || 0;
    const netBalance = totalExpenses - totalAdvances;

    res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        totalAdvances,
        netBalance,
        monthExpenses,
        monthAdvances,
        totalSuppliers,
        activeSuppliers,
      }
    });
  } catch (error) {
    console.error('Error fetching supplier summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
