import React, { useState, useEffect } from 'react';
import {
  FileDown,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ChevronDown,
  Search,
  Loader2,
  PieChart,
  BarChart3,
  Layers,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import Pagination from '../../../components/Pagination/Pagination';
import api from '../../../api/axiosInstance';
import { showToast } from '../../../utils/sweetAlert';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesSection = () => {
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({ orders: [], stats: { totalRevenue: 0, totalQty: 0 } });
  const [periodicData, setPeriodicData] = useState({ daily: {}, weekly: {}, monthly: {}, yearly: {} });
  const [itemStats, setItemStats] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    orderType: 'all',
    orderSource: 'all',
    menuItem: 'all'
  });

  const [activeTab, setActiveTab] = useState('summary'); // summary, items, detailed
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSortConfig, setItemSortConfig] = useState({ key: 'qty', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchInitialData = async () => {
    try {
      const [menuRes, periodicRes] = await Promise.all([
        api.get('/api/menus?all=true'),
        api.get('/api/reports/periodic')
      ]);
      setMenuItems(menuRes.data);
      setPeriodicData(periodicRes.data.data);
    } catch (error) {
      console.error('Error fetching initial reporting data:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [salesRes, itemsRes] = await Promise.all([
        api.get('/api/reports/sales', { params: filters }),
        api.get('/api/reports/items', { params: { startDate: filters.startDate, endDate: filters.endDate } })
      ]);
      setSalesData(salesRes.data.data);
      setItemStats(itemsRes.data.data);
    } catch (error) {
      showToast('error', 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      orderType: 'all',
      orderSource: 'all',
      menuItem: 'all'
    });
  };

  const exportToExcel = () => {
    const dataToExport = activeTab === 'summary' ? itemStats.map(i => ({
      'Item Name': i.name,
      'Size': i.size,
      'Qty Sold': i.qty,
      'Revenue': Math.round(i.revenue)
    })) : salesData.orders.map(o => ({
      'Order #': o.orderNumber,
      'Date': new Date(o.createdAt).toLocaleDateString(),
      'Type': o.orderType.toUpperCase(),
      'Source': o.orderSource.toUpperCase(),
      'Status': o.orderStatus.toUpperCase(),
      'Items': o.items.map(i => `${i.name || i.menuItem?.name || 'Item'} (${i.quantity})`).join(', '),
      'Revenue': o.totalAmount
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'summary' ? 'Item Sales' : 'Orders');
    XLSX.writeFile(wb, `Sales_Report_${filters.startDate}_to_${filters.endDate}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Sales Report (${filters.startDate} to ${filters.endDate})`, 14, 15);

    const tableColumn = activeTab === 'summary'
      ? ["Item Name", "Size", "Qty Sold", "Revenue"]
      : ["Order #", "Date", "Type", "Items", "Amount"];

    const tableRows = activeTab === 'summary'
      ? itemStats.map(i => [
        i.name,
        i.size,
        i.qty,
        `Rs. ${Math.round(i.revenue)}`
      ])
      : salesData.orders.map(o => {
        return [
          o.orderNumber,
          new Date(o.createdAt).toLocaleDateString(),
          o.orderType.toUpperCase(),
          o.items.map(i => `${i.name || i.menuItem?.name || 'Item'} (${i.quantity})`).join(', '),
          `Rs. ${o.totalAmount}`
        ];
      });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      headStyles: { fillGray: true, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 }
    });
    doc.save(`Sales_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
  };

  const getFriendlyStatus = (order) => {
    if (!order) return { label: 'Unknown', color: 'bg-background-muted/10 text-text-muted border-border-light' };
    
    // Terminal States
    if (order.orderStatus === 'cancelled') return { label: 'Cancelled', color: 'bg-status-off/10 text-status-unavailable border-status-off/20' };
    if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') return { label: 'Delivered', color: 'bg-primary/10 text-primary border-primary/20' };
    
    // Active States
    if (order.orderStatus === 'placed') return { label: 'New Order', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (order.orderStatus === 'out-for-delivery') return { label: 'Out for Delivery', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };

    if (order.orderStatus === 'processing') {
      const items = order.items || [];
      const allReady = items.length > 0 && items.every(i => i.kitchenStatus === 'ready');
      const anyPreparing = items.some(i => i.kitchenStatus === 'preparing');

      if (allReady) return { label: 'Ready', color: 'bg-status-on/10 text-status-available border-status-on/20' };
      if (anyPreparing) return { label: 'Preparing', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      
      return { label: 'Order Accepted', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
    }

    return { label: order.orderStatus, color: 'bg-background-muted/10 text-text-muted border-border-light' };
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-background-card p-6 rounded-[2rem] border border-border/40 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={color.replace('bg-', 'text-')} size={20} />
        </div>
        <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{title}</div>
      </div>
      <div className="text-3xl font-black text-text-primary tracking-tighter">₹{Math.round(value).toLocaleString()}</div>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 opacity-5 ${color}`} />
    </div>
  );

  const handleSort = (key) => {
    let direction = 'desc';
    if (itemSortConfig.key === key && itemSortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setItemSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    let filtered = itemStats.filter(item =>
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let aVal = a[itemSortConfig.key];
      let bVal = b[itemSortConfig.key];


      if (aVal < bVal) return itemSortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return itemSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedItems = getSortedItems();

  // Pagination logic
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = activeTab === 'summary'
    ? Math.ceil(sortedItems.length / itemsPerPage)
    : Math.ceil(salesData.orders.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, itemSearchTerm, filters]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Financial Reports</h2>
          <p className="text-text-secondary text-sm font-medium">Track your business performance and profitability.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600/10 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-600/20"
          >
            <FileDown size={16} />
            <span>Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-600/10 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-600/20"
          >
            <Printer size={16} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-background-card p-6 rounded-[2.5rem] border border-border/40 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-4 py-2.5 bg-background-muted/30 border border-border-light rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-4 py-2.5 bg-background-muted/30 border border-border-light rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Order Type</label>
            <select
              name="orderType"
              value={filters.orderType}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-background-muted/30 border border-border-light rounded-xl text-xs font-bold focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Item Filter</label>
            <select
              name="menuItem"
              value={filters.menuItem}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-background-muted/30 border border-border-light rounded-xl text-xs font-bold focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Items</option>
              {menuItems.map(item => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-background-muted text-text-secondary rounded-xl text-xs font-bold hover:bg-border-light transition-all"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Total Revenue" value={salesData.stats.totalRevenue} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title="Total Orders" value={salesData.orders.length} icon={ShoppingBag} color="bg-purple-500" />
      </div>

      {/* Periodic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          { label: 'Today', data: periodicData.daily, color: 'text-blue-500' },
          { label: 'This Week', data: periodicData.weekly, color: 'text-purple-500' },
          { label: 'This Month', data: periodicData.monthly, color: 'text-orange-500' },
          { label: 'This Year', data: periodicData.yearly, color: 'text-green-500' }
        ].map((item, idx) => (
          <div key={idx} className="bg-background-card p-6 rounded-3xl border border-border/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{item.label}</span>
              <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')} animate-pulse`} />
            </div>
            <div className="space-y-1">
              <div className="text-xl font-black text-text-primary">₹{Math.round(item.data.revenue || 0).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs for detailed view */}
      <div className="bg-background-card rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-light bg-background-muted/20 px-6 gap-4">
          <div className="flex items-center">
            {[
              { id: 'summary', label: 'Item Performance', icon: BarChart3 },
              { id: 'detailed', label: 'Order History', icon: Layers }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                  }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <div className="relative pb-4 sm:pb-0 sm:pr-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search dishes..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background-card border border-border-light rounded-xl text-[10px] font-bold focus:border-primary outline-none min-w-[200px]"
              />
            </div>
          )}
        </div>

        <div className="p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Generating Report...</p>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-background-muted/30 border-b border-border-light">
                    {[
                      { key: 'name', label: 'Item Name', align: 'left' },
                      { key: 'size', label: 'Size', align: 'left' },
                      { key: 'qty', label: 'Qty Sold', align: 'center' },
                      { key: 'revenue', label: 'Revenue', align: 'right' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`px-6 py-4 font-black text-text-muted uppercase tracking-widest cursor-pointer hover:text-primary transition-colors ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`flex items-center space-x-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                          <span>{col.label}</span>
                          <ChevronDown size={12} className={`transition-transform ${itemSortConfig.key === col.key && itemSortConfig.direction === 'asc' ? 'rotate-180' : ''} ${itemSortConfig.key === col.key ? 'text-primary' : 'opacity-20'}`} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {getPaginatedData(sortedItems).length > 0 ? getPaginatedData(sortedItems).map((item, idx) => (
                    <tr key={idx} className="hover:bg-background-muted/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-text-primary">{item.name}</td>
                      <td className="px-6 py-4 text-text-secondary uppercase text-[10px] font-bold">{item.size}</td>
                      <td className="px-6 py-4 text-center font-black text-text-primary">{item.qty}</td>
                      <td className="px-6 py-4 text-right font-bold text-text-primary">₹{Math.round(item.revenue).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-text-muted italic">No items found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-background-muted/30 border-b border-border-light">
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest">Order #</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest">Items</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest text-right">Amount</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {getPaginatedData(salesData.orders).map((order, idx) => (
                    <tr key={idx} className="hover:bg-background-muted/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-text-primary">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold uppercase text-text-muted px-2 py-0.5 bg-background-muted rounded-md">{order.orderType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-0.5">
                          {order.items.map((item, iIdx) => (
                            <span key={iIdx} className="text-[10px] text-text-primary font-medium line-clamp-1">
                              {item.name || item.menuItem?.name || 'Item'} ({item.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-text-primary">₹{Math.round(order.totalAmount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const status = getFriendlyStatus(order);
                          return (
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesSection;
