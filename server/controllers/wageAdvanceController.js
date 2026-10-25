import mongoose from 'mongoose';
import WageEmployee from '../models/wageEmployeeSchema.js';
import WageAdvance from '../models/wageAdvanceSchema.js';

// GET all wage employees with their advance balance
export const getEmployees = async (req, res) => {
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
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await WageEmployee.find(query).sort({ name: 1 }).lean();
    const employeeIds = employees.map(e => e._id);

    // Aggregate advances per employee
    const aggregates = await WageAdvance.aggregate([
      { $match: { employee: { $in: employeeIds } } },
      {
        $group: {
          _id: '$employee',
          totalAdvances: { $sum: '$amount' },
          pendingAdvances: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          settledAdvances: {
            $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$amount', 0] }
          },
          lastAdvanceDate: { $max: '$date' },
          advanceCount: { $sum: 1 },
        }
      }
    ]);

    const aggMap = new Map();
    aggregates.forEach(agg => {
      aggMap.set(agg._id.toString(), {
        totalAdvances: agg.totalAdvances || 0,
        pendingAdvances: agg.pendingAdvances || 0,
        settledAdvances: agg.settledAdvances || 0,
        lastAdvanceDate: agg.lastAdvanceDate,
        advanceCount: agg.advanceCount || 0,
      });
    });

    const enrichedEmployees = employees.map(e => {
      const agg = aggMap.get(e._id.toString()) || {
        totalAdvances: 0,
        pendingAdvances: 0,
        settledAdvances: 0,
        lastAdvanceDate: null,
        advanceCount: 0,
      };
      return {
        ...e,
        ...agg,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedEmployees,
    });
  } catch (error) {
    console.error('Error fetching wage employees:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE employee
export const createEmployee = async (req, res) => {
  try {
    const { name, phone, role, monthlyWage, joiningDate, status, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }

    const employee = await WageEmployee.create({
      name: name.trim(),
      phone: phone?.trim() || '',
      role: role?.trim() || 'Worker',
      monthlyWage: Number(monthlyWage) || 0,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: status || 'active',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await WageEmployee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await WageEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Delete associated advances
    await WageAdvance.deleteMany({ employee: id });
    await WageEmployee.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Employee and advance records deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET wage advances
export const getWageAdvances = async (req, res) => {
  try {
    const { employeeId, status, startDate, endDate, search, limit = 100, page = 1 } = req.query;
    let query = {};

    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employee = employeeId;
    }

    if (status && ['pending', 'settled'].includes(status)) {
      query.status = status;
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
      const matchedEmployees = await WageEmployee.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      const matchedEmployeeIds = matchedEmployees.map(e => e._id);

      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { employee: { $in: matchedEmployeeIds } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [advances, total] = await Promise.all([
      WageAdvance.find(query)
        .populate('employee', 'name phone role monthlyWage')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WageAdvance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: advances,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching wage advances:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE wage advance
export const createWageAdvance = async (req, res) => {
  try {
    const { employee, date, amount, paymentMethod, reason, status } = req.body;

    if (!employee) {
      return res.status(400).json({ success: false, message: 'Employee is required' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid advance amount is required' });
    }

    const advance = await WageAdvance.create({
      employee,
      date: date ? new Date(date) : new Date(),
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      reason: reason?.trim() || '',
      status: status || 'pending',
      settledDate: status === 'settled' ? new Date() : null,
      recordedBy: req.user?._id,
    });

    const populated = await WageAdvance.findById(advance._id)
      .populate('employee', 'name phone role monthlyWage');

    res.status(201).json({
      success: true,
      message: 'Wage advance recorded successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Error creating wage advance:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE wage advance
export const updateWageAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee, date, amount, paymentMethod, reason, status, settledNotes } = req.body;

    const updateData = {};
    if (employee) updateData.employee = employee;
    if (date) updateData.date = new Date(date);
    if (amount !== undefined) updateData.amount = Number(amount);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (reason !== undefined) updateData.reason = reason.trim();
    if (status) {
      updateData.status = status;
      if (status === 'settled') {
        updateData.settledDate = updateData.settledDate || new Date();
      } else {
        updateData.settledDate = null;
      }
    }
    if (settledNotes !== undefined) updateData.settledNotes = settledNotes.trim();

    const advance = await WageAdvance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('employee', 'name phone role monthlyWage');

    if (!advance) {
      return res.status(404).json({ success: false, message: 'Wage advance record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Wage advance updated successfully',
      data: advance,
    });
  } catch (error) {
    console.error('Error updating wage advance:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// TOGGLE SETTLEMENT STATUS
export const toggleSettlementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { settledNotes } = req.body;

    const advance = await WageAdvance.findById(id);
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Wage advance record not found' });
    }

    const newStatus = advance.status === 'pending' ? 'settled' : 'pending';
    advance.status = newStatus;
    advance.settledDate = newStatus === 'settled' ? new Date() : null;
    if (settledNotes !== undefined) advance.settledNotes = settledNotes;

    await advance.save();
    const populated = await WageAdvance.findById(advance._id)
      .populate('employee', 'name phone role monthlyWage');

    res.status(200).json({
      success: true,
      message: `Advance marked as ${newStatus === 'settled' ? 'Settled (Deducted)' : 'Pending'}`,
      data: populated,
    });
  } catch (error) {
    console.error('Error toggling settlement:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE wage advance
export const deleteWageAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const advance = await WageAdvance.findByIdAndDelete(id);
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Wage advance record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Wage advance deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting wage advance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET wage advance summary statistics
export const getWageAdvanceSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [allTimeStats, thisMonthStats, todayStats, totalEmployees, activeEmployees] = await Promise.all([
      WageAdvance.aggregate([
        {
          $group: {
            _id: null,
            totalAdvances: { $sum: '$amount' },
            pendingAdvances: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            settledAdvances: {
              $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$amount', 0] }
            },
            count: { $sum: 1 },
          }
        }
      ]),
      WageAdvance.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        {
          $group: {
            _id: null,
            totalAdvances: { $sum: '$amount' },
            pendingAdvances: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            settledAdvances: {
              $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$amount', 0] }
            },
          }
        }
      ]),
      WageAdvance.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        {
          $group: {
            _id: null,
            todayAdvances: { $sum: '$amount' },
            todayPending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            todaySettled: {
              $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$amount', 0] }
            },
          }
        }
      ]),
      WageEmployee.countDocuments(),
      WageEmployee.countDocuments({ status: 'active' }),
    ]);

    const totalAdvances = allTimeStats[0]?.totalAdvances || 0;
    const pendingAdvances = allTimeStats[0]?.pendingAdvances || 0;
    const settledAdvances = allTimeStats[0]?.settledAdvances || 0;

    const monthAdvances = thisMonthStats[0]?.totalAdvances || 0;
    const monthPending = thisMonthStats[0]?.pendingAdvances || 0;
    const monthSettled = thisMonthStats[0]?.settledAdvances || 0;

    const todayAdvances = todayStats[0]?.todayAdvances || 0;
    const todayPending = todayStats[0]?.todayPending || 0;
    const todaySettled = todayStats[0]?.todaySettled || 0;

    res.status(200).json({
      success: true,
      data: {
        totalAdvances,
        pendingAdvances,
        settledAdvances,
        monthAdvances,
        monthPending,
        monthSettled,
        todayAdvances,
        todayPending,
        todaySettled,
        totalEmployees,
        activeEmployees,
      }
    });
  } catch (error) {
    console.error('Error fetching wage advance summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
