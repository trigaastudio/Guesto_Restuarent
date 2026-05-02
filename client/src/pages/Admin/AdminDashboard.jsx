import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Settings,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  DollarSign,
  ShoppingCart,
  BookOpen,
  LineChart,
  PieChart as PieChartIcon,
  BarChart3,
  UserCheck,
  Layers,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CategorySection from './sections/CategorySection';
import MenuSection from './sections/MenuSection';
import OrderSection from './sections/OrderSection';
import StaffManagement from './sections/StaffManagement';
import UserManagement from './sections/UserManagement';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'Overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    if (activeTab === 'Overview') {
      fetchDashboardStats();
    }
  }, [activeTab, refreshKey]);

  const fetchDashboardStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminActiveTab');
    navigate('/admin/login', { replace: true });
  };

  const metrics = stats ? [
    { label: 'Total Revenue', value: `₹${stats.metrics.totalRevenue.toLocaleString()}`, description: 'Lifetime earnings', icon: DollarSign, color: 'text-primary' },
    { label: 'Today Revenue', value: `₹${stats.metrics.todayRevenue.toLocaleString()}`, description: 'Daily earnings', icon: TrendingUp, color: 'text-status-available' },
    { label: 'Total Orders', value: stats.metrics.totalOrders.toString(), description: 'Order count', icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Customers', value: stats.metrics.totalCustomers.toString(), description: 'Unique customers', icon: Users, color: 'text-purple-500' },
    { label: 'Menu Items', value: stats.metrics.totalMenuItems.toString(), description: 'Catalogue size', icon: BookOpen, color: 'text-amber-500' },
    { label: 'Avg Order Value', value: `₹${stats.metrics.avgOrderValue.toFixed(2)}`, description: 'Average spend', icon: BarChart3, color: 'text-pink-500' },
  ] : [];

  const recentOrders = [
    { id: '#ORD-7234', customer: 'Anwar Sadat', items: 'Chicken Biryani, Lime Soda', type: 'Dine-in', amount: '₹450', status: 'Pending', time: '5 mins ago' },
    { id: '#ORD-7233', customer: 'Rahul K.', items: 'Alfaham, Roti', type: 'Takeaway', amount: '₹320', status: 'Delivered', time: '12 mins ago' },
    { id: '#ORD-7232', customer: 'Aiswarya R.', items: 'Beef Roast, Appam x4', type: 'Delivery', amount: '₹580', status: 'Preparing', time: '18 mins ago' },
    { id: '#ORD-7231', customer: 'Kevin John', items: 'Club Sandwich, Fries', type: 'Dine-in', amount: '₹210', status: 'Delivered', time: '25 mins ago' },
  ];

  const lowStockItems = [
    { item: 'Chicken Biriyani', category: 'Main Course', stock: '5 portions', threshold: '15 portions', status: 'Critical' },
    { item: 'Alfaham', category: 'Grill', stock: '3 full', threshold: '10 full', status: 'Critical' },
    { item: 'Beef Roast', category: 'Side Dish', stock: '4 portions', threshold: '8 portions', status: 'Low' },
    { item: 'Lime Soda', category: 'Beverages', stock: '8 servings', threshold: '15 servings', status: 'Low' },
  ];

  const charts = [
    { name: 'Revenue Trend', type: 'Line Chart', purpose: 'Daily / weekly / monthly revenue over time', icon: LineChart },
    { name: 'Order Distribution', type: 'Pie Chart', purpose: 'Breakdown by order type (Dine-in / Takeaway / Delivery)', icon: PieChartIcon },
    { name: 'Top Items', type: 'Bar Chart', purpose: 'Best-selling menu items ranked by quantity', icon: BarChart3 },
  ];

  return (
    <div className={`flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300`}>
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-background-card border-border flex flex-col transition-all duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-22' : 'lg:w-64'}
        w-64
      `}>
        {/* Toggle Button for Desktop - Moved to aside level to avoid overflow clipping */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`
            hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-bg-card z-20 transition-transform duration-300
            ${!isSidebarCollapsed ? 'rotate-180' : ''}
          `}
        >
          <ChevronRight size={14} />
        </button>

        {/* Inner Content with overflow handling */}
        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar relative">
          <div className="p-6 border-b border-border-light flex items-center justify-center relative">
            <img
              src={
                (isSidebarCollapsed && !isMobileMenuOpen)
                  ? "/browser-icon.png"
                  : (isDarkMode ? "/logo-golden.png" : "/logo-dark.png")
              }
              alt="Logo"
              className={`${(isSidebarCollapsed && !isMobileMenuOpen) ? 'h-8' : 'h-10'} w-auto transition-all duration-500`}
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden absolute right-6 p-2 text-text-secondary hover:text-status-unavailable transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            {[
              { name: 'Overview', icon: LayoutDashboard },
              { name: 'Orders', icon: ShoppingCart },
              { name: 'Staff', icon: UserCheck },
              { name: 'Categories', icon: Filter },
              { name: 'Menu', icon: UtensilsCrossed },
              { name: 'Users', icon: Users },
              { name: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  handleTabChange(item.name);
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed && !isMobileMenuOpen ? item.name : ''}
                className={`w-full flex items-center rounded-xl transition-all duration-200 p-3 group ${activeTab === item.name
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold'
                  : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                  } ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
              >
                <item.icon size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`
                  transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
                `}>
                  {item.name}
                </span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border-light space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl text-status-unavailable hover:bg-status-off/5 transition-all p-3 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`}
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`
                transition-all duration-300 overflow-hidden whitespace-nowrap font-medium
                ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
              `}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-22' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="h-20 bg-background-card border-b border-border-main flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:bg-background-muted rounded-lg group"
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
            <div className="relative hidden sm:flex w-64 lg:w-96 font-sans">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-background-muted rounded-lg border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none text-sm dark:bg-background-muted/50 dark:focus:bg-background-muted"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all group"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={`${refreshKey > 0 ? 'animate-spin-once' : ''} group-hover:rotate-180 transition-transform duration-500`} />
            </button>
            <button className="relative text-text-secondary hover:text-primary transition-all p-2 bg-background-muted/30 rounded-lg group">
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background-card shadow-sm">
                2
              </span>
            </button>
            <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-border-light">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary">Admin</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">Superuser</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isStatsLoading && !stats ? (
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                  <Loader2 className="animate-spin text-primary" size={48} />
                  <p className="text-text-secondary font-bold animate-pulse">Loading real-time analytics...</p>
                </div>
              ) : stats ? (
                <React.Fragment>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-text-primary tracking-tight">Dashboard</h2>
                      <p className="text-text-secondary text-sm font-medium">Welcome back! Here's what's happening today.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-background-card p-6 rounded-3xl border border-border-light shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                            <ShoppingCart size={18} />
                          </div>
                          <span className="text-sm font-bold text-text-secondary">Pending Orders</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <span className="text-4xl font-black text-text-primary">{stats.orderStats.pending}</span>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    </div>

                    <div className="bg-background-card p-6 rounded-3xl border border-border-light shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Clock size={18} />
                          </div>
                          <span className="text-sm font-bold text-text-secondary">Orders in Progress</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <span className="text-4xl font-black text-text-primary">{stats.orderStats.inProgress}</span>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    </div>

                    <div className="bg-background-card p-6 rounded-3xl border border-border-light shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <LayoutDashboard size={18} />
                          </div>
                          <span className="text-sm font-bold text-text-secondary">Available Tables</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-4xl font-black text-text-primary">{stats.tableStats.available}</span>
                          <span className="text-xl font-bold text-text-muted">/{stats.tableStats.total}</span>
                        </div>
                        <div className="flex items-center space-x-1 mb-1.5 text-status-available text-[11px] font-bold">
                          <span>{stats.tableStats.total > 0 ? Math.round(((stats.tableStats.total - stats.tableStats.available) / stats.tableStats.total) * 100) : 0}%</span>
                          <span className="text-text-muted font-normal uppercase">Occupied</span>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden flex flex-col">
                      <div className="p-8 border-b border-border-light flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-text-primary text-xl">Total Revenue</h3>
                          <p className="text-text-secondary text-xs font-medium">Sales Overview</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-background-muted/50 p-1 rounded-xl border border-border-light">
                          <button 
                            onClick={() => setChartTimeframe('week')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartTimeframe === 'week' ? 'bg-background-card text-text-primary shadow-sm border border-border-light' : 'text-text-muted hover:text-text-primary'}`}
                          >
                            This Week
                          </button>
                          <button 
                            onClick={() => setChartTimeframe('month')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartTimeframe === 'month' ? 'bg-background-card text-text-primary shadow-sm border border-border-light' : 'text-text-muted hover:text-text-primary'}`}
                          >
                            This Month
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 w-full p-8 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-primary/5 relative min-h-[300px]">
                        <div className={`flex items-end ${chartTimeframe === 'month' ? 'space-x-1 sm:space-x-1.5' : 'space-x-2 sm:space-x-4'} w-full h-48 justify-between items-baseline`}>
                          {(chartTimeframe === 'week' ? stats.revenueTrend : stats.monthlyTrend).map((data, i) => {
                            const trendData = chartTimeframe === 'week' ? stats.revenueTrend : stats.monthlyTrend;
                            const revenues = trendData.map(d => d.revenue);
                            const maxRevenue = Math.max(...revenues, 1);
                            const height = (data.revenue / maxRevenue) * 100;
                            const isToday = chartTimeframe === 'week' ? i === 6 : i === new Date().getDate() - 1;

                            return (
                              <div key={i} className="flex-1 flex flex-col items-center space-y-3 group h-full justify-end">
                                <div className="relative w-full flex flex-col items-center justify-end h-full">
                                  {data.revenue > 0 && (
                                    <div className="absolute -top-10 bg-black text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      ₹{data.revenue.toLocaleString()}
                                    </div>
                                  )}
                                  <div
                                    className={`w-full ${chartTimeframe === 'month' ? 'max-w-[12px]' : 'max-w-[40px]'} rounded-t-lg transition-all duration-700 relative ${isToday ? 'bg-primary shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.3)]' : 'bg-background-muted group-hover:bg-primary/30'}`}
                                    style={{ height: `${Math.max(height, chartTimeframe === 'month' ? 4 : 8)}%` }}
                                  >
                                    {isToday && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-t-lg" />}
                                  </div>
                                </div>
                                {chartTimeframe === 'week' ? (
                                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                                    {data.day}
                                  </span>
                                ) : (
                                  (i % 5 === 0 || i === trendData.length - 1) && (
                                    <span className={`text-[8px] font-bold ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                                      {data.day}
                                    </span>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-background-card p-8 rounded-[2.5rem] border border-border-light shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-black text-text-primary text-xl">Business Data</h3>
                          <div className="flex items-center space-x-1 text-text-muted">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">This Week</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {[
                            { label: 'Number of Customers', value: stats.metrics.totalCustomers.toLocaleString(), icon: Users, color: 'bg-purple-500/10 text-purple-500' },
                            { label: 'Total Orders', value: stats.metrics.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-500' },
                            { label: 'Average Order Values', value: `₹ ${stats.metrics.avgOrderValue.toFixed(2)}`, icon: BarChart3, color: 'bg-primary/10 text-primary' },
                          ].map((item) => (
                            <div key={item.label} className="group cursor-pointer">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-tight">{item.label}</span>
                                <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                              <div className={`flex items-center space-x-4 p-4 rounded-2xl border border-transparent transition-all group-hover:border-border-light ${item.color}`}>
                                <item.icon size={20} />
                                <span className="text-2xl font-black">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-text-primary text-xl">Recent Activity</h3>
                        <button className="text-primary text-xs font-bold hover:underline">View All</button>
                      </div>
                      <div className="space-y-6">
                        {stats.recentOrders.length === 0 ? (
                          <div className="text-center py-12 text-text-muted italic">No recent orders</div>
                        ) : (
                          stats.recentOrders.map((order, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-background-muted transition-colors border border-transparent hover:border-border-light">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                  {order.customer?.name?.charAt(0) || 'W'}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary">{order.customer?.name || 'Walk-in Customer'}</p>
                                  <p className="text-[11px] text-text-muted font-medium">₹ {order.totalAmount} • {order.orderNumber} • <Clock size={10} className="inline mb-0.5" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'completed' ? 'bg-status-on/10 text-status-available' : order.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : order.status === 'cancelled' ? 'bg-status-off/10 text-status-unavailable' : 'bg-blue-500/10 text-blue-500'}`}>
                                {order.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-text-primary text-xl">Top Dishes</h3>
                        <div className="flex items-center space-x-1 text-text-muted">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase">This Week</span>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {stats.topDishes.length === 0 ? (
                          <div className="text-center py-12 text-text-muted italic">No dishes sold yet</div>
                        ) : (
                          stats.topDishes.map((dish, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-background-muted flex items-center justify-center overflow-hidden border border-border-light group-hover:scale-105 transition-transform">
                                  {dish.image ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" /> : <UtensilsCrossed size={20} className="text-text-muted" />}
                                </div>
                                <span className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{dish.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-black text-text-primary">{dish.orders}</span>
                                <span className="text-[10px] font-bold text-text-muted uppercase">Qty</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ) : null}
            </div>
          )}

          {activeTab === 'Orders' && <OrderSection key={`order-${refreshKey}`} />}
          {activeTab === 'Categories' && <CategorySection key={`cat-${refreshKey}`} />}
          {activeTab === 'Menu' && <MenuSection key={`menu-${refreshKey}`} />}

          {activeTab === 'Staff' && <StaffManagement key={`staff-${refreshKey}`} />}
          {activeTab === 'Users' && <UserManagement key={`users-${refreshKey}`} />}

          {activeTab === 'Settings' && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border-light rounded-2xl">
              <p className="text-text-secondary font-medium italic">Settings section coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
