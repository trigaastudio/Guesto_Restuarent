import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck,
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
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Layers,
  X
} from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Pagination from '../../../components/Pagination/Pagination';

const CATEGORIES = [
  'Vegetables & Fruits',
  'Meat & Poultry',
  'Dairy & Eggs',
  'Grocery & Spices',
  'Beverages & Soft Drinks',
  'Packaging & Disposables',
  'Gas & Fuel',
  'Cleaning & Sanitation',
  'Bakery & Breads',
  'General Supplies',
  'Other'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit', 'Other'];

const SupplierSection = ({ onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'directory'
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    settledExpenses: 0,
    totalAdvances: 0,
    netBalance: 0,
    monthExpenses: 0,
    monthPending: 0,
    monthSettled: 0,
    monthAdvances: 0,
    totalSuppliers: 0,
    activeSuppliers: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'expense' | 'advance'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'settled'
  const [selectedSupplierId, setSelectedSupplierId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [txFormData, setTxFormData] = useState({
    _id: null,
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    amount: '',
    paymentMethod: 'Cash',
    billNumber: '',
    description: '',
    status: 'pending'
  });

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    _id: null,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Vegetables & Fruits',
    address: '',
    notes: '',
    status: 'active'
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
      const res = await api.get('/api/suppliers/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching supplier summary:', err);
    }
  }, []);

  // Fetch suppliers list
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await api.get('/api/suppliers');
      if (res.data?.success) {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      showToast('error', 'Failed to load suppliers');
    }
  }, []);

  // Fetch transactions list
  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const range = getDateRange(dateFilter);
      const params = {
        limit: 500,
        page: 1
      };
      if (selectedSupplierId && selectedSupplierId !== 'all') {
        params.supplierId = selectedSupplierId;
      }
      if (typeFilter && typeFilter !== 'all') {
        params.type = typeFilter;
      }
      if (range.start) params.startDate = range.start;
      if (range.end) params.endDate = range.end;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/api/suppliers/transactions/all', { params });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showToast('error', 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, getDateRange, selectedSupplierId, typeFilter, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchSuppliers();
    fetchTransactions();
  }, [fetchSummary, fetchSuppliers, fetchTransactions]);

  // Handle Quick Date Chips
  const handleDateChip = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  // Open transaction modal
  const handleOpenTxModal = (type = 'expense', supplierId = null, existingTx = null) => {
    if (existingTx) {
      setTxFormData({
        _id: existingTx._id,
        supplier: existingTx.supplier?._id || existingTx.supplier || '',
        date: existingTx.date ? new Date(existingTx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        type: existingTx.type || 'expense',
        amount: existingTx.amount || '',
        paymentMethod: existingTx.paymentMethod || 'Cash',
        billNumber: existingTx.billNumber || '',
        description: existingTx.description || '',
        status: existingTx.status || 'pending'
      });
      setIsEditingTx(true);
    } else {
      setTxFormData({
        _id: null,
        supplier: supplierId || (suppliers.length > 0 ? suppliers[0]._id : ''),
        date: new Date().toISOString().split('T')[0],
        type: type,
        amount: '',
        paymentMethod: 'Cash',
        billNumber: '',
        description: '',
        status: 'pending'
      });
      setIsEditingTx(false);
    }
    setIsTxModalOpen(true);
  };

  // Save Transaction
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!txFormData.supplier) {
      showToast('warning', 'Please select a supplier');
      return;
    }
    if (!txFormData.amount || Number(txFormData.amount) <= 0) {
      showToast('warning', 'Please enter a valid amount');
      return;
    }

    try {
      if (isEditingTx && txFormData._id) {
        await api.put(`/api/suppliers/transactions/${txFormData._id}`, txFormData);
        showToast('success', 'Transaction updated successfully');
      } else {
        await api.post('/api/suppliers/transactions', txFormData);
        showToast('success', `${txFormData.type === 'expense' ? 'Expense' : 'Advance'} recorded successfully`);
      }
      setIsTxModalOpen(false);
      fetchTransactions(true);
      fetchSuppliers();
      fetchSummary();
    } catch (err) {
      console.error('Error saving transaction:', err);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to record transaction'
      });
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    const result = await showDeleteConfirmation('Delete this transaction?', 'This cannot be undone.');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/suppliers/transactions/${id}`);
        showToast('success', 'Transaction deleted');
        fetchTransactions(true);
        fetchSuppliers();
        fetchSummary();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        showToast('error', 'Failed to delete transaction');
      }
    }
  };

  // Toggle Settlement Status (1-click settle)
  const handleToggleSettle = async (tx) => {
    try {
      const res = await api.patch(`/api/suppliers/transactions/${tx._id}/toggle-settle`, {});
      if (res.data?.success) {
        showToast('success', res.data.message);
        fetchTransactions(true);
        fetchSuppliers();
        fetchSummary();
      }
    } catch (err) {
      console.error('Error toggling settlement:', err);
      showToast('error', 'Failed to update settlement status');
    }
  };

  // Open Supplier Modal
  const handleOpenSupplierModal = (sup = null) => {
    if (sup) {
      setSupplierFormData({
        _id: sup._id,
        name: sup.name,
        contactPerson: sup.contactPerson || '',
        phone: sup.phone || '',
        email: sup.email || '',
        category: sup.category || 'Vegetables & Fruits',
        address: sup.address || '',
        notes: sup.notes || '',
        status: sup.status || 'active'
      });
      setIsEditingSupplier(true);
    } else {
      setSupplierFormData({
        _id: null,
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'Vegetables & Fruits',
        address: '',
        notes: '',
        status: 'active'
      });
      setIsEditingSupplier(false);
    }
    setIsSupplierModalOpen(true);
  };

  // Save Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.name || !supplierFormData.name.trim()) {
      showToast('warning', 'Supplier name is required');
      return;
    }

    try {
      if (isEditingSupplier && supplierFormData._id) {
        await api.put(`/api/suppliers/${supplierFormData._id}`, supplierFormData);
        showToast('success', 'Supplier updated successfully');
      } else {
        const res = await api.post('/api/suppliers', supplierFormData);
        showToast('success', 'Supplier added successfully');
        // If modal was triggered from empty list or tx modal, auto-select
        if (res.data?.data?._id) {
          setTxFormData(prev => ({ ...prev, supplier: res.data.data._id }));
        }
      }
      setIsSupplierModalOpen(false);
      fetchSuppliers();
      fetchSummary();
    } catch (err) {
      console.error('Error saving supplier:', err);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to save supplier details'
      });
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (sup) => {
    const result = await showDeleteConfirmation(
      `Delete ${sup.name}?`,
      'This will also delete all expenses & advances associated with this supplier!'
    );
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/suppliers/${sup._id}`);
        showToast('success', 'Supplier deleted');
        fetchSuppliers();
        fetchTransactions(true);
        fetchSummary();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        showToast('error', 'Failed to delete supplier');
      }
    }
  };

  // Filtered transactions in view
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const supName = tx.supplier?.name || '';
      const billNo = tx.billNumber || '';
      const desc = tx.description || '';
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s ||
        supName.toLowerCase().includes(s) ||
        billNo.toLowerCase().includes(s) ||
        desc.toLowerCase().includes(s);
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesSupplier = selectedSupplierId === 'all' || (tx.supplier?._id === selectedSupplierId);
      const matchesStatus = statusFilter === 'all' || (tx.status || 'pending') === statusFilter;
      return matchesSearch && matchesType && matchesSupplier && matchesStatus;
    });
  }, [transactions, searchTerm, typeFilter, selectedSupplierId, statusFilter]);

  // Paginated transactions
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered suppliers in directory view
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchTerm.toLowerCase();
      return !q ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q));
    });
  }, [suppliers, searchTerm]);

  // Selected supplier name helper
  const selectedSupplierObj = useMemo(() => {
    return suppliers.find(s => s._id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Truck size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">Suppliers & Expenses</h2>
              <p className="text-text-secondary text-xs">
                Track vendor details, purchase expenses, advance payments & account balances
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenTxModal('expense')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
          >
            <ArrowUpRight size={16} />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => handleOpenTxModal('advance')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
          >
            <ArrowDownLeft size={16} />
            <span>Pay Advance</span>
          </button>

          <button
            onClick={() => handleOpenSupplierModal()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
          >
            <Plus size={16} />
            <span>New Supplier</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Expenses</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            ₹{summary.totalExpenses.toLocaleString()}
          </div>
          <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
            <span className="text-amber-500 font-bold">₹{(summary.pendingExpenses || 0).toLocaleString()} Pending</span>
            <span className="text-text-muted">•</span>
            <span className="text-emerald-500 font-bold">₹{(summary.settledExpenses || 0).toLocaleString()} Settled</span>
          </div>
        </div>

        {/* Total Advances */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Advances Paid</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{summary.totalAdvances.toLocaleString()}
          </div>
          <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1 font-medium">
            <span>This Month:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{summary.monthAdvances.toLocaleString()}</span>
          </p>
        </div>

        {/* Net Outstanding Balance */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Net Balance</span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              summary.netBalance > 0
                ? 'bg-amber-500/10 text-amber-500'
                : summary.netBalance < 0
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-primary/10 text-primary'
            }`}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            ₹{Math.abs(summary.netBalance).toLocaleString()}
          </div>
          <p className="text-[10px] font-bold mt-1">
            {summary.netBalance > 0 ? (
              <span className="text-amber-500">Pending Amount to Pay</span>
            ) : summary.netBalance < 0 ? (
              <span className="text-blue-500">Advance Paid in Excess</span>
            ) : (
              <span className="text-text-muted">All Accounts Cleared</span>
            )}
          </p>
        </div>

        {/* Suppliers Count */}
        <div className="bg-background-card p-5 rounded-[1.8rem] border border-border-light shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Suppliers</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            {summary.activeSuppliers} <span className="text-xs font-normal text-text-muted">/ {summary.totalSuppliers} total</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            Registered vendors & partners
          </p>
        </div>
      </div>

      {/* Main Card with Sub-tabs and Content */}
      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-border-light bg-background-muted/20 px-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'ledger'
                  ? 'border-primary text-primary bg-background-card'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText size={16} />
              <span>Transactions & Ledger ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'directory'
                  ? 'border-primary text-primary bg-background-card'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building2 size={16} />
              <span>Suppliers Directory ({suppliers.length})</span>
            </button>
          </div>

          {/* Quick Date Chips (shown in Ledger tab) */}
          {activeTab === 'ledger' && (
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

        {/* Custom Date Range Picker (if 'custom' selected) */}
        {activeTab === 'ledger' && dateFilter === 'custom' && (
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
              onClick={() => fetchTransactions(true)}
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
                activeTab === 'ledger'
                  ? 'Search by supplier, bill no, or item...'
                  : 'Search by supplier name, phone, category...'
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
            {/* If in Ledger tab: Type Filter */}
            {activeTab === 'ledger' && (
              <>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="expense">Expenses / Bills Only</option>
                  <option value="advance">Advances Only</option>
                </select>

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
                  <option value="settled">Settled</option>
                </select>

                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background-muted/40 text-text-primary border border-border-main rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}

            {/* Clear Filters */}
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || selectedSupplierId !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSelectedSupplierId('all');
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

        {/* Filter Chip Indicator if supplier is selected */}
        {selectedSupplierId !== 'all' && selectedSupplierObj && (
          <div className="px-6 py-2.5 bg-primary/5 border-b border-border-light flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-2">
              <Building2 size={14} />
              Filtering Ledger for: <strong className="underline">{selectedSupplierObj.name}</strong>
              <span className="text-[10px] text-text-secondary">
                (Balance: ₹{selectedSupplierObj.balance?.toLocaleString() || 0})
              </span>
            </span>
            <button
              onClick={() => setSelectedSupplierId('all')}
              className="p-1 hover:bg-primary/10 rounded-full text-primary transition-all"
              title="Clear Supplier Filter"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab 1: Ledger & Transactions View */}
        {activeTab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Bill No</th>
                  <th className="px-5 py-4">Description / Items</th>
                  <th className="px-5 py-4">Payment Mode</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-10">
                      <TableSkeleton columns={9} rows={6} />
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FileText size={36} className="text-text-muted/40" />
                        <p className="font-bold text-sm">No transactions found</p>
                        <p className="text-xs text-text-muted">Record an expense or advance payment to get started</p>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleOpenTxModal('expense')}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                          >
                            + Record Expense
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-background-muted/30 transition-colors group">
                      {/* Date */}
                      <td className="px-5 py-4 font-bold text-text-primary">
                        {tx.date ? new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>

                      {/* Supplier */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span
                            onClick={() => setSelectedSupplierId(tx.supplier?._id || 'all')}
                            className="font-bold text-text-primary hover:text-primary cursor-pointer transition-colors"
                          >
                            {tx.supplier?.name || 'Unknown Supplier'}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {tx.supplier?.category || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          tx.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {tx.type === 'expense' ? 'Expense / Bill' : 'Advance Paid'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSettle(tx)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                            (tx.status || 'pending') === 'settled'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                          title={(tx.status || 'pending') === 'settled' ? 'Click to mark as Pending' : 'Click to mark as Settled'}
                        >
                          {(tx.status || 'pending') === 'settled' ? (
                            <>
                              <CheckCircle2 size={10} />
                              <span>Settled</span>
                            </>
                          ) : (
                            <>
                              <Clock size={10} />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Bill No */}
                      <td className="px-5 py-4 font-mono font-bold text-text-secondary">
                        {tx.billNumber ? `#${tx.billNumber}` : '-'}
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-text-secondary max-w-xs truncate" title={tx.description}>
                        {tx.description || '-'}
                      </td>

                      {/* Payment Mode */}
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-background-muted rounded-lg text-[10px] font-bold text-text-secondary">
                          {tx.paymentMethod || 'Cash'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className={`px-5 py-4 text-right font-black text-sm ${
                        tx.type === 'expense' ? 'text-text-primary' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {tx.type === 'expense' ? '' : '-'}₹{tx.amount?.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenTxModal(tx.type, tx.supplier?._id, tx)}
                            className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                            title="Edit Transaction"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                            title="Delete Transaction"
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

            {/* Pagination */}
            {filteredTransactions.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Tab 2: Suppliers Directory View */}
        {activeTab === 'directory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4 text-right">Total Bills</th>
                  <th className="px-5 py-4 text-right">Total Advances</th>
                  <th className="px-5 py-4 text-right">Net Balance</th>
                  <th className="px-5 py-4 text-center">Quick Actions</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Building2 size={36} className="text-text-muted/40" />
                        <p className="font-bold text-sm">No suppliers registered yet</p>
                        <p className="text-xs text-text-muted">Add suppliers to track their purchases and advances</p>
                        <button
                          onClick={() => handleOpenSupplierModal()}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold mt-2"
                        >
                          + Add First Supplier
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup._id} className="hover:bg-background-muted/30 transition-colors group">
                      {/* Name & Contact Person */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                            {sup.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{sup.name}</span>
                            {sup.contactPerson && (
                              <span className="text-[10px] text-text-muted">Contact: {sup.contactPerson}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-background-muted text-text-secondary border border-border-light">
                          {sup.category || 'General'}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-4 text-text-secondary">
                        <div className="flex flex-col text-[11px]">
                          {sup.phone ? (
                            <span className="flex items-center space-x-1 font-mono font-medium">
                              <Phone size={11} className="text-text-muted" />
                              <span>{sup.phone}</span>
                            </span>
                          ) : (
                            <span className="text-text-muted italic">No phone</span>
                          )}
                          {sup.address && (
                            <span className="text-[10px] text-text-muted truncate max-w-[150px]" title={sup.address}>
                              {sup.address}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Expenses */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-text-primary">
                            ₹{(sup.totalExpenses || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-semibold text-amber-500">
                            ₹{(sup.pendingExpenses || 0).toLocaleString()} pending
                          </span>
                        </div>
                      </td>

                      {/* Total Advances */}
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(sup.totalAdvances || 0).toLocaleString()}
                      </td>

                      {/* Net Balance */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-sm ${
                            sup.balance > 0
                              ? 'text-amber-500'
                              : sup.balance < 0
                              ? 'text-blue-500'
                              : 'text-text-muted'
                          }`}>
                            ₹{Math.abs(sup.balance || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {sup.balance > 0 ? (
                              <span className="text-amber-500">Payable</span>
                            ) : sup.balance < 0 ? (
                              <span className="text-blue-500">In Advance</span>
                            ) : (
                              <span className="text-text-muted">Cleared</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Quick Record Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedSupplierId(sup._id);
                              setActiveTab('ledger');
                            }}
                            className="px-2.5 py-1 bg-background-muted hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-text-secondary transition-all"
                            title="Filter ledger for this supplier"
                          >
                            Ledger
                          </button>
                          <button
                            onClick={() => handleOpenTxModal('expense', sup._id)}
                            className="px-2 py-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            title="Add purchase bill / expense"
                          >
                            + Bill
                          </button>
                          <button
                            onClick={() => handleOpenTxModal('advance', sup._id)}
                            className="px-2 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            title="Pay advance to supplier"
                          >
                            + Advance
                          </button>
                        </div>
                      </td>

                      {/* Edit / Delete */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenSupplierModal(sup)}
                            className="p-1.5 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                            title="Edit Supplier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 rounded-lg transition-all"
                            title="Delete Supplier"
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

      {/* MODAL 1: Record Transaction (Expense or Advance) */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`p-2 rounded-xl ${txFormData.type === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {txFormData.type === 'expense' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </span>
                <h3 className="text-lg font-black text-text-primary">
                  {isEditingTx
                    ? 'Edit Transaction'
                    : txFormData.type === 'expense'
                    ? 'Record Supplier Expense / Bill'
                    : 'Record Supplier Advance Payment'}
                </h3>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="p-6 space-y-4">
                {/* Type Switcher (only when creating new) */}
                {!isEditingTx && (
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-background-muted/60 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setTxFormData({ ...txFormData, type: 'expense' })}
                      className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                        txFormData.type === 'expense'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Expense / Purchase Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxFormData({ ...txFormData, type: 'advance' })}
                      className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                        txFormData.type === 'advance'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Advance Payment
                    </button>
                  </div>
                )}

                {/* Supplier Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Supplier *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenSupplierModal()}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      + Add New Supplier
                    </button>
                  </div>
                  <select
                    value={txFormData.supplier}
                    onChange={(e) => setTxFormData({ ...txFormData, supplier: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={txFormData.amount}
                        onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-sm font-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={txFormData.date}
                      onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                      className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Payment Mode
                    </label>
                    <select
                      value={txFormData.paymentMethod}
                      onChange={(e) => setTxFormData({ ...txFormData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bill / Invoice Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Bill / Invoice No
                    </label>
                    <input
                      type="text"
                      value={txFormData.billNumber}
                      onChange={(e) => setTxFormData({ ...txFormData, billNumber: e.target.value })}
                      placeholder="e.g. INV-2026-01"
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxFormData({ ...txFormData, status: 'pending' })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        txFormData.status === 'pending'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-background-muted/50 text-text-secondary border-border-main hover:border-amber-400 hover:text-amber-500'
                      }`}
                    >
                      <Clock size={13} />
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxFormData({ ...txFormData, status: 'settled' })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        txFormData.status === 'settled'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-background-muted/50 text-text-secondary border-border-main hover:border-emerald-400 hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      Settled
                    </button>
                  </div>
                  <p className="text-[9px] text-text-muted font-medium">
                    {txFormData.status === 'pending'
                      ? 'Payment is due / not yet cleared'
                      : 'Payment has been fully settled / paid'}
                  </p>
                </div>

                {/* Description / Items purchased */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Description / Items / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={txFormData.description}
                    onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                    placeholder="e.g. 50kg Onions, 20kg Tomatoes, weekly advance payment..."
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-background-muted/30 border-t border-border-light flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-5 py-2.5 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                    txFormData.type === 'expense'
                      ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                      : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                  }`}
                >
                  {isEditingTx ? 'Update Transaction' : txFormData.type === 'expense' ? 'Save Expense' : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 size={20} />
                </span>
                <h3 className="text-lg font-black text-text-primary">
                  {isEditingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="p-6 space-y-4">
                {/* Supplier Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                    placeholder="e.g. Metro Veggie Hub, Al-Razi Meat, etc."
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-sm font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Category
                    </label>
                    <select
                      value={supplierFormData.category}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-bold outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.contactPerson}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                      placeholder="e.g. Abdul, Ramesh"
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      placeholder="vendor@example.com"
                      className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Address / Shop Location
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                    placeholder="e.g. Market Yard, Shop No 4, City"
                    className="w-full px-4 py-2.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Payment Terms / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                    placeholder="e.g. Weekly settlement on Saturday, accepts UPI..."
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary text-text-primary text-xs font-medium outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-background-muted/30 border-t border-border-light flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 px-5 py-2.5 border border-border-main text-text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isEditingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierSection;
