import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Edit2,
  Trash2,
  RotateCcw,
  XCircle,
  Phone,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Briefcase,
  Receipt,
  Zap,
  Wallet,
  ArrowDownCircle,
} from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Pagination from '../../../components/Pagination/Pagination';
import Modal from '../../../components/Modal/Modal';

const ROLES = [
  'Head Chef / Cook',
  'Assistant Cook',
  'Kitchen Helper',
  'Dishwasher',
  'Waiter / Server',
  'Cleaner / Sweeper',
  'Delivery Boy',
  'Cashier / Counter',
  'Security Guard',
  'Utility / Other'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

// ─────────────────────────────────────────────────────────────────────────────
// WageAdvanceSection — redesigned with 3 clearly separated modals
// ─────────────────────────────────────────────────────────────────────────────
const WageAdvanceSection = ({ onNavigateTab }) => {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('wages'); // 'wages' | 'employees'

  // ── Data ───────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [wages, setWages] = useState([]);
  const [summary, setSummary] = useState({
    totalOutstanding: 0,
    totalPaid: 0,
    monthWages: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    // legacy-compat keys used in display
    totalAdvances: 0,
    pendingAdvances: 0,
    settledAdvances: 0,
    monthAdvances: 0,
    todayAdvances: 0,
    todayPending: 0,
    todaySettled: 0,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // ── MODAL 1: Record Wage ───────────────────────────────────────────────────
  const [isWageModalOpen, setIsWageModalOpen] = useState(false);
  const [isEditingWage, setIsEditingWage] = useState(false);
  const [wageFormData, setWageFormData] = useState({
    _id: null,
    employee: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // ── MODAL 2: Settle Employee Wages ─────────────────────────────────────────
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleForm, setSettleForm] = useState({
    employeeId: '',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  // ── MODAL 3: Employee CRUD ─────────────────────────────────────────────────
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState({
    _id: null,
    name: '',
    phone: '',
    role: 'Kitchen Helper',
    monthlyWage: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
  });

  // ── Date range helpers ─────────────────────────────────────────────────────
  const getDateRange = useCallback((filter) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (filter === 'today') return { start: todayStr, end: todayStr };
    if (filter === 'thisWeek') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      return { start: monday.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    if (filter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstDay.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    if (filter === 'custom') return { start: customStartDate, end: customEndDate };
    return { start: '', end: '' };
  }, [customStartDate, customEndDate]);

  // ── API: Fetch summary ─────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/api/wages/summary');
      if (res.data?.success) setSummary(res.data.data);
    } catch (err) {
      console.error('Error fetching wage summary:', err);
    }
  }, []);

  // ── API: Fetch employees ───────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/api/wages/employees');
      if (res.data?.success) setEmployees(res.data.data || []);
    } catch (err) {
      console.error('Error fetching wage employees:', err);
      showToast('error', 'Failed to load employee list');
    }
  }, []);

  // ── API: Fetch wages ───────────────────────────────────────────────────────
  const fetchWages = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const range = getDateRange(dateFilter);
      const params = { limit: 500, page: 1 };
      if (selectedEmployeeId && selectedEmployeeId !== 'all') params.employeeId = selectedEmployeeId;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (range.start) params.startDate = range.start;
      if (range.end) params.endDate = range.end;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/api/wages', { params });
      if (res.data?.success) setWages(res.data.data || []);
    } catch (err) {
      console.error('Error fetching wages:', err);
      showToast('error', 'Failed to load wage records');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, getDateRange, selectedEmployeeId, statusFilter, searchTerm]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSummary();
    fetchEmployees();
    fetchWages();
  }, [fetchSummary, fetchEmployees, fetchWages]);

  // ── Refresh all data ───────────────────────────────────────────────────────
  const refreshAll = () => {
    fetchWages(true);
    fetchEmployees();
    fetchSummary();
  };

  // ── Date chip handler ──────────────────────────────────────────────────────
  const handleDateChip = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL 1: Record Wage handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleOpenWageModal = (existingWage = null) => {
    if (existingWage) {
      setWageFormData({
        _id: existingWage._id,
        employee: existingWage.employee?._id || existingWage.employee || '',
        amount: existingWage.amount || '',
        date: existingWage.date ? new Date(existingWage.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reason: existingWage.reason || '',
      });
      setIsEditingWage(true);
    } else {
      setWageFormData({
        _id: null,
        employee: employees.length > 0 ? employees[0]._id : '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      setIsEditingWage(false);
    }
    setIsWageModalOpen(true);
  };

  const handleSaveWage = async (e) => {
    e.preventDefault();
    if (!wageFormData.employee) { showToast('warning', 'Please select an employee'); return; }
    if (!wageFormData.amount || Number(wageFormData.amount) <= 0) { showToast('warning', 'Please enter a valid wage amount'); return; }
    if (!wageFormData.date) { showToast('warning', 'Please select a date'); return; }

    try {
      if (isEditingWage && wageFormData._id) {
        await api.put(`/api/wages/${wageFormData._id}`, {
          employee: wageFormData.employee,
          amount: Number(wageFormData.amount),
          date: wageFormData.date,
          reason: wageFormData.reason,
        });
        showToast('success', 'Wage record updated');
      } else {
        await api.post('/api/wages', {
          employee: wageFormData.employee,
          amount: Number(wageFormData.amount),
          date: wageFormData.date,
          reason: wageFormData.reason,
          paidAmount: 0,
          status: 'pending',
        });
        showToast('success', 'Wage recorded successfully');
      }
      setIsWageModalOpen(false);
      refreshAll();
    } catch (err) {
      console.error('Error saving wage:', err);
      showAlert({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Failed to save wage record' });
    }
  };

  const handleDeleteWage = async (id) => {
    const result = await showDeleteConfirmation('Delete this wage record?', 'This cannot be undone.');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/wages/${id}`);
        showToast('success', 'Wage record deleted');
        refreshAll();
      } catch (err) {
        console.error('Error deleting wage:', err);
        showToast('error', 'Failed to delete wage record');
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL 2: Settle Wages handlers
  // ═══════════════════════════════════════════════════════════════════════════

  // Compute total outstanding for a given employee ID from the loaded wages
  const getEmployeeOutstanding = useCallback((empId) => {
    return wages
      .filter(w => {
        const wEmpId = w.employee?._id || w.employee;
        return wEmpId === empId && w.status !== 'settled';
      })
      .reduce((sum, w) => {
        const bal = w.balanceAmount !== undefined ? w.balanceAmount : Math.max(0, (w.amount || 0) - (w.paidAmount || 0));
        return sum + bal;
      }, 0);
  }, [wages]);

  // Also get outstanding from employees list (more reliable — backend computed)
  const getEmployeeOutstandingFromList = useCallback((empId) => {
    const emp = employees.find(e => e._id === empId);
    return emp?.pendingAdvances || emp?.outstandingBalance || getEmployeeOutstanding(empId);
  }, [employees, getEmployeeOutstanding]);

  const handleOpenSettleModal = (prefilledEmpId = '') => {
    const empId = prefilledEmpId || (employees.length > 0 ? employees[0]._id : '');
    const outstanding = empId ? getEmployeeOutstandingFromList(empId) : 0;
    setSettleForm({
      employeeId: empId,
      amount: outstanding > 0 ? String(outstanding) : '',
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsSettleModalOpen(true);
  };

  const handleSettleEmployeeChange = (empId) => {
    const outstanding = empId ? getEmployeeOutstandingFromList(empId) : 0;
    setSettleForm(prev => ({
      ...prev,
      employeeId: empId,
      amount: outstanding > 0 ? String(outstanding) : '',
    }));
  };

  const handleSubmitSettle = async (e) => {
    e.preventDefault();
    if (!settleForm.employeeId) { showToast('warning', 'Please select an employee'); return; }
    const amt = Number(settleForm.amount);
    if (!amt || amt <= 0) { showToast('warning', 'Please enter a valid payment amount'); return; }

    setIsSubmittingSettle(true);
    try {
      const res = await api.post(`/api/wages/employees/${settleForm.employeeId}/settle`, {
        amount: amt,
        paymentMethod: settleForm.paymentMethod,
        date: settleForm.date,
        notes: settleForm.notes,
      });
      if (res.data?.success) {
        showToast('success', res.data.message || 'Wage payment settled successfully');
        setIsSettleModalOpen(false);
        refreshAll();
      }
    } catch (err) {
      console.error('Error settling wages:', err);
      showAlert({ icon: 'error', title: 'Settlement Failed', text: err.response?.data?.message || 'Failed to settle wages' });
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL 3: Employee CRUD handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleOpenEmployeeModal = (emp = null) => {
    if (emp) {
      setEmployeeFormData({
        _id: emp._id,
        name: emp.name,
        phone: emp.phone || '',
        role: emp.role || 'Kitchen Helper',
        monthlyWage: emp.monthlyWage || '',
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
        status: emp.status || 'active',
        notes: emp.notes || '',
      });
      setIsEditingEmployee(true);
    } else {
      setEmployeeFormData({
        _id: null,
        name: '',
        phone: '',
        role: 'Kitchen Helper',
        monthlyWage: '',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
      });
      setIsEditingEmployee(false);
    }
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!employeeFormData.name?.trim()) { showToast('warning', 'Employee name is required'); return; }

    try {
      if (isEditingEmployee && employeeFormData._id) {
        await api.put(`/api/wages/employees/${employeeFormData._id}`, employeeFormData);
        showToast('success', 'Employee updated successfully');
      } else {
        await api.post('/api/wages/employees', employeeFormData);
        showToast('success', 'Employee created successfully');
      }
      setIsEmployeeModalOpen(false);
      fetchEmployees();
      fetchSummary();
    } catch (err) {
      console.error('Error saving employee:', err);
      showAlert({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Failed to save employee profile' });
    }
  };

  const handleDeleteEmployee = async (emp) => {
    const result = await showDeleteConfirmation(
      `Delete ${emp.name}?`,
      'This will also delete all wage records associated with this employee!'
    );
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/wages/employees/${emp._id}`);
        showToast('success', 'Employee deleted');
        fetchEmployees();
        fetchWages(true);
        fetchSummary();
      } catch (err) {
        console.error('Error deleting employee:', err);
        showToast('error', 'Failed to delete employee');
      }
    }
  };

  // ── Derived / filtered data ────────────────────────────────────────────────
  const filteredWages = useMemo(() => {
    return wages.filter(w => {
      const empName = w.employee?.name || '';
      const role = w.employee?.role || '';
      const reason = w.reason || '';
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || empName.toLowerCase().includes(s) || role.toLowerCase().includes(s) || reason.toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesEmployee = selectedEmployeeId === 'all' || (w.employee?._id === selectedEmployeeId);
      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [wages, searchTerm, statusFilter, selectedEmployeeId]);

  const totalPages = Math.ceil(filteredWages.length / itemsPerPage);
  const paginatedWages = filteredWages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return employees.filter(emp =>
      !q || emp.name.toLowerCase().includes(q) || (emp.phone?.toLowerCase().includes(q)) || (emp.role?.toLowerCase().includes(q))
    );
  }, [employees, searchTerm]);

  const selectedEmployeeObj = useMemo(() => employees.find(e => e._id === selectedEmployeeId), [employees, selectedEmployeeId]);

  // ── Settle modal derived values ────────────────────────────────────────────
  const settleOutstanding = settleForm.employeeId ? getEmployeeOutstandingFromList(settleForm.employeeId) : 0;
  const settleAmount = Number(settleForm.amount) || 0;
  const settleExcess = settleAmount > settleOutstanding ? settleAmount - settleOutstanding : 0;

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <HandCoins size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">Employee Wage & Payment</h2>
              <p className="text-text-secondary text-xs">
                Record wages, track outstanding balances and settle employee payments
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* RECORD WAGE — rose/red */}
          <button
            onClick={() => handleOpenWageModal()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Record Wage</span>
          </button>

          {/* SETTLE WAGES — emerald */}
          <button
            onClick={() => handleOpenSettleModal()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Wallet size={16} />
            <span>Settle Wages</span>
          </button>

          {/* NEW EMPLOYEE — outline */}
          <button
            onClick={() => handleOpenEmployeeModal()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-background-card border border-border-main text-text-primary hover:border-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <Users size={16} />
            <span>+ New Employee</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('Daily Expenses')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-background-card border border-border-main hover:border-primary text-text-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
              title="View Day-by-Day Expenses Sheet"
            >
              <Receipt size={16} />
              <span>Daily Expenses</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Wages */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Outstanding Wages</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">
            ₹{(summary.pendingAdvances || summary.totalOutstanding || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1">Total unpaid balance across all employees</p>
        </div>

        {/* This Month Wages */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">This Month Wages</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            ₹{(summary.monthAdvances || summary.monthWages || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            All-time total: <span className="font-bold text-text-primary">₹{(summary.totalAdvances || 0).toLocaleString()}</span>
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Paid</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500 tracking-tight">
            ₹{(summary.settledAdvances || summary.totalPaid || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1">Cleared & settled payments</p>
        </div>

        {/* Active Employees */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Employees</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            {summary.activeEmployees || 0}{' '}
            <span className="text-xs font-normal text-text-muted">/ {summary.totalEmployees || employees.length} registered</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1">Kitchen & floor workforce</p>
        </div>
      </div>

      {/* ── Main Card ─────────────────────────────────────────────────────────── */}
      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">

        {/* Tab Header */}
        <div className="border-b border-border-light bg-background-muted/20 px-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('wages')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'wages'
                  ? 'border-primary text-primary bg-background-card'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <HandCoins size={16} />
              <span>Wage Records ({wages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'employees'
                  ? 'border-primary text-primary bg-background-card'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users size={16} />
              <span>Workers Directory ({employees.length})</span>
            </button>
          </div>

          {/* Quick Date Chips */}
          {activeTab === 'wages' && (
            <div className="flex flex-wrap items-center gap-1.5 pb-3">
              {[
                { label: 'All', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'thisWeek' },
                { label: 'This Month', value: 'thisMonth' },
                { label: 'Custom', value: 'custom' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => handleDateChip(chip.value)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    dateFilter === chip.value
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-background-card text-text-secondary border border-border-light hover:text-text-primary'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Date Range */}
        {activeTab === 'wages' && dateFilter === 'custom' && (
          <div className="p-4 bg-background-muted/40 border-b border-border-light flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
              <Calendar size={14} /> Custom Range:
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
              onClick={() => fetchWages(true)}
              className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-4 border-b border-border-light bg-background-card flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'wages' ? 'Search by worker name, role, reason...' : 'Search by name, phone, role...'}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-background-muted/40 rounded-xl border border-border-main focus:border-primary transition-all outline-none text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'wages' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partial</option>
                  <option value="settled">Settled</option>
                </select>

                <select
                  value={selectedEmployeeId}
                  onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Workers</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </>
            )}

            {(searchTerm || statusFilter !== 'all' || selectedEmployeeId !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm(''); setStatusFilter('all'); setSelectedEmployeeId('all');
                  setDateFilter('all'); setCustomStartDate(''); setCustomEndDate(''); setCurrentPage(1);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Employee filter pill */}
        {selectedEmployeeId !== 'all' && selectedEmployeeObj && (
          <div className="px-6 py-2.5 bg-primary/5 border-b border-border-light flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-2">
              <Users size={14} />
              Filtering wages for: <strong className="underline">{selectedEmployeeObj.name}</strong> ({selectedEmployeeObj.role})
              <span className="text-[10px] text-text-secondary">
                (Outstanding: ₹{(selectedEmployeeObj.pendingAdvances || 0).toLocaleString()})
              </span>
            </span>
            <button
              onClick={() => setSelectedEmployeeId('all')}
              className="p-1 hover:bg-primary/10 rounded-full text-primary transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Tab: Wage Records ─────────────────────────────────────────────── */}
        {activeTab === 'wages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Employee</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Wage Amount</th>
                  <th className="px-4 py-4">Paid</th>
                  <th className="px-4 py-4">Balance</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr><td colSpan="8" className="px-6 py-10"><TableSkeleton columns={8} rows={6} /></td></tr>
                ) : paginatedWages.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <HandCoins size={36} className="text-text-muted/40" />
                        <p className="font-bold text-sm">No wage records found</p>
                        <p className="text-xs text-text-muted">Record wages given to workers or kitchen staff</p>
                        <button
                          onClick={() => handleOpenWageModal()}
                          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold mt-2 hover:bg-rose-700 transition-all"
                        >
                          + Record First Wage
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWages.map((w) => {
                    const paidAmt = w.paidAmount !== undefined ? w.paidAmount : (w.status === 'settled' ? w.amount : 0);
                    const balAmt = w.balanceAmount !== undefined ? w.balanceAmount : Math.max(0, (w.amount || 0) - paidAmt);

                    return (
                      <tr key={w._id} className="hover:bg-background-muted/30 transition-colors group">
                        {/* Date */}
                        <td className="px-4 py-4 font-bold text-text-primary">
                          {w.date ? new Date(w.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>

                        {/* Employee */}
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {w.employee?.name ? w.employee.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex flex-col">
                              <span
                                onClick={() => setSelectedEmployeeId(w.employee?._id || 'all')}
                                className="font-bold text-text-primary hover:text-primary cursor-pointer transition-colors"
                              >
                                {w.employee?.name || 'Unknown'}
                              </span>
                              {w.employee?.phone && (
                                <span className="text-[10px] text-text-muted font-mono">{w.employee.phone}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-background-muted text-text-secondary border border-border-light">
                            {w.employee?.role || 'Worker'}
                          </span>
                        </td>

                        {/* Wage Amount */}
                        <td className="px-4 py-4 font-black text-sm text-text-primary">
                          ₹{(w.amount || 0).toLocaleString()}
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-4 font-black text-sm text-emerald-500">
                          ₹{paidAmt.toLocaleString()}
                        </td>

                        {/* Balance */}
                        <td className="px-4 py-4">
                          {balAmt > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              ₹{balAmt.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                              ₹0 (Cleared)
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4">
                          {w.status === 'settled' || balAmt === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 size={10} /> Settled
                            </span>
                          ) : w.status === 'partially_paid' || paidAmt > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
                              <Clock size={10} /> Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <Clock size={10} /> Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {balAmt > 0 && (
                              <button
                                onClick={() => handleOpenSettleModal(w.employee?._id)}
                                className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-600/25 active:scale-95"
                                title={`Settle balance of ₹${balAmt.toLocaleString()}`}
                              >
                                <CreditCard size={11} />
                                <span>Pay</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenWageModal(w)}
                              className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                              title="Edit Wage Record"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteWage(w._id)}
                              className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                              title="Delete Wage Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {filteredWages.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* ── Tab: Workers Directory ─────────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-5 py-4">Worker Name</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4 text-right">Base Wage</th>
                  <th className="px-5 py-4 text-right">Total Wages</th>
                  <th className="px-5 py-4 text-right">Paid</th>
                  <th className="px-5 py-4 text-right">Outstanding</th>
                  <th className="px-5 py-4 text-center">Quick Actions</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users size={36} className="text-text-muted/40" />
                        <p className="font-bold text-sm">No workers added yet</p>
                        <p className="text-xs text-text-muted">Add worker profiles to track wages independently</p>
                        <button
                          onClick={() => handleOpenEmployeeModal()}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold mt-2"
                        >
                          + Add First Worker
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-background-muted/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{emp.name}</span>
                            <span className="text-[10px] text-text-muted">
                              Joined: {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-GB') : '-'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-background-muted text-text-secondary border border-border-light">
                          {emp.role || 'Worker'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">
                        {emp.phone ? (
                          <span className="flex items-center space-x-1 font-mono text-[11px]">
                            <Phone size={11} className="text-text-muted" />
                            <span>{emp.phone}</span>
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">No phone</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-text-secondary">
                        {emp.monthlyWage ? `₹${emp.monthlyWage.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-text-primary">
                        ₹{(emp.totalAdvances || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-500">
                        ₹{(emp.settledAdvances || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-black text-sm ${(emp.pendingAdvances || 0) > 0 ? 'text-amber-500' : 'text-text-muted'}`}>
                          ₹{(emp.pendingAdvances || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => { setSelectedEmployeeId(emp._id); setActiveTab('wages'); }}
                            className="px-2.5 py-1 bg-background-muted hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-text-secondary transition-all"
                          >
                            History
                          </button>
                          {(emp.pendingAdvances || 0) > 0 && (
                            <button
                              onClick={() => handleOpenSettleModal(emp._id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1"
                              title={`Settle ₹${(emp.pendingAdvances || 0).toLocaleString()} outstanding`}
                            >
                              <CreditCard size={10} />
                              <span>Settle ₹{(emp.pendingAdvances || 0).toLocaleString()}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenWageModal()}
                            className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            + Wage
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEmployeeModal(emp)}
                            className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: Record Employee Wage
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={isWageModalOpen} onClose={() => setIsWageModalOpen(false)} zIndex="z-[100]">
        <div className="bg-background-card w-full max-w-lg max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border-light flex items-center justify-between shrink-0 bg-background-card">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <HandCoins size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-text-primary">
                  {isEditingWage ? 'Edit Wage Record' : 'Record Employee Wage'}
                </h3>
                {!isEditingWage && (
                  <p className="text-[10px] text-text-secondary">Records wages as pending payment (paidAmount = 0)</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsWageModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSaveWage} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">

              {/* Employee Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Employee *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsWageModalOpen(false); handleOpenEmployeeModal(); }}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    + Add New Worker
                  </button>
                </div>
                <select
                  value={wageFormData.employee}
                  onChange={(e) => setWageFormData(prev => ({ ...prev, employee: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} — {e.role}</option>
                  ))}
                </select>

                {/* Outstanding balance of selected employee */}
                {wageFormData.employee && (() => {
                  const emp = employees.find(e => e._id === wageFormData.employee);
                  const outstanding = emp?.pendingAdvances || 0;
                  if (outstanding <= 0) return null;
                  return (
                    <div className="mt-1.5 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Current Outstanding</span>
                        <span className="text-sm font-black text-amber-600">₹{outstanding.toLocaleString()} pending</span>
                      </div>
                      <span className="text-[10px] text-amber-500 font-bold">Adding more wage</span>
                    </div>
                  );
                })()}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Wage Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={wageFormData.amount}
                      onChange={(e) => setWageFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-rose-500 text-text-primary text-sm font-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={wageFormData.date}
                    onChange={(e) => setWageFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-rose-500 text-text-primary text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Status info banner */}
              {!isEditingWage && (
                <div className="p-3 bg-background-muted/50 border border-border-light rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="text-text-muted shrink-0" />
                  <p className="text-[10px] text-text-secondary">
                    This records a <span className="font-bold text-amber-500">pending</span> wage. Use <span className="font-bold">Settle Wages</span> to record actual payment.
                  </p>
                </div>
              )}

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Remarks / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={wageFormData.reason}
                  onChange={(e) => setWageFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Daily wage for 10 Nov, Weekly salary, Overtime pay..."
                  className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-rose-500 text-text-primary text-xs font-medium outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-background-card border-t border-border-light flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsWageModalOpen(false)}
                className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-muted/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all active:scale-95"
              >
                {isEditingWage ? 'Update Wage' : 'Save Wage'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: Settle Employee Wage Payment
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} zIndex="z-[100]">
        <div className="bg-background-card w-full max-w-lg max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border-light flex items-center justify-between shrink-0 bg-background-card">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wallet size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-text-primary">Settle Employee Wages</h3>
                <p className="text-[10px] text-text-secondary">Pay outstanding wages to employee</p>
              </div>
            </div>
            <button onClick={() => setIsSettleModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmitSettle} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">

              {/* Employee Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Employee *
                </label>
                <select
                  value={settleForm.employeeId}
                  onChange={(e) => handleSettleEmployeeChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-bold outline-none"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} — {e.role}</option>
                  ))}
                </select>
              </div>

              {/* Outstanding Balance — big prominent display */}
              {settleForm.employeeId && (
                <div className="p-5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl text-center animate-in fade-in duration-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">
                    Total Outstanding Wages
                  </span>
                  <span className="text-4xl font-black text-amber-500 tracking-tight">
                    ₹{settleOutstanding.toLocaleString()}
                  </span>
                  {settleOutstanding === 0 && (
                    <p className="text-xs text-emerald-500 font-bold mt-1">✓ No outstanding wages</p>
                  )}
                </div>
              )}

              {/* Amount to Pay */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Amount to Pay Now (₹) *
                  </label>
                  {settleOutstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setSettleForm(prev => ({ ...prev, amount: String(settleOutstanding) }))}
                      className="text-[10px] font-black text-emerald-500 hover:underline uppercase"
                    >
                      Pay Full ₹{settleOutstanding.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={settleForm.amount}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter payment amount..."
                    className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-base font-black outline-none"
                  />
                </div>

                {/* Excess / advance info */}
                {settleExcess > 0 && (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/25 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                    <AlertCircle size={14} className="text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-400 font-bold">
                      Excess ₹{settleExcess.toLocaleString()} will be recorded as advance
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Date & Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={settleForm.date}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Payment Mode
                  </label>
                  <select
                    value={settleForm.paymentMethod}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-bold outline-none"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. November salary settlement..."
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-medium outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-background-card border-t border-border-light flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-muted/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSettle}
                className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                {isSubmittingSettle ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCard size={14} />
                    <span>Settle ₹{(Number(settleForm.amount) || 0).toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: Manage Employees (Add / Edit Employee Profile)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} zIndex="z-[105]">
        <div className="bg-background-card w-full max-w-lg max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border-light flex items-center justify-between shrink-0 bg-background-card">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users size={20} />
              </span>
              <h3 className="text-lg font-black text-text-primary">
                {isEditingEmployee ? 'Edit Worker Profile' : 'Add New Worker Profile'}
              </h3>
            </div>
            <button onClick={() => setIsEmployeeModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSaveEmployee} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Full Name *</label>
                <input
                  type="text"
                  required
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar, Mohammad Ali..."
                  className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-sm font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Role / Designation</label>
                  <select
                    value={employeeFormData.role}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Daily Base Wage */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Daily / Base Wage (₹) (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={employeeFormData.monthlyWage}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, monthlyWage: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Joining Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Joining Date</label>
                  <input
                    type="date"
                    value={employeeFormData.joiningDate}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, joiningDate: e.target.value })}
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes</label>
                <textarea
                  rows={2}
                  value={employeeFormData.notes}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, notes: e.target.value })}
                  placeholder="e.g. Works evening kitchen shift, full-time helper..."
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-background-card border-t border-border-light flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-muted/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isEditingEmployee ? 'Update Worker' : 'Save Worker'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default WageAdvanceSection;
