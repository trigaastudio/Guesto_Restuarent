import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ChefHat, LogOut, RefreshCw, Bell, Sun, Moon,
  ShoppingCart, UtensilsCrossed, Bike, X,
  ChevronRight, Clock, Package, Trash2, Printer,
  CheckCircle2, Loader2, AlertTriangle, Menu
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { showToast, showAlert } from '../../utils/sweetAlert';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const KITCHEN_STATUSES = [
  { value: 'pending', label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/40', dot: 'bg-amber-500' },
  { value: 'preparing', label: 'Preparing', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-400/40', dot: 'bg-blue-500' },
  { value: 'ready', label: 'Ready', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/40', dot: 'bg-emerald-500' },
];

const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const current = KITCHEN_STATUSES.find(s => s.value === value) || KITCHEN_STATUSES[0];

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 ${current.bg} ${current.text} ${current.border}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />
        <span>{current.label}</span>
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[100] bg-background-card border border-border-light rounded-2xl shadow-2xl overflow-hidden w-44 animate-in slide-in-from-top-1 duration-150">
          {KITCHEN_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-background-muted/50 ${s.value === value ? `${s.bg} ${s.text}` : 'text-text-secondary'
                }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
              <span>{s.label}</span>
              {s.value === value && (
                <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TABS = [
  { name: 'Counter', icon: ShoppingCart, type: 'takeaway' },
  { name: 'Dine In', icon: UtensilsCrossed, type: 'dine-in' },
  { name: 'Delivery', icon: Bike, type: 'delivery' },
];

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('kitchenActiveTab') || 'takeaway');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('kitchenActiveTab', tab);
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const staff = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const socketRef = useRef();
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  const playNotificationSound = () => {
    audioRef.current.play().catch(e => console.log('Sound play blocked by browser:', e));
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      const allOrders = response.data.data || [];
      // Show only confirmed and ready orders in the kitchen panel
      const kitchenOrders = allOrders.filter(o =>
        o.orderStatus === 'processing'
      );

      // Detect new orders for notifications and sound
      if (kitchenOrders.length > lastFetchCount && lastFetchCount > 0) {
        const diff = kitchenOrders.length - lastFetchCount;
        playNotificationSound();
        const newNotif = {
          id: Date.now(),
          message: `${diff} new order${diff > 1 ? 's' : ''} just arrived!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 10));
      }
      setLastFetchCount(kitchenOrders.length);
      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchCount]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    document.title = "Guesto-Kitchen panel";

    // Socket Setup
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('ordersUpdated', () => {
      fetchOrders(true);
    });

    // Timer for order age
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(timer);
    };
  }, []);

  const getOrderAge = (createdAt) => {
    const diffMs = currentTime - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const getAgeColor = (mins) => {
    if (mins < 10) return 'text-status-available';
    if (mins < 20) return 'text-amber-500';
    return 'text-status-unavailable animate-pulse';
  };

  const handlePrintKOT = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="text-transform: uppercase; font-weight: bold; padding: 8px 0; font-size: 16px;">${item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item')}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 8px; font-weight: bold;">
          <span style="font-size: 14px;">[ ${item.size} ]</span> 
          <span style="font-size: 18px; margin-left: 20px;">x ${item.quantity}</span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - ${order.orderNumber}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              padding: 10px; 
              margin: 0; 
              color: #000;
              font-size: 14px;
              line-height: 1.2;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .kot-title { font-size: 24px; font-weight: 900; margin-bottom: 5px; border: 2px solid #000; display: inline-block; padding: 2px 10px; }
            .restaurant-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="kot-title">KOT</div>
            <div class="restaurant-name">GUESTO RESTAURENT</div>
          </div>
          <div class="divider"></div>
          <div class="info-grid">
            <div>ORDER:${order.orderNumber.split('-')[1] || order.orderNumber}</div>
            <div style="text-align: right;">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div>TYPE:${order.orderType.toUpperCase()}</div>
            <div style="text-align: right;">${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
          </div>
          <div class="divider"></div>
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="text-align: center; font-weight: bold; margin-top: 10px;">
            --- END OF KOT ---
          </div>
        </body>
      </html>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleUpdateItemStatus = async (orderId, itemId, newStatus, itemName, currentStatus) => {
    if (newStatus === currentStatus) return;

    const labels = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready' };
    const colors = { pending: '#9CA3AF', preparing: '#F59E0B', ready: '#16A34A' };

    const result = await showAlert({
      icon: 'question',
      title: 'Change Status?',
      text: `Change "${itemName}" from ${labels[currentStatus] || currentStatus} → ${labels[newStatus]}?`,
      showCancelButton: true,
      confirmButtonColor: colors[newStatus] || '#C96A0A',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Yes, Change!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, { kitchenStatus: newStatus });
      showToast('success', `"${itemName}" → ${labels[newStatus]}`);
      fetchOrders(true);
    } catch (error) {
      console.error('Status update failed:', error);
      showToast('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRemoveOrder = async (orderId, orderNumber) => {
    const result = await showAlert({
      icon: 'warning',
      title: 'Remove Order?',
      text: `Remove order ${orderNumber} from kitchen view? This will mark it as completed.`,
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { orderStatus: 'completed' });
      showToast('success', `Order ${orderNumber} removed from kitchen`);
      fetchOrders(true);
    } catch (error) {
      showToast('error', 'Failed to remove order');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/staff/login', { replace: true });
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'delivery') return o.orderType === 'delivery' || o.orderType === 'online';
    if (activeTab === 'takeaway') return o.orderType === 'takeaway' || o.orderType === 'take-away';
    if (activeTab === 'dine-in') return o.orderType === 'dine-in' || o.orderType === 'dining';
    return o.orderType === activeTab;
  });

  const pendingCount = orders.filter(o =>
    o.items?.some(i => i.kitchenStatus === 'pending' || i.kitchenStatus === 'preparing')
  ).length;

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300">

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-background-card border-r border-border-light flex flex-col transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-64'}
        w-64
      `}>
        {/* Collapse toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-background-card z-20 transition-transform duration-300 ${!isSidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronRight size={14} />
        </button>

        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar">
          {/* Logo */}
          <div className="p-6 border-b border-border-light flex items-center justify-center relative">
            <img
              src={
                (isSidebarCollapsed && !isMobileMenuOpen)
                  ? '/browser-icon.png'
                  : (isDarkMode ? '/logo-golden.png' : '/logo-dark.png')
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

          {/* Role Badge */}
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="px-4 pt-4">
              <div className="flex items-center space-x-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <ChefHat size={16} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Kitchen Panel</p>
                  <p className="text-xs font-bold text-text-primary truncate">{staff.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            {TABS.map((tab) => {
              const count = orders.filter(o => {
                if (tab.type === 'delivery') return o.orderType === 'delivery' || o.orderType === 'online';
                if (tab.type === 'takeaway') return o.orderType === 'takeaway' || o.orderType === 'take-away';
                if (tab.type === 'dine-in') return o.orderType === 'dine-in' || o.orderType === 'dining';
                return o.orderType === tab.type;
              }).length;
              return (
                <button
                  key={tab.type}
                  onClick={() => { handleTabChange(tab.type); if (window.innerWidth < 1024) setIsMobileMenuOpen(false); }}
                  title={(isSidebarCollapsed && !isMobileMenuOpen) ? tab.name : ''}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 p-3 group relative
                    ${activeTab === tab.type
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold'
                      : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                    }
                    ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}
                  `}
                >
                  <tab.icon size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap flex-1 text-left
                    ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
                  `}>
                    {tab.name}
                  </span>
                  {count > 0 && (!isSidebarCollapsed || isMobileMenuOpen) && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full min-w-[1.25rem] text-center
                      ${activeTab === tab.type ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border-light">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl text-status-unavailable hover:bg-status-off/5 transition-all p-3 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`}
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap font-medium
                ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
              `}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-[5.5rem]' : 'lg:ml-64'}`}>

        {/* Header */}
        <header className="h-20 bg-background-card border-b border-border-main flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:bg-background-muted rounded-lg"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="text-lg font-black text-text-primary tracking-tight">Kitchen Dashboard</h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest hidden sm:block">
                {TABS.find(t => t.type === activeTab)?.name} Orders
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchOrders()}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all group"
              title="Refresh Orders"
            >
              <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 text-text-secondary hover:text-primary transition-all bg-background-muted/30 rounded-lg group"
              >
                <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background-card shadow-sm">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {showNotifPanel && (
                <div className="absolute right-0 top-12 w-80 bg-background-card border border-border-light rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-border-light">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Notifications</h3>
                    <button onClick={() => { setNotifications([]); setShowNotifPanel(false); }} className="text-[10px] text-text-muted hover:text-primary font-bold uppercase">Clear All</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-text-muted text-xs font-bold">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="flex items-start space-x-3 p-4 border-b border-border-light hover:bg-background-muted/30 transition-colors">
                          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-text-primary">{n.message}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Staff info */}
            <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-border-light">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary">{staff.name}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">{staff.employeeId}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500/10 flex items-center justify-center text-amber-500 font-black shrink-0 text-sm">
                {staff.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Loading Orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-28 h-28 bg-background-muted/50 rounded-full flex items-center justify-center border-2 border-dashed border-border-light">
                {activeTab === 'takeaway' && <ShoppingCart size={40} className="text-text-muted opacity-30" />}
                {activeTab === 'dine-in' && <UtensilsCrossed size={40} className="text-text-muted opacity-30" />}
                {activeTab === 'delivery' && <Bike size={40} className="text-text-muted opacity-30" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-primary">All Clear!</h2>
                <p className="text-text-secondary font-medium mt-1">No pending {TABS.find(t => t.type === activeTab)?.name} orders.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredOrders.map((order) => {
                const allReady = order.items?.every(i => i.kitchenStatus === 'ready');
                return (
                  <div
                    key={order._id}
                    className={`bg-background-card rounded-[2.5rem] border shadow-sm flex flex-col hover:shadow-xl transition-all duration-300 relative
                      ${allReady ? 'border-status-on/30' : 'border-border-light hover:border-primary/20'}
                    `}
                  >
                    {/* Order Header */}
                    <div className={`p-5 border-b border-border-light flex items-center justify-between rounded-t-[2.5rem] ${allReady ? 'bg-status-on/5' : 'bg-background-muted/30'}`}>
                      <div>
                        <h3 className="text-base font-black text-text-primary">{order.orderNumber}</h3>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <Clock size={11} className="text-text-muted" />
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest flex items-center space-x-1 border-l pl-2 ml-2 ${getAgeColor(getOrderAge(order.createdAt))}`}>
                            <Clock size={10} />
                            <span>{getOrderAge(order.createdAt)}m ago</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePrintKOT(order)}
                          className="p-2 bg-background-muted/50 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-border-light"
                          title="Print KOT"
                        >
                          <Printer size={16} />
                        </button>
                        {allReady && (
                          <span className="flex items-center space-x-1 px-3 py-1 bg-status-on/10 text-status-available rounded-full border border-status-on/20 text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={11} />
                            <span>All Ready</span>
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                          ${order.orderType === 'takeaway' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            order.orderType === 'dine-in' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              'bg-orange-500/10 text-orange-500 border-orange-500/20'}
                        `}>
                          {order.orderType}
                        </span>
                      </div>
                    </div>

                    {/* Customer info if exists */}
                    {(order.customerDetails?.name || order.address?.recipientName || order.tableNumber) && (
                      <div className="px-5 pt-3 pb-0 flex items-center space-x-3 text-xs text-text-secondary font-bold">
                        {(order.customerDetails?.name || order.address?.recipientName) && (
                          <span>👤 {(order.orderSource === 'online' || order.orderSource === 'user') 
                            ? (order.address?.recipientName || order.customerDetails?.name) 
                            : (order.customerDetails?.name || order.address?.recipientName)}
                          </span>
                        )}
                        {order.tableNumber && <span>🪑 Table {order.tableNumber}</span>}
                      </div>
                    )}

                    {/* Items */}
                    <div className="flex-1 p-5 space-y-3">
                      {order.items?.map((item) => {
                        const status = item.kitchenStatus || 'pending';
                        return (
                          <div key={item._id} className="flex items-center justify-between p-3 bg-background-muted/20 rounded-2xl border border-border-light gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-14 h-14 bg-background-card rounded-xl flex items-center justify-center border border-border-light shrink-0 overflow-hidden">
                                {item.image || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.image : '') ? (
                                  <img src={item.image || item.menuItem.image} alt={item.name || item.menuItem.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={20} className="text-primary/40" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary text-xs leading-tight truncate">
                                  {item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item')}
                                </p>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                                  {item.size} • Qty: {item.quantity}
                                </p>
                              </div>
                            </div>

                            <StatusDropdown
                              value={status}
                              onChange={(newStatus) => handleUpdateItemStatus(
                                order._id, 
                                item._id, 
                                newStatus, 
                                item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item'), 
                                status
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer: Remove button when all ready */}
                    <div className={`px-5 pb-5 ${allReady ? 'block' : 'hidden'}`}>
                      <button
                        onClick={() => handleRemoveOrder(order._id, order.orderNumber)}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-status-off/10 hover:bg-status-off/20 text-status-unavailable border border-status-off/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95"
                      >
                        <Trash2 size={14} />
                        <span>Remove Order from Kitchen</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;
