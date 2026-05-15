import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { showToast } from '../../utils/sweetAlert';
import api from '../../api/axiosInstance';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Package,
  PackageX,
  AlertTriangle,
  Trash2,
  Ticket,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CategorySection from './sections/CategorySection';
import MenuSection from './sections/MenuSection';
import OrderSection from './sections/OrderSection';
import StaffManagement from './sections/StaffManagement';
import UserManagement from './sections/UserManagement';
import SettingsSection from './sections/SettingsSection';
import OfferSection from './sections/OfferSection';
import SalesSection from './sections/SalesSection';
import Loader from '../../components/Loader/Loader';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('week'); // 'week' or 'month'
  const [notifications, setNotifications] = useState(JSON.parse(localStorage.getItem('admin_notifications') || '[]'));
  const [showNotifications, setShowNotifications] = useState(false);
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

  // Notification Audio
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useEffect(() => {
    const socket = io(`${window.location.protocol}//${window.location.hostname}:5000`);

    socket.on('newOrder', (data) => {
      // Strictly filter notifications: Only Delivery orders from User source
      const isDelivery = data.order?.orderType === 'delivery' || data.order?.orderType === 'online';
      const isFromUser = data.order?.orderSource === 'user' || data.order?.orderSource === 'online';

      if (!isDelivery || !isFromUser) {
        setRefreshKey(prev => prev + 1);
        return;
      }

      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'order',
        title: 'New Order',
        message: data.message,
        time: new Date(),
        read: false,
        orderData: data.order
      };

      setNotifications(() => {
        const currentLocal = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        const updated = [newNotif, ...currentLocal].slice(0, 20);
        localStorage.setItem('admin_notifications', JSON.stringify(updated));
        return updated;
      });

      showToast('success', data.message);
      notificationSound.current.play().catch(e => console.log('Audio play blocked'));
      setRefreshKey(prev => prev + 1);
    });

    // Stock alerts are now excluded as requested
    socket.off('stockAlert');

    return () => socket.disconnect();
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('admin_notifications', '[]');
  };

  const removeNotification = (id, e) => {
    if (e) e.stopPropagation();
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchSettings();
  }, [refreshKey]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    document.title = `Admin | ${activeTab}`;
    if (activeTab === 'Overview') {
      fetchDashboardStats();
    }
  }, [activeTab, refreshKey]);

  const fetchDashboardStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const navigateWithFilter = (tab, subTab = null, statusFilter = null, searchTerm = null) => {
    if (tab === 'Orders') {
      if (subTab) localStorage.setItem('orderActiveTab', subTab);
      if (statusFilter) localStorage.setItem('orderStatusFilter', statusFilter);
      else localStorage.removeItem('orderStatusFilter');
      if (searchTerm) localStorage.setItem('orderSearchTerm', searchTerm);
      else localStorage.removeItem('orderSearchTerm');
    } else if (tab === 'Menu') {
      if (searchTerm) localStorage.setItem('menuSearchTerm', searchTerm);
      else localStorage.removeItem('menuSearchTerm');
    }
    handleTabChange(tab);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { replace: true });
  };

  const metrics = stats ? [
    { label: 'Today Revenue', value: `₹${stats.metrics.todayRevenue.toLocaleString()}`, description: 'Daily sales', icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Daily Profit', value: `₹${stats.metrics.todayProfit.toLocaleString()}`, description: 'Net earnings today', icon: DollarSign, color: 'text-status-available' },
    { label: 'Total Orders', value: stats.metrics.totalOrders.toString(), description: 'Order count', icon: ShoppingCart, color: 'text-purple-500' },
    { label: 'Customers', value: stats.metrics.totalCustomers.toString(), description: 'Unique customers', icon: Users, color: 'text-amber-500' },
    { label: 'Menu Items', value: stats.metrics.totalMenuItems.toString(), description: 'Catalogue size', icon: BookOpen, color: 'text-pink-500' },
    { label: 'Avg Order Value', value: `₹${stats.metrics.avgOrderValue.toFixed(2)}`, description: 'Average spend', icon: BarChart3, color: 'text-orange-500' },
  ] : [];

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

  return (
    <div className={`flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300`}>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-background-card border-border flex flex-col transition-all duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-22' : 'lg:w-64'}
        w-64
      `}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`
            hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-xl border-2 border-background-card z-20 transition-transform duration-300 hover:scale-110
            ${!isSidebarCollapsed ? 'rotate-180' : ''}
          `}
        >
          <ChevronRight size={14} strokeWidth={3} />
        </button>

        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar relative">
          <div className="p-6 border-b border-border/40 flex items-center justify-center relative">
            <button
              onClick={() => handleTabChange('Overview')}
              className="transition-transform active:scale-95 outline-none"
            >
              <img
                src={
                  (isSidebarCollapsed && !isMobileMenuOpen)
                    ? "/browser-icon.png"
                    : (isDarkMode
                      ? (settings?.branding?.logoGold || "/logo-golden.png")
                      : (settings?.branding?.logoDark || "/logo-dark.png"))
                }
                alt="Logo"
                className={`${(isSidebarCollapsed && !isMobileMenuOpen) ? 'h-8' : 'h-10'} w-auto transition-all duration-500`}
              />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden absolute right-6 p-2 text-text-secondary hover:text-primary transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-8 overflow-y-auto no-scrollbar">
            {[
              {
                group: 'Main',
                items: [
                  { name: 'Overview', icon: LayoutDashboard },
                  { name: 'Sales', icon: LineChart },
                  { name: 'Orders', icon: ShoppingCart },
                ]
              },
              {
                group: 'Inventory',
                items: [
                  { name: 'Categories', icon: Filter },
                  { name: 'Menu', icon: UtensilsCrossed },
                  { name: 'Offers', icon: Ticket },
                ]
              },
              {
                group: 'Administration',
                items: [
                  { name: 'Users', icon: Users },
                  { name: 'Staff', icon: UserCheck },
                  { name: 'Settings', icon: Settings },
                ]
              }
            ].map((section) => (
              <div key={section.group} className="space-y-2">
                {!isSidebarCollapsed && (
                  <h3 className="px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.25em] mb-3 opacity-60">
                    {section.group}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleTabChange(item.name);
                        if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                      }}
                      title={isSidebarCollapsed && !isMobileMenuOpen ? item.name : ''}
                      className={`w-full flex items-center rounded-2xl transition-all duration-300 p-3 group relative ${activeTab === item.name
                        ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
                        : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                        } ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
                    >
                      {activeTab === item.name && (
                        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full animate-in slide-in-from-left duration-300" />
                      )}
                      <item.icon size={20} className={`shrink-0 transition-all duration-300 ${activeTab === item.name ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}`} />
                      <span className={`
                        transition-all duration-300 overflow-hidden whitespace-nowrap text-sm
                        ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
                      `}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-border/40 space-y-1">
            <button
              onClick={() => navigate('/home')}
              className={`w-full flex items-center rounded-2xl transition-all duration-300 p-3 text-primary hover:bg-primary/5 group ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
            >
              <ExternalLink size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
              <span className={`
                transition-all duration-300 overflow-hidden whitespace-nowrap font-black uppercase tracking-[0.2em] text-[9px]
                ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
              `}>
                View Website
              </span>
            </button>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-2xl text-status-unavailable hover:bg-status-off/5 transition-all p-3 group ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
            >
              <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
              <span className={`
                transition-all duration-300 overflow-hidden whitespace-nowrap font-black uppercase tracking-[0.2em] text-[9px]
                ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
              `}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-22' : 'lg:ml-64'}`}>
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
                className="w-full pl-10 pr-4 py-2 bg-background border border-border/40 rounded-xl focus:bg-background-card focus:border-primary/40 transition-all outline-none text-sm placeholder:text-text-muted/40"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6">
            <button
              onClick={() => navigate('/home')}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all flex items-center space-x-2 group"
              title="Go to Customer View"
            >
              <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Website</span>
            </button>
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

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markNotificationsAsRead();
                }}
                className={`relative text-text-secondary hover:text-primary transition-all p-2 rounded-lg group ${showNotifications ? 'bg-primary/10 text-primary' : 'bg-background-muted/30'}`}
              >
                <Bell size={22} className={`${unreadCount > 0 ? 'animate-bounce' : 'group-hover:rotate-12'} transition-transform`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background-card shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-4 w-80 max-h-[500px] bg-background-card border border-border-light rounded-[2rem] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-border-light flex items-center justify-between bg-background-muted/20">
                      <h4 className="font-black text-text-primary text-sm uppercase tracking-widest">Notifications</h4>
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} className="text-[10px] font-bold text-text-muted hover:text-status-unavailable transition-colors uppercase">
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                          <div className="w-12 h-12 bg-background-muted rounded-full flex items-center justify-center mx-auto">
                            <Bell size={20} className="text-text-muted" />
                          </div>
                          <p className="text-xs text-text-muted font-medium italic">No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (notif.type === 'order') {
                                navigateWithFilter('Orders', 'takeaway', 'placed', notif.orderData?.orderNumber);
                              } else if (notif.type === 'lowStock' || notif.type === 'outOfStock') {
                                navigateWithFilter('Menu', null, null, notif.itemName);
                              }
                              setShowNotifications(false);
                            }}
                            className="p-4 border-b border-border-light/50 last:border-0 hover:bg-background-muted/30 transition-colors cursor-pointer group relative"
                          >
                            <div className="flex items-start space-x-3 pr-6">
                              <div className={`p-2 rounded-xl shrink-0 ${notif.type === 'order' ? 'bg-primary/10 text-primary' :
                                notif.type === 'outOfStock' ? 'bg-status-off/10 text-status-unavailable' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                {notif.type === 'order' ? <ShoppingCart size={16} /> : <AlertTriangle size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold transition-colors group-hover:text-primary ${notif.read ? 'text-text-primary' : 'text-primary'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[8px] text-text-muted font-bold uppercase mt-1">
                                  {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => removeNotification(notif.id, e)}
                              className="absolute top-4 right-4 p-1 text-text-muted hover:text-status-unavailable opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-border-light">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary">{admin.name || 'Admin'}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">{admin.email || 'Superuser'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {admin.name?.charAt(0) || 'AD'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isStatsLoading && !stats ? (
                <div className="flex flex-col items-center justify-center h-96 space-y-6">
                  <Loader size="large" />
                  <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading real-time analytics...</p>
                </div>
              ) : stats ? (
                <React.Fragment>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-black text-text-primary tracking-tight">Dashboard</h2>
                      <p className="text-text-secondary text-sm font-medium">Welcome back! Here's what's happening today.</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-background-card border border-border-main text-text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-background-muted transition-colors">
                        Export Table
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
                      >
                        Update Data
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Orders Card */}
                    <div
                      onClick={() => navigateWithFilter('Orders', 'history')}
                      className="bg-background-card p-8 rounded-[2.5rem] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
                            <ShoppingCart size={20} />
                          </div>
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Total Orders</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <span className="text-5xl font-black text-text-primary tracking-tighter">{stats.metrics.totalOrders}</span>
                        <div className="text-[9px] font-black text-text-muted uppercase mb-1.5 opacity-60">All Time</div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
                    </div>

                    {/* Dining Status Card */}
                    <div
                      onClick={() => navigateWithFilter('Orders', 'dine-in')}
                      className="bg-background-card p-8 rounded-[2.5rem] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                            <UtensilsCrossed size={20} />
                          </div>
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Dining Status</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-5xl font-black text-text-primary tracking-tighter">{stats.tableStats.available}</span>
                          <span className="text-xl font-bold text-text-muted">/{stats.tableStats.total}</span>
                        </div>
                        <div className="flex items-center space-x-1 mb-1.5 text-status-available text-[9px] font-black uppercase">
                          <span>{stats.tableStats.total > 0 ? Math.round(((stats.tableStats.total - stats.tableStats.available) / stats.tableStats.total) * 100) : 0}%</span>
                          <span className="text-text-muted opacity-40 font-bold">Occupied</span>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
                    </div>

                    {/* Today Revenue Card */}
                    <div
                      onClick={() => handleTabChange('Sales')}
                      className="bg-background-card p-8 rounded-[2.5rem] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                          </div>
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Today Revenue</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-end space-x-4">
                        <span className="text-4xl font-black text-text-primary tracking-tighter">₹{stats.metrics.todayRevenue.toLocaleString()}</span>
                        <div className="text-[9px] font-black text-blue-500 uppercase mb-1.5">Daily Sales</div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
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
                            { label: 'Number of Customers', value: stats.metrics.totalCustomers.toLocaleString(), icon: Users, color: 'bg-purple-500/10 text-purple-500', action: () => handleTabChange('Users') },
                            { label: 'Total Orders', value: stats.metrics.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-500', action: () => navigateWithFilter('Orders', 'history') },
                            { label: 'Average Order Values', value: `₹ ${stats.metrics.avgOrderValue.toFixed(2)}`, icon: BarChart3, color: 'bg-primary/10 text-primary', action: () => navigateWithFilter('Orders', 'history') },
                          ].map((item) => (
                            <div key={item.label} className="group cursor-pointer active:scale-95" onClick={item.action}>
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
                            <div
                              key={idx}
                              onClick={() => navigateWithFilter('Orders', 'history', null, order.orderNumber)}
                              className="flex items-center justify-between p-4 rounded-2xl hover:bg-background-muted transition-colors border border-transparent hover:border-border-light cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:scale-110 transition-transform">
                                  {(order.customer?.name || order.address?.recipientName || (order.customerDetails?.name !== 'Walk-in' ? order.customerDetails?.name : null) || 'W').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary group-hover:text-primary transition-colors">
                                    {order.customer?.name || order.address?.recipientName || (order.customerDetails?.name !== 'Walk-in' ? order.customerDetails?.name : null) || 'Walk-in Customer'}
                                  </p>
                                  <p className="text-[11px] text-text-muted font-medium">₹ {order.totalAmount} • {order.orderNumber} • <Clock size={10} className="inline mb-0.5" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              {(() => {
                                const status = getFriendlyStatus(order);
                                return (
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}>
                                    {status.label}
                                  </span>
                                );
                              })()}
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
                            <div
                              key={idx}
                              onClick={() => navigateWithFilter('Menu', null, null, dish.name)}
                              className="flex items-center justify-between group cursor-pointer hover:bg-background-muted/50 p-2 rounded-xl transition-all active:scale-[0.98]"
                            >
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                            <PackageX size={20} />
                          </div>
                          <h3 className="font-black text-text-primary text-xl">Inventory Alerts</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('Menu')}
                          className="text-primary text-xs font-bold hover:underline"
                        >
                          Manage Inventory
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div
                          onClick={() => navigateWithFilter('Menu')}
                          className="flex items-center space-x-4 p-6 rounded-3xl bg-status-off/5 border border-status-off/10 cursor-pointer hover:bg-status-off/10 transition-all active:scale-95"
                        >
                          <div className="p-3 bg-status-off/10 text-status-unavailable rounded-2xl">
                            <PackageX size={24} />
                          </div>
                          <div>
                            <p className="text-3xl font-black text-status-unavailable">{stats.stockStats.outOfStock}</p>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Out of Stock</p>
                          </div>
                        </div>
                        <div
                          onClick={() => navigateWithFilter('Menu')}
                          className="flex items-center space-x-4 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-all active:scale-95"
                        >
                          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <p className="text-3xl font-black text-amber-500">{stats.stockStats.lowStock}</p>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Low Stock</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {stats.stockStats.alerts.length === 0 ? (
                          <div className="text-center py-12 text-text-muted italic flex flex-col items-center space-y-3 bg-status-on/5 rounded-[2rem] border border-dashed border-status-on/20">
                            <CheckCircle2 className="text-status-available" size={40} />
                            <p className="font-bold">Inventory levels are healthy</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {stats.stockStats.alerts.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-background-muted/20 border border-border-light/50 hover:border-primary/30 transition-all group">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded-lg bg-background-card flex items-center justify-center overflow-hidden border border-border-light shrink-0">
                                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={18} className="text-text-muted" />}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-sm text-text-primary truncate group-hover:text-primary transition-colors">{item.name}</p>
                                    <p className="text-[9px] text-text-muted font-bold uppercase">{item.category?.name || 'Item'}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${item.totalStock === 0 ? 'bg-status-off/10 text-status-unavailable' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {item.totalStock}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden p-8 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-text-primary text-xl mb-6">Inventory Health</h3>
                        <div className="relative h-48 w-48 mx-auto mb-6">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-background-muted stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                            <circle
                              className="text-primary stroke-current transition-all duration-1000"
                              strokeWidth="10"
                              strokeLinecap="round"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                              strokeDasharray={`${((stats.metrics.totalMenuItems - (stats.stockStats.outOfStock + stats.stockStats.lowStock)) / stats.metrics.totalMenuItems) * 251} 251`}
                              transform="rotate(-90 50 50)"
                            />
                            <text x="50" y="50" className="fill-text-primary text-[14px] font-black" textAnchor="middle" dy="0.3em">
                              {Math.round(((stats.metrics.totalMenuItems - (stats.stockStats.outOfStock + stats.stockStats.lowStock)) / stats.metrics.totalMenuItems) * 100)}%
                            </text>
                            <text x="50" y="65" className="fill-text-muted text-[6px] font-bold uppercase" textAnchor="middle">Healthy</text>
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary font-bold">Total Items</span>
                          <span className="text-text-primary font-black">{stats.metrics.totalMenuItems}</span>
                        </div>
                        <div className="w-full bg-background-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
                        </div>
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

          {activeTab === 'Settings' && <SettingsSection key={`settings-${refreshKey}`} />}
          {activeTab === 'Offers' && <OfferSection key={`offers-${refreshKey}`} />}
          {activeTab === 'Sales' && <SalesSection key={`sales-${refreshKey}`} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
