import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Edit2,
  Trash2,
  RotateCcw,
  XCircle,
  Phone,
  User,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  X,
  Check,
  Briefcase,
  Receipt,
  Zap
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

const REASON_PRESETS = [
  'Daily Wage Advance',
  'Medical Expense',
  'Festival / Holiday Advance',
  'Family Emergency',
  'Travel / Fare Expense',
  'Personal Loan / Advance',
  'Other'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

const WageAdvanceSection = ({ onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState('advances'); // 'advances' | 'employees'
  const [employees, setEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [summary, setSummary] = useState({
    totalAdvances: 0,
    pendingAdvances: 0,
    settledAdvances: 0,
    monthAdvances: 0,
    monthPending: 0,
    monthSettled: 0,
    todayAdvances: 0,
    todayPending: 0,
    todaySettled: 0,
    totalEmployees: 0,
    activeEmployees: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'settled'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination for advances
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Modals state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isEditingAdvance, setIsEditingAdvance] = useState(false);
  const [advanceFormData, setAdvanceFormData] = useState({
    _id: null,
    employee: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paidAmount: '',
    paymentMethod: 'Cash',
    reason: 'Daily Wage Advance',
    status: 'pending'
  });

  // Dedicated Payment modal state (Partial / Full payment)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payModalAdv, setPayModalAdv] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

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
    notes: ''
  });

  // Calculate Date Ranges
  const getDateRange = useCallback((filter) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (filter === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (filter === 'thisWeek') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      return {
        start: monday.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
    }
    if (filter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
    }
    if (filter === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }
    return { start: '', end: '' };
  }, [customStartDate, customEndDate]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/api/wage-advances/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching wage advance summary:', err);
    }
  }, []);

  // Fetch employees list
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/api/wage-advances/employees');
      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching wage employees:', err);
      showToast('error', 'Failed to load employee list');
    }
  }, []);

  // Fetch advances list
  const fetchAdvances = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const range = getDateRange(dateFilter);
      const params = {
        limit: 500,
        page: 1
      };
      if (selectedEmployeeId && selectedEmployeeId !== 'all') {
        params.employeeId = selectedEmployeeId;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (range.start) params.startDate = range.start;
      if (range.end) params.endDate = range.end;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/api/wage-advances', { params });
      if (res.data?.success) {
        setAdvances(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching wage advances:', err);
      showToast('error', 'Failed to load advance records');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, getDateRange, selectedEmployeeId, statusFilter, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchEmployees();
    fetchAdvances();
  }, [fetchSummary, fetchEmployees, fetchAdvances]);

  // Handle Quick Date Chips
  const handleDateChip = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  // Open advance modal
  const handleOpenAdvanceModal = (employeeId = null, existingAdv = null) => {
    if (existingAdv) {
      const existingPaid = existingAdv.paidAmount !== undefined
        ? existingAdv.paidAmount
        : (existingAdv.status === 'settled' ? existingAdv.amount : 0);
      setAdvanceFormData({
        _id: existingAdv._id,
        employee: existingAdv.employee?._id || existingAdv.employee || '',
        date: existingAdv.date ? new Date(existingAdv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: existingAdv.amount || '',
        paidAmount: existingPaid !== undefined && existingPaid !== null ? existingPaid : '',
        paymentMethod: existingAdv.paymentMethod || 'Cash',
        reason: existingAdv.reason || 'Daily Wage Advance',
        status: existingAdv.status || 'pending'
      });
      setIsEditingAdvance(true);
    } else {
      const targetEmpId = employeeId || (employees.length > 0 ? employees[0]._id : '');
      const targetEmp = employees.find(e => e._id === targetEmpId);
      const shouldPrefillPending = targetEmp?.pendingAdvances > 0;
      setAdvanceFormData({
        _id: null,
        employee: targetEmpId,
        date: new Date().toISOString().split('T')[0],
        amount: shouldPrefillPending ? targetEmp.pendingAdvances : '',
        paidAmount: shouldPrefillPending ? targetEmp.pendingAdvances : '',
        paymentMethod: 'Cash',
        reason: shouldPrefillPending ? `Settlement of pending advance for ${targetEmp.name}` : 'Daily Wage Advance',
        status: shouldPrefillPending ? 'settled' : 'pending'
      });
      setIsEditingAdvance(false);
    }
    setIsAdvanceModalOpen(true);
  };

  // Open Quick Pay Modal (Partial / Full payment)
  const handleOpenPayModal = (adv) => {
    const paid = adv.paidAmount !== undefined ? adv.paidAmount : (adv.status === 'settled' ? adv.amount : 0);
    const balance = adv.balanceAmount !== undefined ? adv.balanceAmount : Math.max(0, adv.amount - paid);
    setPayModalAdv(adv);
    setPayAmount(balance > 0 ? balance : '');
    setPayMethod(adv.paymentMethod || 'Cash');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  // Confirm Payment to Worker
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payModalAdv) return;
    const num = Number(payAmount);
    if (!num || num <= 0) {
      showToast('warning', 'Please enter a valid payment amount');
      return;
    }

    setIsSubmittingPay(true);
    try {
      const res = await api.post(`/api/wage-advances/${payModalAdv._id}/pay`, {
        paymentAmount: num,
        paymentMethod: payMethod,
        notes: payNotes,
        date: payDate,
      });
      if (res.data?.success) {
        showToast('success', res.data.message || 'Wage payment recorded successfully');
        setIsPayModalOpen(false);
        fetchAdvances(true);
        fetchEmployees();
        fetchSummary();
      }
    } catch (err) {
      console.error('Error submitting wage payment:', err);
      showAlert({
        icon: 'error',
        title: 'Payment Failed',
        text: err.response?.data?.message || 'Failed to record wage payment'
      });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Save Advance
  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (!advanceFormData.employee) {
      showToast('warning', 'Please select an employee');
      return;
    }
    if (!advanceFormData.amount || Number(advanceFormData.amount) <= 0) {
      showToast('warning', 'Please enter a valid advance amount');
      return;
    }

    try {
      if (isEditingAdvance && advanceFormData._id) {
        await api.put(`/api/wage-advances/${advanceFormData._id}`, advanceFormData);
        showToast('success', 'Advance record updated');
      } else {
        await api.post('/api/wage-advances', advanceFormData);
        showToast('success', 'Wage advance recorded successfully');
      }
      setIsAdvanceModalOpen(false);
      fetchAdvances(true);
      fetchEmployees();
      fetchSummary();
    } catch (err) {
      console.error('Error saving advance:', err);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to save advance'
      });
    }
  };

  // Toggle Settlement Status (1-click settle)
  const handleToggleSettle = async (adv) => {
    try {
      const res = await api.patch(`/api/wage-advances/${adv._id}/toggle-settle`, {});
      if (res.data?.success) {
        showToast('success', res.data.message);
        fetchAdvances(true);
        fetchEmployees();
        fetchSummary();
      }
    } catch (err) {
      console.error('Error toggling settlement:', err);
      showToast('error', 'Failed to update settlement status');
    }
  };

  // Delete Advance
  const handleDeleteAdvance = async (id) => {
    const result = await showDeleteConfirmation('Delete this advance record?', 'This cannot be undone.');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/wage-advances/${id}`);
        showToast('success', 'Advance record deleted');
        fetchAdvances(true);
        fetchEmployees();
        fetchSummary();
      } catch (err) {
        console.error('Error deleting advance:', err);
        showToast('error', 'Failed to delete advance');
      }
    }
  };

  // Open Employee Modal
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
        notes: emp.notes || ''
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
        notes: ''
      });
      setIsEditingEmployee(false);
    }
    setIsEmployeeModalOpen(true);
  };

  // Save Employee
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.name.trim()) {
      showToast('warning', 'Employee name is required');
      return;
    }

    try {
      if (isEditingEmployee && employeeFormData._id) {
        await api.put(`/api/wage-advances/employees/${employeeFormData._id}`, employeeFormData);
        showToast('success', 'Employee updated successfully');
      } else {
        const res = await api.post('/api/wage-advances/employees', employeeFormData);
        showToast('success', 'Employee created successfully');
        if (res.data?.data?._id) {
          setAdvanceFormData(prev => ({ ...prev, employee: res.data.data._id }));
        }
      }
      setIsEmployeeModalOpen(false);
      fetchEmployees();
      fetchSummary();
    } catch (err) {
      console.error('Error saving employee:', err);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to save employee profile'
      });
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp) => {
    const result = await showDeleteConfirmation(
      `Delete ${emp.name}?`,
      'This will also delete all advance records associated with this employee!'
    );
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/wage-advances/employees/${emp._id}`);
        showToast('success', 'Employee deleted');
        fetchEmployees();
        fetchAdvances(true);
        fetchSummary();
      } catch (err) {
        console.error('Error deleting employee:', err);
        showToast('error', 'Failed to delete employee');
      }
    }
  };

  // Filtered advances
  const filteredAdvances = useMemo(() => {
    return advances.filter(adv => {
      const empName = adv.employee?.name || '';
      const role = adv.employee?.role || '';
      const reason = adv.reason || '';
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s ||
        empName.toLowerCase().includes(s) ||
        role.toLowerCase().includes(s) ||
        reason.toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || adv.status === statusFilter;
      const matchesEmployee = selectedEmployeeId === 'all' || (adv.employee?._id === selectedEmployeeId);
      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [advances, searchTerm, statusFilter, selectedEmployeeId]);

  // Paginated advances
  const totalPages = Math.ceil(filteredAdvances.length / itemsPerPage);
  const paginatedAdvances = filteredAdvances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchTerm.toLowerCase();
      return !q ||
        emp.name.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.toLowerCase().includes(q)) ||
        (emp.role && emp.role.toLowerCase().includes(q));
    });
  }, [employees, searchTerm]);

  // Selected employee helper
  const selectedEmployeeObj = useMemo(() => {
    return employees.find(e => e._id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <HandCoins size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">Employee Wage Advances</h2>
              <p className="text-text-secondary text-xs">
                Record employee salary advances, track pending deductions & manage worker advance balances
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAdvanceModal()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
          >
            <Plus size={16} />
            <span>Record Wage Advance</span>
          </button>

          <button
            onClick={() => handleOpenEmployeeModal()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-background-card border border-border-main text-text-primary hover:border-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <Users size={16} />
            <span>New Employee Profile</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Advances & Settled */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Today Wage Outflow</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <HandCoins size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            ₹{(summary.todayAdvances || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
            <span className="text-emerald-500 font-bold">₹{(summary.todaySettled || 0).toLocaleString()} Settled</span>
            <span className="text-text-muted">•</span>
            <span className="text-amber-500 font-bold">₹{(summary.todayPending || 0).toLocaleString()} Pending</span>
          </div>
        </div>

        {/* Total Advances This Month / Period */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">This Month Advances</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            ₹{summary.monthAdvances.toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1 font-medium">
            <span>All-time total:</span>
            <span className="font-bold text-text-primary">₹{summary.totalAdvances.toLocaleString()}</span>
          </p>
        </div>

        {/* Pending Deduction Balance */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pending Deduction</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">
            ₹{summary.pendingAdvances.toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            To be deducted from wages
          </p>
        </div>

        {/* Settled / Deducted Advances */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Settled / Deducted</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{summary.settledAdvances.toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            Cleared from wages
          </p>
        </div>

        {/* Active Employees */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Workers</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            {summary.activeEmployees} <span className="text-xs font-normal text-text-muted">/ {summary.totalEmployees} registered</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            Kitchen & floor workforce
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-border-light bg-background-muted/20 px-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('advances')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'advances'
                  ? 'border-primary text-primary bg-background-card'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <HandCoins size={16} />
              <span>Advance Records ({advances.length})</span>
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

          {/* Quick Date Chips (shown in Advances tab) */}
          {activeTab === 'advances' && (
            <div className="flex flex-wrap items-center gap-1.5 pb-3">
              {[
                { label: 'All', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'thisWeek' },
                { label: 'This Month', value: 'thisMonth' },
                { label: 'Custom', value: 'custom' }
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

        {/* Custom Date Range Picker */}
        {activeTab === 'advances' && dateFilter === 'custom' && (
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
              onClick={() => fetchAdvances(true)}
              className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-border-light bg-background-card flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder={
                activeTab === 'advances'
                  ? 'Search by worker name, role, reason...'
                  : 'Search by worker name, phone, role...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-background-muted/40 rounded-xl border border-border-main focus:border-primary transition-all outline-none text-xs font-medium"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'advances' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="settled">Settled / Deducted</option>
                </select>

                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Workers</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </>
            )}

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || selectedEmployeeId !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSelectedEmployeeId('all');
                  setDateFilter('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Indicator if filtering by worker */}
        {selectedEmployeeId !== 'all' && selectedEmployeeObj && (
          <div className="px-6 py-2.5 bg-primary/5 border-b border-border-light flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-2">
              <Users size={14} />
              Filtering Advances for: <strong className="underline">{selectedEmployeeObj.name}</strong> ({selectedEmployeeObj.role})
              <span className="text-[10px] text-text-secondary">
                (Pending Balance: ₹{selectedEmployeeObj.pendingAdvances?.toLocaleString() || 0})
              </span>
            </span>
            <button
              onClick={() => setSelectedEmployeeId('all')}
              className="p-1 hover:bg-primary/10 rounded-full text-primary transition-all"
              title="Clear Worker Filter"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab 1: Advance Records */}
        {activeTab === 'advances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Worker / Employee</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Reason / Notes</th>
                  <th className="px-4 py-4">Mode</th>
                  <th className="px-4 py-4 text-right">Total Amount</th>
                  <th className="px-4 py-4 text-right">Paid Amount</th>
                  <th className="px-4 py-4 text-right">Balance Due</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-10">
                      <TableSkeleton columns={10} rows={6} />
                    </td>
                  </tr>
                ) : paginatedAdvances.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <HandCoins size={36} className="text-text-muted/40" />
                        <p className="font-bold text-sm">No advance records found</p>
                        <p className="text-xs text-text-muted">Record wage advances taken by workers or kitchen staff</p>
                        <button
                          onClick={() => handleOpenAdvanceModal()}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold mt-2"
                        >
                          + Record First Wage Advance
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdvances.map((adv) => {
                    const paidAmt = adv.paidAmount !== undefined
                      ? adv.paidAmount
                      : (adv.status === 'settled' ? adv.amount : 0);
                    const balAmt = adv.balanceAmount !== undefined
                      ? adv.balanceAmount
                      : Math.max(0, adv.amount - paidAmt);

                    return (
                      <tr key={adv._id} className="hover:bg-background-muted/30 transition-colors group">
                        {/* Date */}
                        <td className="px-4 py-4 font-bold text-text-primary">
                          {adv.date ? new Date(adv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>

                        {/* Employee Name */}
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {adv.employee?.name ? adv.employee.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex flex-col">
                              <span
                                onClick={() => setSelectedEmployeeId(adv.employee?._id || 'all')}
                                className="font-bold text-text-primary hover:text-primary cursor-pointer transition-colors"
                              >
                                {adv.employee?.name || 'Unknown Employee'}
                              </span>
                              {adv.employee?.phone && (
                                <span className="text-[10px] text-text-muted font-mono">{adv.employee.phone}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-background-muted text-text-secondary border border-border-light">
                            {adv.employee?.role || 'Worker'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {balAmt === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSettle(adv)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                              title="Fully Settled! Click to mark as Pending"
                            >
                              <CheckCircle2 size={10} />
                              <span>Settled</span>
                            </button>
                          ) : paidAmt > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(adv)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all"
                              title="Partially Paid. Click to record payment"
                            >
                              <Clock size={10} />
                              <span>Partial</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(adv)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                              title={`Pending Payment. Click to settle balance of ₹${balAmt.toLocaleString()}`}
                            >
                              <Clock size={10} />
                              <span>Pending</span>
                            </button>
                          )}
                        </td>

                        {/* Reason / Notes */}
                        <td className="px-4 py-4 text-text-secondary max-w-xs truncate" title={adv.reason}>
                          {adv.reason || '-'}
                        </td>

                        {/* Payment Mode */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-background-muted rounded-lg text-[10px] font-bold text-text-secondary">
                            {adv.paymentMethod || 'Cash'}
                          </span>
                        </td>

                        {/* Total Advance Amount */}
                        <td className="px-4 py-4 text-right font-black text-sm text-text-primary">
                          ₹{adv.amount?.toLocaleString()}
                        </td>

                        {/* Paid Amount */}
                        <td className="px-4 py-4 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{paidAmt.toLocaleString()}
                        </td>

                        {/* Balance Amount Due */}
                        <td className="px-4 py-4 text-right">
                          {balAmt > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
                              ₹{balAmt.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                              ₹0 (Cleared)
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                            {balAmt > 0 && (
                              <button
                                onClick={() => handleOpenPayModal(adv)}
                                className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-600/25 active:scale-95"
                                title={`Settle pending balance of ₹${balAmt.toLocaleString()}`}
                              >
                                <CreditCard size={11} />
                                <span>Settle ₹{balAmt.toLocaleString()}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenAdvanceModal(adv.employee?._id, adv)}
                              className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                              title="Edit Advance"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAdvance(adv._id)}
                              className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                              title="Delete Advance"
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

            {/* Pagination */}
            {filteredAdvances.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Tab 2: Workers Directory View */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-5 py-4">Worker Name</th>
                  <th className="px-5 py-4">Role / Designation</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4 text-right">Daily / Base Wage</th>
                  <th className="px-5 py-4 text-right">Total Advance</th>
                  <th className="px-5 py-4 text-right">Paid / Settled</th>
                  <th className="px-5 py-4 text-right">Balance Due</th>
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
                        <p className="text-xs text-text-muted">Add worker profiles to track wage advances independently of login accounts</p>
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
                      {/* Name */}
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

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-background-muted text-text-secondary border border-border-light">
                          {emp.role || 'Worker'}
                        </span>
                      </td>

                      {/* Phone */}
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

                      {/* Monthly Wage */}
                      <td className="px-5 py-4 text-right font-medium text-text-secondary">
                        {emp.monthlyWage ? `₹${emp.monthlyWage.toLocaleString()}` : '-'}
                      </td>

                      {/* Total Advance */}
                      <td className="px-5 py-4 text-right font-bold text-text-primary">
                        ₹{(emp.totalAdvances || 0).toLocaleString()}
                      </td>

                      {/* Settled */}
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(emp.settledAdvances || 0).toLocaleString()}
                      </td>

                      {/* Pending Deduction */}
                      <td className="px-5 py-4 text-right">
                        <span className={`font-black text-sm ${
                          (emp.pendingAdvances || 0) > 0 ? 'text-amber-500' : 'text-text-muted'
                        }`}>
                          ₹{(emp.pendingAdvances || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedEmployeeId(emp._id);
                              setActiveTab('advances');
                            }}
                            className="px-2.5 py-1 bg-background-muted hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-text-secondary transition-all"
                            title="Filter advances for this worker"
                          >
                            History
                          </button>
                          {emp.pendingAdvances > 0 && (
                            <button
                              onClick={() => {
                                const empAdv = advances.find(a => (a.employee?._id === emp._id || a.employee === emp._id) && (a.balanceAmount > 0 || (a.status !== 'settled' && a.amount > 0)));
                                if (empAdv) {
                                  handleOpenPayModal(empAdv);
                                } else {
                                  handleOpenAdvanceModal(emp._id);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1"
                              title={`Settle pending advance of ₹${(emp.pendingAdvances || 0).toLocaleString()}`}
                            >
                              <CreditCard size={10} />
                              <span>Settle ₹{(emp.pendingAdvances || 0).toLocaleString()}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAdvanceModal(emp._id)}
                            className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            title="Give advance to this worker"
                          >
                            + Give Advance
                          </button>
                        </div>
                      </td>

                      {/* Edit / Delete */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEmployeeModal(emp)}
                            className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                            title="Edit Worker Profile"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                            title="Delete Worker Profile"
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

      {/* MODAL 1: Record Wage Advance */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        zIndex="z-[100]"
      >
        <div className="bg-background-card w-full max-w-lg max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-border-light flex items-center justify-between shrink-0 bg-background-card">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <HandCoins size={20} />
                </span>
                <h3 className="text-lg font-black text-text-primary">
                  {isEditingAdvance ? 'Edit Wage Advance' : 'Record Employee Wage Advance'}
                </h3>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                {/* Employee Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Worker / Employee *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenEmployeeModal()}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      + Add New Worker
                    </button>
                  </div>
                  <select
                    value={advanceFormData.employee}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const foundEmp = employees.find(em => em._id === empId);
                      setAdvanceFormData(prev => ({
                        ...prev,
                        employee: empId,
                        amount: !isEditingAdvance && foundEmp?.pendingAdvances > 0 && !prev.amount ? foundEmp.pendingAdvances : prev.amount,
                        paidAmount: !isEditingAdvance && foundEmp?.pendingAdvances > 0 && !prev.paidAmount ? foundEmp.pendingAdvances : prev.paidAmount,
                        status: !isEditingAdvance && foundEmp?.pendingAdvances > 0 && !prev.amount ? 'settled' : prev.status
                      }));
                    }}
                    required
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                  >
                    <option value="">Select a worker...</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>
                        {e.name} — {e.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show Pending Advance Alert & 1-Click Settle Button (Only when creating a new record, not editing) */}
                {!isEditingAdvance && (() => {
                  const curSelectedEmp = employees.find(e => e._id === advanceFormData.employee);
                  if (curSelectedEmp && curSelectedEmp.pendingAdvances > 0) {
                    return (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                            Worker Outstanding Advances
                          </span>
                          <span className="text-sm font-black text-amber-600">
                            ₹{curSelectedEmp.pendingAdvances.toLocaleString()} Pending
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdvanceFormData(prev => ({
                              ...prev,
                              amount: curSelectedEmp.pendingAdvances,
                              paidAmount: curSelectedEmp.pendingAdvances,
                              status: 'settled',
                              reason: prev.reason || `Settlement of pending advance for ${curSelectedEmp.name}`
                            }));
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1 active:scale-95"
                        >
                          <Zap size={12} />
                          <span>Settle Outstanding (₹{curSelectedEmp.pendingAdvances.toLocaleString()})</span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* If Editing and remaining balance exists */}
                {isEditingAdvance && (() => {
                  const tAmt = Number(advanceFormData.amount) || 0;
                  const pAmt = Number(advanceFormData.paidAmount) || 0;
                  const remBal = Math.max(0, tAmt - pAmt);
                  if (remBal <= 0) return null;
                  return (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                          Remaining Pending Balance
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₹{remBal.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdvanceFormData(prev => ({
                            ...prev,
                            paidAmount: prev.amount,
                            status: 'settled'
                          }));
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1 active:scale-95"
                      >
                        <CheckCircle2 size={13} />
                        <span>Settle Full (₹{remBal.toLocaleString()})</span>
                      </button>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Total Advance / Wage Amount (₹) *
                      </label>
                      {!isEditingAdvance && (() => {
                        const curSelectedEmp = employees.find(e => e._id === advanceFormData.employee);
                        if (curSelectedEmp && curSelectedEmp.pendingAdvances > 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const bal = curSelectedEmp.pendingAdvances;
                                setAdvanceFormData(prev => ({
                                  ...prev,
                                  amount: bal,
                                  paidAmount: bal,
                                  status: 'settled'
                                }));
                              }}
                              className="text-[9px] font-black text-amber-500 hover:underline uppercase"
                            >
                              Fill Outstanding: ₹{curSelectedEmp.pendingAdvances.toLocaleString()}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={advanceFormData.amount}
                        onChange={(e) => {
                          const newAmt = e.target.value;
                          setAdvanceFormData(prev => {
                            const curPaid = Number(prev.paidAmount) || 0;
                            const totalVal = Number(newAmt) || 0;
                            let newStat = prev.status;
                            if (curPaid >= totalVal && totalVal > 0) newStat = 'settled';
                            else if (curPaid > 0) newStat = 'partially_paid';
                            else newStat = 'pending';
                            return { ...prev, amount: newAmt, status: newStat };
                          });
                        }}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-sm font-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Date Given *
                    </label>
                    <input
                      type="date"
                      required
                      value={advanceFormData.date}
                      onChange={(e) => setAdvanceFormData({ ...advanceFormData, date: e.target.value })}
                      className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Paid Amount & Live Balance Section */}
                <div className="p-4 bg-background-muted/40 rounded-2xl border border-border-light space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Amount Paid Now (₹)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAdvanceFormData(prev => ({
                            ...prev,
                            paidAmount: 0,
                            status: 'pending'
                          }));
                        }}
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-background-card border border-border-main text-text-secondary hover:text-text-primary transition-all"
                      >
                        Unpaid (₹0)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const full = Number(advanceFormData.amount) || 0;
                          setAdvanceFormData(prev => ({
                            ...prev,
                            paidAmount: full,
                            status: full > 0 ? 'settled' : 'pending'
                          }));
                        }}
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold"
                      >
                        Paid Full
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={advanceFormData.amount || undefined}
                      step="any"
                      value={advanceFormData.paidAmount}
                      onChange={(e) => {
                        const paidVal = e.target.value;
                        setAdvanceFormData(prev => {
                          const pNum = Number(paidVal) || 0;
                          const tNum = Number(prev.amount) || 0;
                          let s = 'pending';
                          if (pNum >= tNum && tNum > 0) s = 'settled';
                          else if (pNum > 0) s = 'partially_paid';
                          return { ...prev, paidAmount: paidVal, status: s };
                        });
                      }}
                      placeholder="0.00 (leave empty if unpaid)"
                      className="w-full pl-8 pr-4 py-2.5 bg-background-card rounded-xl border border-border-main focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 text-sm font-black outline-none"
                    />
                  </div>

                  {/* Calculated Balance Preview */}
                  {(() => {
                    const t = Number(advanceFormData.amount) || 0;
                    const p = Number(advanceFormData.paidAmount) || 0;
                    const bal = Math.max(0, t - p);

                    return (
                      <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        bal === 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                      }`}>
                        <span>Remaining Balance to Pay / Deduct:</span>
                        <span className="font-black text-sm">
                          ₹{bal.toLocaleString()} {bal === 0 && t > 0 ? '(Fully Cleared)' : ''}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Payment Mode
                    </label>
                    <select
                      value={advanceFormData.paymentMethod}
                      onChange={(e) => setAdvanceFormData({ ...advanceFormData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Initial Status */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAdvanceFormData(prev => ({ ...prev, status: 'pending', paidAmount: 0 }))}
                        className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${
                          advanceFormData.status === 'pending'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-background-muted/40 text-text-secondary border-border-main'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvanceFormData(prev => ({
                          ...prev,
                          status: 'partially_paid',
                          paidAmount: prev.paidAmount && Number(prev.paidAmount) > 0 ? prev.paidAmount : Math.round((Number(prev.amount) || 0) / 2)
                        }))}
                        className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${
                          advanceFormData.status === 'partially_paid'
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : 'bg-background-muted/40 text-text-secondary border-border-main'
                        }`}
                      >
                        Partial
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvanceFormData(prev => ({
                          ...prev,
                          status: 'settled',
                          paidAmount: Number(prev.amount) || 0
                        }))}
                        className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${
                          advanceFormData.status === 'settled'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : 'bg-background-muted/40 text-text-secondary border-border-main'
                        }`}
                      >
                        Settled
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reason / Purpose Preset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Reason / Purpose
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {REASON_PRESETS.slice(0, 4).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAdvanceFormData({ ...advanceFormData, reason: preset })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          advanceFormData.reason === preset
                            ? 'bg-primary text-white'
                            : 'bg-background-muted text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={advanceFormData.reason}
                    onChange={(e) => setAdvanceFormData({ ...advanceFormData, reason: e.target.value })}
                    placeholder="Enter reason or notes..."
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 bg-background-muted/30 border-t border-border-light flex space-x-3 shrink-0 bg-background-card">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isEditingAdvance ? 'Update Advance' : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
      </Modal>

      {/* QUICK PAYMENT MODAL (Pay Partial or Full Balance to Worker) */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        zIndex="z-[105]"
      >
        <div className="bg-background-card w-full max-w-md max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
          <div className="p-5 sm:p-6 border-b border-border-light flex items-center justify-between shrink-0 bg-background-card">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-text-primary">
                  Settle Worker Advance / Wage
                </h3>
                <p className="text-[10px] text-text-secondary">
                  Pending amount is automatically shown to settle
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="text-text-muted hover:text-text-primary transition-all"
            >
              <XCircle size={24} />
            </button>
          </div>

          {payModalAdv && (() => {
            const paidNow = payModalAdv.paidAmount !== undefined
              ? payModalAdv.paidAmount
              : (payModalAdv.status === 'settled' ? payModalAdv.amount : 0);
            const currentBal = payModalAdv.balanceAmount !== undefined
              ? payModalAdv.balanceAmount
              : Math.max(0, payModalAdv.amount - paidNow);
            const enterVal = Number(payAmount) || 0;
            const newBal = Math.max(0, currentBal - enterVal);

            return (
              <form onSubmit={handleConfirmPayment} className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                  {/* Pending Balance Banner */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                        Pending Advance to Settle
                      </span>
                      <span className="text-base font-black text-amber-600">
                        ₹{currentBal.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayAmount(currentBal)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                    >
                      Pay Full (₹{currentBal.toLocaleString()})
                    </button>
                  </div>

                  {/* Worker Info Pill */}
                  <div className="p-3 bg-background-muted/40 rounded-2xl border border-border-light flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-text-muted block">Worker</span>
                      <span className="font-black text-sm text-text-primary">
                        {payModalAdv.employee?.name || 'Worker'}
                      </span>
                      <span className="text-[10px] text-text-secondary block font-mono">
                        {payModalAdv.employee?.role || 'Staff'} {payModalAdv.reason ? `• ${payModalAdv.reason}` : ''}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                      Wage Advance
                    </span>
                  </div>

                  {/* Financial Breakdown Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-background-muted/30 rounded-xl border border-border-light text-center">
                      <span className="text-[9px] font-bold text-text-muted uppercase block">Total Amount</span>
                      <span className="font-black text-xs text-text-primary block mt-0.5">
                        ₹{payModalAdv.amount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Already Paid</span>
                      <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        ₹{paidNow.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-center">
                      <span className="text-[9px] font-bold text-amber-500 uppercase block">Balance Due</span>
                      <span className="font-black text-xs text-amber-500 block mt-0.5">
                        ₹{currentBal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Amount Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Pending Amount to Settle (₹) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setPayAmount(currentBal)}
                        className="text-[10px] font-black text-primary hover:underline uppercase"
                      >
                        Settle Full Balance (₹{currentBal.toLocaleString()})
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={currentBal}
                        step="any"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Enter amount to pay..."
                        className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-base font-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Balance Preview */}
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    newBal === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  }`}>
                    <span>Balance After This Payment:</span>
                    <span className="font-black text-sm">
                      ₹{newBal.toLocaleString()} {newBal === 0 ? '(Fully Cleared!)' : ''}
                    </span>
                  </div>

                  {/* Payment Method & Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Payment Mode
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-bold outline-none"
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Payment Notes
                    </label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="e.g. Paid in Cash / GPay to worker"
                      className="w-full px-3 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-emerald-500 text-text-primary text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 bg-background-muted/30 border-t border-border-light flex space-x-3 shrink-0 bg-background-card">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isSubmittingPay ? 'Recording...' : `Settle ₹${(Number(payAmount) || currentBal).toLocaleString()}`}</span>
                  </button>
                </div>
              </form>
            );
          })()}
        </div>
      </Modal>

      {/* MODAL 2: Add / Edit Employee Profile */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        zIndex="z-[105]"
      >
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
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                {/* Employee Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Full Name *
                  </label>
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
                  {/* Role / Designation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Role / Designation
                    </label>
                    <select
                      value={employeeFormData.role}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Phone Number
                    </label>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Daily / Base Wage (₹) (Optional)
                    </label>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Joining Date
                    </label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={employeeFormData.notes}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, notes: e.target.value })}
                    placeholder="e.g. Works evening kitchen shift, full-time helper..."
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 bg-background-muted/30 border-t border-border-light flex space-x-3 shrink-0 bg-background-card">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
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
