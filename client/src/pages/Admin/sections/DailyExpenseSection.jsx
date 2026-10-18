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

const DailyExpenseSection = ({ onNavigateTab }) => {
  const [dailyData, setDailyData] = useState({
    todaySummary: {
      todaySupplierExpenses: 0,
      todaySupplierAdvances: 0,
      todayEmployeeAdvances: 0,
      todayTotalOutflow: 0,
      todayTotalExpenses: 0,
      todayTotalAdvances: 0,
    },
    rangeSummary: {
      rangeSupplierExpenses: 0,
      rangeSupplierAdvances: 0,
      rangeEmployeeAdvances: 0,
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

  // Print Daily Expense Sheet
  const handlePrint = () => {
    window.print();
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
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-background-card border border-border-main hover:border-primary text-text-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            title="Print Daily Sheet"
          >
            <Printer size={15} />
            <span>Print Sheet</span>
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
              ₹{todaySummary.todaySupplierExpenses.toLocaleString()}
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">
              Purchases & material bills
            </p>
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
              ₹{todaySummary.todaySupplierAdvances.toLocaleString()}
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">
              Advance payments to vendors
            </p>
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
              ₹{todaySummary.todayEmployeeAdvances.toLocaleString()}
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">
              Advances given to workers
            </p>
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
                onClick={() => setDateFilter(chip.value)}
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
              onChange={(e) => setSingleDate(e.target.value)}
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
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-background-card text-text-primary border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-background-card text-text-primary border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <button
              onClick={() => fetchDailyExpenses(true)}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-muted/40 rounded-xl border border-border-main focus:border-primary transition-all outline-none text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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

      {/* DAILY-WISE (DAY-BY-DAY) LIST */}
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
        ) : (
          filteredDailyBreakdown.map((day) => {
            const isExpanded = expandedDays[day.date];
            const items = day.filteredItems || day.items || [];
            const dayDate = new Date(day.date);
            const formattedDayHeader = dayDate.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });

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

                  {/* Right: Day's Breakdown Pills & Total Outflow */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Supplier Bills pill */}
                    <div className="flex flex-col items-end px-3 py-1 bg-rose-500/5 rounded-xl border border-rose-500/10 text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Supplier Bills</span>
                      <span className="font-bold text-xs text-text-primary">₹{day.supplierExpenses.toLocaleString()}</span>
                    </div>

                    {/* Supplier Advances pill */}
                    <div className="flex flex-col items-end px-3 py-1 bg-blue-500/5 rounded-xl border border-blue-500/10 text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Supplier Advances</span>
                      <span className="font-bold text-xs text-text-primary">₹{day.supplierAdvances.toLocaleString()}</span>
                    </div>

                    {/* Employee Wage Advances pill */}
                    <div className="flex flex-col items-end px-3 py-1 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Wage Advances</span>
                      <span className="font-bold text-xs text-text-primary">₹{day.employeeAdvances.toLocaleString()}</span>
                    </div>

                    {/* Grand Day Outflow */}
                    <div className="flex flex-col items-end px-4 py-1.5 bg-background-muted rounded-xl border border-border-main text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-text-muted">Total Day Outflow</span>
                      <span className="font-black text-sm text-text-primary">₹{day.totalOutflow.toLocaleString()}</span>
                    </div>

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
                            {items.map((item) => (
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
                                <td className="px-4 py-3 text-right font-black text-xs text-text-primary">
                                  ₹{item.amount?.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DailyExpenseSection;
