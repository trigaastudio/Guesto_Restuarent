import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt,
  Calendar,
  CalendarDays,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Truck,
  Users,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Printer,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  FileText,
  CreditCard,
  Layers
} from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showToast } from '../../../utils/sweetAlert';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Pagination from '../../../components/Pagination/Pagination';

const DailyExpenseSection = ({ onNavigateTab }) => {
  const [dailyData, setDailyData] = useState({
    todaySummary: {
      todaySupplierExpenses: 0,
      todaySupplierExpensesSettled: 0,
      todaySupplierExpensesPending: 0,
      todaySupplierAdvances: 0,
      todaySupplierAdvancesSettled: 0,
      todayEmployeeAdvances: 0,
      todayEmployeeAdvancesSettled: 0,
      todayEmployeeAdvancesPending: 0,
      todayTotalOutflow: 0,
      todayTotalExpenses: 0,
      todayTotalAdvances: 0,
    },
    rangeSummary: {
      rangeSupplierExpenses: 0,
      rangeSupplierExpensesSettled: 0,
      rangeSupplierExpensesPending: 0,
      rangeSupplierAdvances: 0,
      rangeSupplierAdvancesSettled: 0,
      rangeEmployeeAdvances: 0,
      rangeEmployeeAdvancesSettled: 0,
      rangeEmployeeAdvancesPending: 0,
      rangeTotalOutflow: 0,
      rangeTransactionCount: 0,
      daysCount: 0,
      startDate: '',
      endDate: '',
    },
    dailyBreakdown: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all' | 'singleDate' | 'custom'
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'supplier_expense' | 'supplier_advance' | 'wage_advance'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDays, setExpandedDays] = useState({});
  const [settings, setSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'table'
  const [dayPages, setDayPages] = useState({});
  const itemsPerPage = 20;

  useEffect(() => {
    api.get('/api/settings').then(res => {
      if (res.data?.data) setSettings(res.data.data);
    }).catch(err => console.error('Error fetching settings for daily expense:', err));
  }, []);

  // Helper for date ranges
  const getDateParams = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      return { singleDate: todayStr };
    }
    if (dateFilter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { singleDate: y.toISOString().split('T')[0] };
    }
    if (dateFilter === 'singleDate') {
      return { singleDate: singleDate || todayStr };
    }
    if (dateFilter === 'thisWeek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
    }
    if (dateFilter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
    }
    if (dateFilter === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }
    if (dateFilter === 'all') {
      // Last 60 days
      const past = new Date(now);
      past.setDate(past.getDate() - 60);
      return {
        startDate: past.toISOString().split('T')[0],
        endDate: todayStr
      };
    }
    return {};
  }, [dateFilter, singleDate, customStartDate, customEndDate]);

  // Fetch daily expenses data
  const fetchDailyExpenses = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = getDateParams();
      if (categoryFilter !== 'all') {
        params.type = categoryFilter;
      }
      const res = await api.get('/api/expenses/daily', { params });
      if (res.data?.success) {
        setDailyData(res.data.data);

        // Auto-expand the first day by default
        if (res.data.data.dailyBreakdown?.length > 0) {
          const firstDayKey = res.data.data.dailyBreakdown[0].date;
          setExpandedDays(prev => ({ ...prev, [firstDayKey]: true }));
        }
      }
    } catch (err) {
      console.error('Error fetching daily expenses:', err);
      showToast('error', 'Failed to load daily expenses');
    } finally {
      setIsLoading(false);
    }
  }, [getDateParams, categoryFilter]);

  useEffect(() => {
    fetchDailyExpenses();
  }, [fetchDailyExpenses]);

  // Toggle expand / collapse day
  const toggleDayExpand = (dayKey) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  // Expand all / Collapse all
  const toggleAllDays = (expand = true) => {
    const updated = {};
    dailyData.dailyBreakdown.forEach(day => {
      updated[day.date] = expand;
    });
    setExpandedDays(updated);
  };

  // Print Daily Expense Report (Either entire period or single specific day)
  const handlePrintReport = (specificDay = null) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('error', 'Please allow popups to print report');
      return;
    }

    const restaurantName = settings?.restaurantDetails?.name || 'GUESTO RESTAURANT';
    const restaurantAddress = settings?.restaurantDetails?.address || 'Chammannur, Athirthi';
    const restaurantPhone = settings?.restaurantDetails?.contactNumber || '7034805085, 9947649007';
    const restaurantEmail = settings?.restaurantDetails?.email || 'restaurantguesto@gmail.com';

    // Determine days to include in print
    const daysToPrint = specificDay ? [specificDay] : filteredDailyBreakdown;

    let totalOutflow = 0;
    let totalSupplierExpenses = 0;
    let totalSupplierSettled = 0;
    let totalSupplierPending = 0;
    let totalSupplierAdvances = 0;
    let totalSupplierAdvSettled = 0;
    let totalEmployeeAdvances = 0;
    let totalEmployeeSettled = 0;
    let totalEmployeePending = 0;
    let totalTransactions = 0;

    daysToPrint.forEach(day => {
      totalOutflow += day.totalOutflow || 0;
      totalSupplierExpenses += day.supplierExpenses || 0;
      totalSupplierSettled += day.supplierExpensesSettled || 0;
      totalSupplierPending += day.supplierExpensesPending || 0;
      totalSupplierAdvances += day.supplierAdvances || 0;
      totalSupplierAdvSettled += day.supplierAdvancesSettled || 0;
      totalEmployeeAdvances += day.employeeAdvances || 0;
      totalEmployeeSettled += day.employeeAdvancesSettled || 0;
      totalEmployeePending += day.employeeAdvancesPending || 0;

      const items = day.filteredItems || day.items || [];
      totalTransactions += items.length;
    });

    let periodLabel = '';
    if (specificDay) {
      const d = new Date(specificDay.date);
      periodLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    } else if (dateFilter === 'today') {
      periodLabel = `Today (${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (dateFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      periodLabel = `Yesterday (${y.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (dateFilter === 'singleDate') {
      const d = new Date(singleDate);
      periodLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    } else if (dateFilter === 'custom') {
      periodLabel = `${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
    } else if (rangeSummary.startDate && rangeSummary.endDate) {
      periodLabel = `${rangeSummary.startDate} to ${rangeSummary.endDate}`;
    } else {
      periodLabel = 'All Outflows';
    }

    const categoryText = categoryFilter === 'supplier_expense'
      ? 'Supplier Bills Only'
      : categoryFilter === 'supplier_advance'
      ? 'Supplier Advances Only'
      : categoryFilter === 'wage_advance'
      ? 'Wage Advances Only'
      : 'All Categories';

    const generatedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let itemRowsHtml = '';
    let globalIndex = 0;

    daysToPrint.forEach(day => {
      const items = day.filteredItems || day.items || [];
      if (items.length === 0) return;

      const dayHeaderStr = new Date(day.date).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      itemRowsHtml += `
        <tr class="day-sub-header">
          <td colspan="7">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
              <span>📅 ${dayHeaderStr} ${day.isToday ? '(Today)' : ''}</span>
              <span>Day Outflow: ₹${(day.totalOutflow || 0).toLocaleString()} (${items.length} records)</span>
            </div>
          </td>
        </tr>
      `;

      items.forEach(item => {
        globalIndex++;
        const categoryLabel = item.categoryType === 'supplier_expense'
          ? 'Supplier Bill'
          : item.categoryType === 'supplier_advance'
          ? 'Supplier Advance'
          : 'Wage Advance';

        const statusBadge = item.status === 'settled'
          ? '<span class="status-settled">Settled</span>'
          : item.status === 'partially_paid' || (item.paidAmount > 0 && item.balanceAmount > 0)
          ? '<span class="status-partial">Partial</span>'
          : '<span class="status-pending">Pending</span>';

        const paidBalInfo = item.paidAmount !== undefined && item.paidAmount !== item.amount
          ? `<br/><span style="font-size: 8.5px; color: #555;">Paid: ₹${item.paidAmount?.toLocaleString()} | Bal: ₹${(item.balanceAmount !== undefined ? item.balanceAmount : Math.max(0, item.amount - item.paidAmount)).toLocaleString()}</span>`
          : '';

        itemRowsHtml += `
          <tr>
            <td style="text-align: center;">${globalIndex}</td>
            <td><strong>${categoryLabel}</strong></td>
            <td><strong>${item.entityName}</strong><br/><span style="font-size: 8.5px; color: #555;">${item.subText || ''}</span></td>
            <td>${item.reference || '-'}${item.description ? `<br/><span style="font-size: 8.5px; color: #666;">${item.description}</span>` : ''}</td>
            <td>${item.paymentMethod || 'Cash'}</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td style="text-align: right; font-weight: bold;">
              ₹${item.amount?.toLocaleString()}
              ${paidBalInfo}
            </td>
          </tr>
        `;
      });
    });

    if (globalIndex === 0) {
      itemRowsHtml = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #777;">No expenses recorded for this period</td></tr>`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Daily Expense Report - ${periodLabel}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111;
              background: #fff;
              margin: 0;
              padding: 10px;
              font-size: 11px;
              line-height: 1.35;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #222;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .restaurant-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
            }
            .restaurant-sub {
              font-size: 10px;
              color: #444;
              margin: 1px 0;
            }
            .report-title-badge {
              text-align: right;
            }
            .report-title {
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #b91c1c;
              margin: 0 0 4px 0;
            }
            .report-meta {
              font-size: 10px;
              color: #555;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 15px;
            }
            .summary-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 10px;
            }
            .summary-label {
              font-size: 8.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 3px;
            }
            .summary-val {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
            }
            .summary-sub {
              font-size: 8px;
              color: #64748b;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              background: #1e293b;
              color: #fff;
              text-align: left;
              padding: 6px 8px;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 10px;
              vertical-align: middle;
            }
            tr:nth-child(even):not(.day-sub-header) {
              background-color: #f8fafc;
            }
            .day-sub-header td {
              background: #e2e8f0 !important;
              color: #0f172a;
              font-weight: bold;
              border-top: 1.5px solid #94a3b8;
              border-bottom: 1.5px solid #94a3b8;
              padding: 6px 8px;
            }
            .status-settled {
              background: #dcfce7;
              color: #15803d;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            .status-pending {
              background: #fef3c7;
              color: #b45309;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            .status-partial {
              background: #dbeafe;
              color: #1d4ed8;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            .grand-total-row td {
              background: #f1f5f9;
              font-weight: 900;
              font-size: 12px;
              border-top: 2px solid #0f172a;
              border-bottom: 2px solid #0f172a;
              padding: 8px;
            }
            .footer-sign {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              padding-top: 15px;
            }
            .sign-box {
              width: 180px;
              text-align: center;
              border-top: 1px solid #0f172a;
              padding-top: 5px;
              font-size: 10px;
              font-weight: 700;
            }
            .watermark {
              font-size: 8.5px;
              color: #94a3b8;
              text-align: center;
              margin-top: 25px;
            }
            @media print {
              body { padding: 0; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); window.close(); }, 400);">
          <div class="header">
            <div>
              <div class="restaurant-title">${restaurantName}</div>
              <div class="restaurant-sub">${restaurantAddress}</div>
              <div class="restaurant-sub">Phone: ${restaurantPhone} | Email: ${restaurantEmail}</div>
            </div>
            <div class="report-title-badge">
              <div class="report-title">Daily Expense Report</div>
              <div class="report-meta"><strong>Period:</strong> ${periodLabel}</div>
              <div class="report-meta"><strong>Filter:</strong> ${categoryText}</div>
              <div class="report-meta"><strong>Generated:</strong> ${generatedAt}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-box" style="border-left: 3px solid #b91c1c;">
              <div class="summary-label">Total Outflow</div>
              <div class="summary-val">₹${totalOutflow.toLocaleString()}</div>
              <div class="summary-sub">${totalTransactions} Total Records</div>
            </div>
            <div class="summary-box" style="border-left: 3px solid #f43f5e;">
              <div class="summary-label">Supplier Bills</div>
              <div class="summary-val">₹${totalSupplierExpenses.toLocaleString()}</div>
              <div class="summary-sub">Settled: ₹${totalSupplierSettled.toLocaleString()} | Pend: ₹${totalSupplierPending.toLocaleString()}</div>
            </div>
            <div class="summary-box" style="border-left: 3px solid #3b82f6;">
              <div class="summary-label">Supplier Advances</div>
              <div class="summary-val">₹${totalSupplierAdvances.toLocaleString()}</div>
              <div class="summary-sub">Settled: ₹${totalSupplierAdvSettled.toLocaleString()}</div>
            </div>
            <div class="summary-box" style="border-left: 3px solid #10b981;">
              <div class="summary-label">Wage Advances</div>
              <div class="summary-val">₹${totalEmployeeAdvances.toLocaleString()}</div>
              <div class="summary-sub">Settled: ₹${totalEmployeeSettled.toLocaleString()} | Pend: ₹${totalEmployeePending.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 110px;">Category</th>
                <th>Paid To (Supplier / Staff)</th>
                <th>Bill # / Purpose</th>
                <th style="width: 70px;">Mode</th>
                <th style="width: 70px; text-align: center;">Status</th>
                <th style="width: 120px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
              <tr class="grand-total-row">
                <td colspan="6" style="text-align: right; text-transform: uppercase;">Grand Total Outflow:</td>
                <td style="text-align: right; color: #b91c1c;">₹${totalOutflow.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sign">
            <div class="sign-box">Prepared By (Admin)</div>
            <div class="sign-box">Manager / Verified By</div>
          </div>

          <div class="watermark">
            Guesto Restaurant Management System • Computer-Generated Expense Report
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const { todaySummary, rangeSummary, dailyBreakdown } = dailyData;

  // Filter breakdown items by search term in frontend
  const filteredDailyBreakdown = useMemo(() => {
    if (!searchTerm) return dailyBreakdown;
    const s = searchTerm.toLowerCase();

    return dailyBreakdown.map(day => {
      const matchingItems = (day.filteredItems || day.items || []).filter(item => {
        return (
          item.entityName.toLowerCase().includes(s) ||
          item.subText.toLowerCase().includes(s) ||
          (item.reference && item.reference.toLowerCase().includes(s)) ||
          (item.description && item.description.toLowerCase().includes(s)) ||
          (item.paymentMethod && item.paymentMethod.toLowerCase().includes(s))
        );
      });

      return {
        ...day,
        filteredItems: matchingItems,
        matchCount: matchingItems.length
      };
    }).filter(day => day.matchCount > 0 || day.date.includes(s));
  }, [dailyBreakdown, searchTerm]);

  // Flatten all transactions for the unified table view
  const allFilteredTransactions = useMemo(() => {
    const list = [];
    filteredDailyBreakdown.forEach(day => {
      const items = day.filteredItems || day.items || [];
      items.forEach(it => {
        list.push({ ...it, dayDate: day.date });
      });
    });
    return list;
  }, [filteredDailyBreakdown]);

  const totalPages = viewMode === 'days'
    ? Math.max(1, Math.ceil(filteredDailyBreakdown.length / itemsPerPage))
    : Math.max(1, Math.ceil(allFilteredTransactions.length / itemsPerPage));

  const paginatedDays = useMemo(() => {
    return filteredDailyBreakdown.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredDailyBreakdown, currentPage, itemsPerPage]);

  const paginatedTransactions = useMemo(() => {
    return allFilteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [allFilteredTransactions, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Receipt size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">Daily Expenses & Outflows</h2>
              <p className="text-text-secondary text-xs">
                Day-by-day and date-wise tracking of supplier purchases, vendor advances & employee wage advances
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePrintReport()}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary text-white hover:bg-primary-light rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/20"
            title="Print Daily Expense Report"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>

          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('Suppliers')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                <Truck size={15} />
                <span>Manage Suppliers</span>
              </button>

              <button
                onClick={() => onNavigateTab('Wage Advances')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                <HandCoins size={15} />
                <span>Manage Wage Advances</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TODAY'S DAILY EXPENSES KPI CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            Today's Outflows Overview ({new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
          </span>
          <span className="text-[10px] font-bold text-text-muted">Live Daily Totals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Total Outflow */}
          <div className="bg-gradient-to-br from-primary/10 via-background-card to-background-card p-5 rounded-[2rem] border border-primary/30 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Today Total Outflow</span>
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">
                <Receipt size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-text-primary tracking-tight">
              ₹{todaySummary.todayTotalOutflow.toLocaleString()}
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">
              Grand total paid out today
            </p>
          </div>

          {/* Today Supplier Purchases / Bills */}
          <div className="bg-background-card p-5 rounded-[2rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Today Supplier Bills</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              ₹{(todaySummary.todaySupplierExpenses || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
              <span className="text-emerald-500 font-bold">₹{(todaySummary.todaySupplierExpensesSettled || 0).toLocaleString()} Settled</span>
              <span className="text-text-muted">•</span>
              <span className="text-amber-500 font-bold">₹{(todaySummary.todaySupplierExpensesPending || 0).toLocaleString()} Pending</span>
            </div>
          </div>

          {/* Today Supplier Advances */}
          <div className="bg-background-card p-5 rounded-[2rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Today Supplier Advances</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              ₹{(todaySummary.todaySupplierAdvances || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
              <span className="text-emerald-500 font-bold">₹{(todaySummary.todaySupplierAdvancesSettled || 0).toLocaleString()} Settled</span>
              <span className="text-text-muted">•</span>
              <span>Paid to vendors</span>
            </div>
          </div>

          {/* Today Employee Wage Advances */}
          <div className="bg-background-card p-5 rounded-[2rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Today Wage Advances</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <HandCoins size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              ₹{(todaySummary.todayEmployeeAdvances || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
              <span className="text-emerald-500 font-bold">₹{(todaySummary.todayEmployeeAdvancesSettled || 0).toLocaleString()} Settled</span>
              <span className="text-text-muted">•</span>
              <span className="text-amber-500 font-bold">₹{(todaySummary.todayEmployeeAdvancesPending || 0).toLocaleString()} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden p-5 space-y-4">
        {/* Quick Date Chips Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted mr-1.5 flex items-center gap-1">
              <Calendar size={13} /> Date Filter:
            </span>
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'Pick Single Day', value: 'singleDate' },
              { label: 'This Week', value: 'thisWeek' },
              { label: 'This Month', value: 'thisMonth' },
              { label: 'Custom Range', value: 'custom' },
              { label: 'Last 60 Days', value: 'all' },
            ].map(chip => (
              <button
                key={chip.value}
                onClick={() => { setDateFilter(chip.value); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  dateFilter === chip.value
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-background-muted text-text-secondary hover:text-text-primary border border-border-light'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-bold text-text-muted">
            <button
              onClick={() => toggleAllDays(true)}
              className="hover:text-primary transition-colors underline"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={() => toggleAllDays(false)}
              className="hover:text-primary transition-colors underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Dynamic Date Inputs based on chip */}
        {dateFilter === 'singleDate' && (
          <div className="p-3 bg-background-muted/40 rounded-2xl border border-border-light flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
              <CalendarDays size={15} /> Select Specific Date:
            </span>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => { setSingleDate(e.target.value); setCurrentPage(1); }}
              className="px-3.5 py-1.5 bg-background-card text-text-primary border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <button
              onClick={() => fetchDailyExpenses(true)}
              className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm"
            >
              View Expenses for this Day
            </button>
          </div>
        )}

        {dateFilter === 'custom' && (
          <div className="p-3 bg-background-muted/40 rounded-2xl border border-border-light flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
              <Calendar size={15} /> Custom Date Range:
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-background-card text-text-primary border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-background-card text-text-primary border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <button
              onClick={() => { fetchDailyExpenses(true); setCurrentPage(1); }}
              className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* Search & Category Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-border-light">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by supplier, employee name, bill no, or reason..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-background-muted/40 rounded-xl border border-border-main focus:border-primary transition-all outline-none text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">All Outflows</option>
              <option value="supplier_expense">Supplier Bills Only</option>
              <option value="supplier_advance">Supplier Advances Only</option>
              <option value="wage_advance">Employee Wage Advances Only</option>
            </select>

            {(searchTerm || categoryFilter !== 'all' || dateFilter !== 'today') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setDateFilter('today');
                  setSingleDate(new Date().toISOString().split('T')[0]);
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                title="Reset filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Range Summary Bar (if viewing multiple days or custom range) */}
      {rangeSummary.daysCount > 1 && (
        <div className="p-4 bg-background-muted/30 border border-border-light rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center space-x-2 text-text-secondary">
            <span className="font-bold text-text-primary">Summary for selected period:</span>
            <span>({rangeSummary.daysCount} days, {rangeSummary.rangeTransactionCount} records)</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <span className="text-rose-500">Supplier Bills: ₹{rangeSummary.rangeSupplierExpenses.toLocaleString()}</span>
            <span className="text-text-muted">•</span>
            <span className="text-blue-500">Supplier Advances: ₹{rangeSummary.rangeSupplierAdvances.toLocaleString()}</span>
            <span className="text-text-muted">•</span>
            <span className="text-emerald-500">Wage Advances: ₹{rangeSummary.rangeEmployeeAdvances.toLocaleString()}</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-primary font-black">Total Outflow: ₹{rangeSummary.rangeTotalOutflow.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* View Switcher & Quick Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2">
          <div className="bg-background-card p-1 rounded-2xl border border-border-light flex items-center shadow-sm">
            <button
              onClick={() => { setViewMode('days'); setCurrentPage(1); }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'days'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <CalendarDays size={14} />
              <span>Day-by-Day ({filteredDailyBreakdown.length} Days)</span>
            </button>
            <button
              onClick={() => { setViewMode('table'); setCurrentPage(1); }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Layers size={14} />
              <span>All Transactions ({allFilteredTransactions.length})</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-bold text-text-muted">
          Limit 20 {viewMode === 'days' ? 'days' : 'records'} per page • Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* DAILY EXPENSES DISPLAY (DAY-BY-DAY OR TRANSACTIONS TABLE) */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-background-card rounded-[2rem] border border-border-light p-8">
            <TableSkeleton columns={6} rows={5} />
          </div>
        ) : filteredDailyBreakdown.length === 0 ? (
          <div className="bg-background-card rounded-[2rem] border border-border-light p-16 text-center text-text-muted">
            <Receipt size={40} className="mx-auto mb-3 opacity-40 text-text-muted" />
            <p className="font-bold text-base text-text-primary">No expenses recorded for this period</p>
            <p className="text-xs text-text-muted mt-1">
              Select a different date or record expenses from the Suppliers / Wage Advances sections
            </p>
          </div>
        ) : viewMode === 'days' ? (
          <>
            {paginatedDays.map((day) => {
              const isExpanded = expandedDays[day.date];
              const items = day.filteredItems || day.items || [];
              const dayDate = new Date(day.date);
              const formattedDayHeader = dayDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              const dayCurrentPage = dayPages[day.date] || 1;
              const dayTotalPages = Math.ceil(items.length / itemsPerPage);
              const displayedItems = items.length > itemsPerPage
                ? items.slice((dayCurrentPage - 1) * itemsPerPage, dayCurrentPage * itemsPerPage)
                : items;

              return (
                <div
                  key={day.date}
                  className={`bg-background-card rounded-[2rem] border transition-all duration-200 overflow-hidden shadow-sm ${
                    day.isToday
                      ? 'border-primary/40 ring-1 ring-primary/20'
                      : 'border-border-light hover:border-border-main'
                  }`}
                >
                  {/* Day Header Accordion */}
                  <div
                    onClick={() => toggleDayExpand(day.date)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-background-muted/20 transition-colors select-none"
                  >
                    {/* Left: Date & Status Badges */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                        day.isToday
                          ? 'bg-primary text-white shadow-md shadow-primary/25'
                          : 'bg-background-muted text-text-primary border border-border-light'
                      }`}>
                        {dayDate.getDate()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-text-primary text-base">
                            {formattedDayHeader}
                          </span>
                          {day.isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              Today
                            </span>
                          )}
                          {day.isYesterday && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Yesterday
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {items.length} {items.length === 1 ? 'transaction' : 'transactions'} recorded
                        </p>
                      </div>
                    </div>

                    {/* Right: Day's Breakdown Pills, Total Outflow & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Supplier Bills pill */}
                      <div className="flex flex-col items-end px-3 py-1 bg-rose-500/5 rounded-xl border border-rose-500/10 text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Supplier Bills</span>
                        <span className="font-bold text-xs text-text-primary">₹{(day.supplierExpenses || 0).toLocaleString()}</span>
                        {(day.supplierExpensesSettled > 0 || day.supplierExpensesPending > 0) && (
                          <span className="text-[8px] font-bold text-emerald-500">
                            ₹{(day.supplierExpensesSettled || 0).toLocaleString()} settled
                          </span>
                        )}
                      </div>

                      {/* Supplier Advances pill */}
                      <div className="flex flex-col items-end px-3 py-1 bg-blue-500/5 rounded-xl border border-blue-500/10 text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Supplier Advances</span>
                        <span className="font-bold text-xs text-text-primary">₹{(day.supplierAdvances || 0).toLocaleString()}</span>
                        {day.supplierAdvancesSettled > 0 && (
                          <span className="text-[8px] font-bold text-emerald-500">
                            ₹{(day.supplierAdvancesSettled || 0).toLocaleString()} settled
                          </span>
                        )}
                      </div>

                      {/* Employee Wage Advances pill */}
                      <div className="flex flex-col items-end px-3 py-1 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Wage Advances</span>
                        <span className="font-bold text-xs text-text-primary">₹{(day.employeeAdvances || 0).toLocaleString()}</span>
                        {(day.employeeAdvancesSettled > 0 || day.employeeAdvancesPending > 0) && (
                          <span className="text-[8px] font-bold text-emerald-500">
                            ₹{(day.employeeAdvancesSettled || 0).toLocaleString()} settled
                          </span>
                        )}
                      </div>

                      {/* Grand Day Outflow */}
                      <div className="flex flex-col items-end px-4 py-1.5 bg-background-muted rounded-xl border border-border-main text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-muted">Total Day Outflow</span>
                        <span className="font-black text-sm text-text-primary">₹{(day.totalOutflow || 0).toLocaleString()}</span>
                      </div>

                      {/* Print Day Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintReport(day);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-background-card hover:bg-primary/10 border border-border-light hover:border-primary/30 text-text-muted hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        title="Print this day's report"
                      >
                        <Printer size={13} />
                        <span className="hidden sm:inline">Print Day</span>
                      </button>

                      {/* Accordion toggle arrow */}
                      <div className="p-1 rounded-lg text-text-muted hover:text-text-primary">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Day Items Table (when expanded) */}
                  {isExpanded && (
                    <div className="border-t border-border-light bg-background-muted/10 p-2 sm:p-4 animate-in fade-in duration-200">
                      {items.length === 0 ? (
                        <div className="p-6 text-center text-text-muted text-xs italic">
                          No transactions recorded on this day
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[9px] font-black tracking-widest border-b border-border-light">
                              <tr>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Paid To (Supplier / Employee)</th>
                                <th className="px-4 py-3">Role / Supply Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Payment Mode</th>
                                <th className="px-4 py-3">Bill # / Purpose</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {displayedItems.map((item) => (
                                <tr key={item._id} className="hover:bg-background-card transition-colors">
                                  {/* Category Badge */}
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                      item.categoryType === 'supplier_expense'
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                        : item.categoryType === 'supplier_advance'
                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {item.categoryType === 'supplier_expense' && <ArrowUpRight size={10} />}
                                      {item.categoryType === 'supplier_advance' && <ArrowDownLeft size={10} />}
                                      {item.categoryType === 'wage_advance' && <HandCoins size={10} />}
                                      <span>
                                        {item.categoryType === 'supplier_expense'
                                          ? 'Supplier Bill'
                                          : item.categoryType === 'supplier_advance'
                                          ? 'Supplier Advance'
                                          : 'Wage Advance'}
                                      </span>
                                    </span>
                                  </td>

                                  {/* Entity Name */}
                                  <td className="px-4 py-3 font-bold text-text-primary">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-lg bg-background-muted flex items-center justify-center text-[10px] font-black text-text-primary">
                                        {item.entityName.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{item.entityName}</span>
                                    </div>
                                  </td>

                                  {/* Role / Category */}
                                  <td className="px-4 py-3 text-text-secondary text-[11px]">
                                    {item.subText}
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3">
                                    {item.status === 'settled' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle2 size={9} /> Settled
                                      </span>
                                    ) : item.status === 'partially_paid' || (item.paidAmount > 0 && item.balanceAmount > 0) ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        <Clock size={9} /> Partial
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                        <Clock size={9} /> Pending
                                      </span>
                                    )}
                                  </td>

                                  {/* Payment Mode */}
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-background-muted rounded-md text-[10px] font-bold text-text-secondary">
                                      {item.paymentMethod || 'Cash'}
                                    </span>
                                  </td>

                                  {/* Bill # / Purpose */}
                                  <td className="px-4 py-3 text-text-secondary text-[11px] max-w-xs truncate" title={item.description || item.reference}>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-text-primary">{item.reference || '-'}</span>
                                      {item.description && (
                                        <span className="text-[10px] text-text-muted">{item.description}</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Amount */}
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="font-black text-xs text-text-primary">
                                        ₹{item.amount?.toLocaleString()}
                                      </span>
                                      {item.paidAmount !== undefined && item.paidAmount !== item.amount && (
                                        <div className="text-[9px] font-bold flex items-center space-x-1 mt-0.5">
                                          <span className="text-emerald-600 dark:text-emerald-400">Paid: ₹{item.paidAmount?.toLocaleString()}</span>
                                          <span className="text-text-muted">•</span>
                                          <span className="text-amber-500">Bal: ₹{(item.balanceAmount !== undefined ? item.balanceAmount : Math.max(0, item.amount - item.paidAmount)).toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {items.length > itemsPerPage && (
                            <div className="mt-2 border-t border-border-light">
                              <Pagination
                                currentPage={dayCurrentPage}
                                totalPages={dayTotalPages}
                                onPageChange={(p) => setDayPages(prev => ({ ...prev, [day.date]: p }))}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination for Days */}
            {filteredDailyBreakdown.length > itemsPerPage && (
              <div className="bg-background-card rounded-2xl border border-border-light overflow-hidden shadow-sm mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          /* ALL TRANSACTIONS UNIFIED TABLE VIEW */
          <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-background-muted/50 text-text-secondary uppercase text-[9px] font-black tracking-widest border-b border-border-light">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Paid To (Supplier / Employee)</th>
                    <th className="px-4 py-3">Role / Supply Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3">Bill # / Purpose</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {paginatedTransactions.map((item) => {
                    const itemDate = new Date(item.dayDate || item.date);
                    const formattedDate = itemDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={item._id} className="hover:bg-background-muted/20 transition-colors">
                        {/* Date */}
                        <td className="px-4 py-3 text-text-primary font-bold text-[11px]">
                          {formattedDate}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            item.categoryType === 'supplier_expense'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : item.categoryType === 'supplier_advance'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {item.categoryType === 'supplier_expense' && <ArrowUpRight size={10} />}
                            {item.categoryType === 'supplier_advance' && <ArrowDownLeft size={10} />}
                            {item.categoryType === 'wage_advance' && <HandCoins size={10} />}
                            <span>
                              {item.categoryType === 'supplier_expense'
                                ? 'Supplier Bill'
                                : item.categoryType === 'supplier_advance'
                                ? 'Supplier Advance'
                                : 'Wage Advance'}
                            </span>
                          </span>
                        </td>

                        {/* Beneficiary */}
                        <td className="px-4 py-3 font-bold text-text-primary">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg bg-background-muted flex items-center justify-center text-[10px] font-black text-text-primary">
                              {item.entityName.charAt(0).toUpperCase()}
                            </div>
                            <span>{item.entityName}</span>
                          </div>
                        </td>

                        {/* Role / Subtext */}
                        <td className="px-4 py-3 text-text-secondary text-[11px]">
                          {item.subText}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {item.status === 'settled' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={9} /> Settled
                            </span>
                          ) : item.status === 'partially_paid' || (item.paidAmount > 0 && item.balanceAmount > 0) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <Clock size={9} /> Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <Clock size={9} /> Pending
                            </span>
                          )}
                        </td>

                        {/* Payment Mode */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-background-muted rounded-md text-[10px] font-bold text-text-secondary">
                            {item.paymentMethod || 'Cash'}
                          </span>
                        </td>

                        {/* Reference / Description */}
                        <td className="px-4 py-3 text-text-secondary text-[11px] max-w-xs truncate" title={item.description || item.reference}>
                          <div className="flex flex-col">
                            <span className="font-medium text-text-primary">{item.reference || '-'}</span>
                            {item.description && (
                              <span className="text-[10px] text-text-muted">{item.description}</span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-xs text-text-primary">
                              ₹{item.amount?.toLocaleString()}
                            </span>
                            {item.paidAmount !== undefined && item.paidAmount !== item.amount && (
                              <div className="text-[9px] font-bold flex items-center space-x-1 mt-0.5">
                                <span className="text-emerald-600 dark:text-emerald-400">Paid: ₹{item.paidAmount?.toLocaleString()}</span>
                                <span className="text-text-muted">•</span>
                                <span className="text-amber-500">Bal: ₹{(item.balanceAmount !== undefined ? item.balanceAmount : Math.max(0, item.amount - item.paidAmount)).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for Transactions Table */}
            {allFilteredTransactions.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyExpenseSection;
