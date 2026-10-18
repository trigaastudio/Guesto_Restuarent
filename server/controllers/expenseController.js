import SupplierTransaction from '../models/supplierTransactionSchema.js';
import WageAdvance from '../models/wageAdvanceSchema.js';
import Supplier from '../models/supplierSchema.js';
import WageEmployee from '../models/wageEmployeeSchema.js';

// Format YYYY-MM-DD in local time
const formatDateKey = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET daily-wise expenses combining supplier expenses, supplier advances, and employee wage advances
export const getDailyExpenses = async (req, res) => {
  try {
    const { startDate, endDate, date: singleDate, type } = req.query;

    const now = new Date();
    const todayKey = formatDateKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    let start = null;
    let end = null;

    if (singleDate) {
      start = new Date(singleDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(singleDate);
      end.setHours(23, 59, 59, 999);
    } else {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      } else {
        // Default to last 30 days
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      }

      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      }
    }

    // Today's range for Today summary
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Queries
    const supplierQuery = { date: { $gte: start, $lte: end } };
    const wageQuery = { date: { $gte: start, $lte: end } };

    // Fetch transactions in selected range + today's items
    const [supplierTransactions, wageAdvances, todaySupplierTx, todayWageAdv] = await Promise.all([
      SupplierTransaction.find(supplierQuery)
        .populate('supplier', 'name category phone contactPerson')
        .sort({ date: -1 })
        .lean(),
      WageAdvance.find(wageQuery)
        .populate('employee', 'name role phone monthlyWage')
        .sort({ date: -1 })
        .lean(),
      SupplierTransaction.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
      WageAdvance.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    // Calculate Today's KPI values
    let todaySupplierExpenses = 0;
    let todaySupplierAdvances = 0;
    todaySupplierTx.forEach(tx => {
      if (tx.type === 'expense') todaySupplierExpenses += (tx.amount || 0);
      else if (tx.type === 'advance') todaySupplierAdvances += (tx.amount || 0);
    });

    let todayEmployeeAdvances = 0;
    todayWageAdv.forEach(adv => {
      todayEmployeeAdvances += (adv.amount || 0);
    });

    const todayTotalOutflow = todaySupplierExpenses + todaySupplierAdvances + todayEmployeeAdvances;

    // Grouping by Date (YYYY-MM-DD)
    const dayMap = new Map();

    const getOrCreateDay = (dateKey, rawDate) => {
      if (!dayMap.has(dateKey)) {
        const dObj = new Date(rawDate);
        dayMap.set(dateKey, {
          date: dateKey,
          rawDate: dObj,
          isToday: dateKey === todayKey,
          isYesterday: dateKey === yesterdayKey,
          supplierExpenses: 0,
          supplierAdvances: 0,
          employeeAdvances: 0,
          totalOutflow: 0,
          transactionCount: 0,
          items: [],
        });
      }
      return dayMap.get(dateKey);
    };

    // 1. Process Supplier Transactions
    supplierTransactions.forEach(tx => {
      const dKey = formatDateKey(tx.date);
      const dayData = getOrCreateDay(dKey, tx.date);

      if (tx.type === 'expense') {
        dayData.supplierExpenses += (tx.amount || 0);
      } else {
        dayData.supplierAdvances += (tx.amount || 0);
      }
      dayData.totalOutflow += (tx.amount || 0);
      dayData.transactionCount += 1;

      dayData.items.push({
        _id: tx._id,
        categoryType: tx.type === 'expense' ? 'supplier_expense' : 'supplier_advance',
        categoryLabel: tx.type === 'expense' ? 'Supplier Bill / Expense' : 'Supplier Advance',
        entityType: 'supplier',
        entityName: tx.supplier?.name || 'Unknown Supplier',
        subText: tx.supplier?.category || 'Vendor',
        phone: tx.supplier?.phone || '',
        amount: tx.amount,
        paymentMethod: tx.paymentMethod || 'Cash',
        reference: tx.billNumber ? `Bill #${tx.billNumber}` : '',
        description: tx.description || '',
        status: tx.status || 'pending',
        date: tx.date,
      });
    });

    // 2. Process Employee Wage Advances
    wageAdvances.forEach(adv => {
      const dKey = formatDateKey(adv.date);
      const dayData = getOrCreateDay(dKey, adv.date);

      dayData.employeeAdvances += (adv.amount || 0);
      dayData.totalOutflow += (adv.amount || 0);
      dayData.transactionCount += 1;

      dayData.items.push({
        _id: adv._id,
        categoryType: 'wage_advance',
        categoryLabel: 'Employee Wage Advance',
        entityType: 'employee',
        entityName: adv.employee?.name || 'Unknown Employee',
        subText: adv.employee?.role || 'Staff / Worker',
        phone: adv.employee?.phone || '',
        amount: adv.amount,
        paymentMethod: adv.paymentMethod || 'Cash',
        reference: adv.reason || 'Salary Advance',
        description: adv.status === 'settled' ? 'Settled / Deducted' : 'Pending Deduction',
        status: adv.status,
        date: adv.date,
      });
    });

    // Ensure Today exists in dayMap even if 0 expenses so user always sees Today's slot
    if (!dayMap.has(todayKey) && (!singleDate || singleDate === todayKey)) {
      getOrCreateDay(todayKey, now);
    }

    // Sort items inside each day chronologically (most recent first)
    // and calculate Range totals
    let rangeSupplierExpenses = 0;
    let rangeSupplierAdvances = 0;
    let rangeEmployeeAdvances = 0;
    let rangeTotalOutflow = 0;
    let rangeTransactionCount = 0;

    const dailyBreakdown = Array.from(dayMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(day => {
        day.items.sort((a, b) => new Date(b.date) - new Date(a.date));

        rangeSupplierExpenses += day.supplierExpenses;
        rangeSupplierAdvances += day.supplierAdvances;
        rangeEmployeeAdvances += day.employeeAdvances;
        rangeTotalOutflow += day.totalOutflow;
        rangeTransactionCount += day.transactionCount;

        // Apply type filter to items if requested
        if (type && type !== 'all') {
          day.filteredItems = day.items.filter(item => {
            if (type === 'supplier_expense') return item.categoryType === 'supplier_expense';
            if (type === 'supplier_advance') return item.categoryType === 'supplier_advance';
            if (type === 'wage_advance') return item.categoryType === 'wage_advance';
            return true;
          });
        } else {
          day.filteredItems = day.items;
        }

        return day;
      });

    res.status(200).json({
      success: true,
      data: {
        todaySummary: {
          todaySupplierExpenses,
          todaySupplierAdvances,
          todayEmployeeAdvances,
          todayTotalOutflow,
          todayTotalExpenses: todaySupplierExpenses, // Purchases
          todayTotalAdvances: todaySupplierAdvances + todayEmployeeAdvances, // Total cash given as advances
        },
        rangeSummary: {
          rangeSupplierExpenses,
          rangeSupplierAdvances,
          rangeEmployeeAdvances,
          rangeTotalOutflow,
          rangeTransactionCount,
          daysCount: dailyBreakdown.length,
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
        },
        dailyBreakdown,
      }
    });
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
