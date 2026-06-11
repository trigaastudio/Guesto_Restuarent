import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ChefHat, LogOut, RefreshCw, Bell, Sun, Moon,
  ShoppingCart, UtensilsCrossed, Bike, X,
  ChevronRight, Clock, Package, Trash2, Printer,
  CheckCircle2, Loader2, AlertTriangle, Menu
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { showToast, showAlert } from '../../utils/sweetAlert';
import ListSkeleton from '../../components/Skeleton/ListSkeleton';
import { logoutStaff } from '../../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://guest-o-backend.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'https://guest-o-backend.onrender.com';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const KITCHEN_STATUSES = [
  { value: 'placed', label: 'Placed', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/40', dot: 'bg-amber-500' },
  { value: 'preparing', label: 'Preparing', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-400/40', dot: 'bg-blue-500' },
  { value: 'ready', label: 'Ready', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/40', dot: 'bg-emerald-500' },
  { value: 'delayed', label: 'Delayed', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-400/40', dot: 'bg-red-500' },
];

const ItemStatusActions = ({ value, onChange }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border outline-none appearance-none cursor-pointer transition-colors shadow-sm
          ${value === 'placed' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
          value === 'preparing' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
          value === 'delayed' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
          'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
        }`}
        style={{ textAlignLast: 'center', paddingRight: '20px' }}
      >
        {value === 'placed' && <option value="placed" disabled className="bg-background text-text-primary font-bold">Placed (New)</option>}
        <option value="preparing" className="bg-background text-text-primary font-bold">Preparing</option>
        <option value="delayed" className="bg-background text-text-primary font-bold">Delayed</option>
        <option value="ready" className="bg-background text-text-primary font-bold">Ready</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1 text-inherit opacity-70">
        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
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
    const tabName = TABS.find(t => t.type === tab)?.name || 'Kitchen';
    document.title = `Kitchen | ${tabName}`;
    localStorage.setItem('kitchenActiveTab', tab);
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(0);
  const [activeStatusFilter, setActiveStatusFilter] = useState('new');
  const [currentTime, setCurrentTime] = useState(new Date());

  const staff = JSON.parse(localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useCart();
  const isDarkMode = theme === 'dark';
  const socketRef = useRef();
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  const playNotificationSound = () => {
    audioRef.current.play().catch(e => console.log('Sound play blocked by browser:', e));
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/orders');
      const allOrders = response.data.data || [];

      const kitchenOrders = allOrders.filter(o =>
        o.orderStatus === 'processing' || (o.orderStatus === 'placed' && o.orderSource !== 'user' && o.orderSource !== 'online' && o.orderType !== 'delivery')
      );


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

    fetchOrders();
    const tabName = TABS.find(t => t.type === activeTab)?.name || 'Kitchen';
    document.title = `Kitchen | ${tabName}`;


    const token = localStorage.getItem('staff_token') || localStorage.getItem('admin_token') || '';
    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    });
    socketRef.current.on('ordersUpdated', () => {
      fetchOrders(true);
    });

    const handleDbChange = (event) => {
      const data = event.detail;
      if (['Order', 'orders'].includes(data.collection)) {
        fetchOrders(true);
      }
    };
    window.addEventListener('db_change', handleDbChange);


    const timer = setInterval(() => {
      setCurrentTime(new Date());
      fetchOrders(true);
    }, 60000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      window.removeEventListener('db_change', handleDbChange);
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

  const handlePrintKOT = async (order) => {

    let currentSettings = null;
    try {
      const response = await api.get('/api/settings');
      currentSettings = response.data.data;
    } catch (err) {
      console.error('Failed to fetch settings for KOT:', err);
    }

    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="text-transform: uppercase; font-weight: bold; padding: 8px 0; font-size: 16px;">${item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item')}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 8px; font-weight: bold;">
          <span style="font-size: 14px;">[ ${!item.size || item.size === 'null' ? 'Piece' : item.size} ]</span> 
          <span style="font-size: 18px; margin-left: 20px;">x ${item.quantity}</span>
        </td>
      </tr>
    `).join('');

    // Dynamic QR Logic
    let qrCodeUrl = '';
    const restaurantName = currentSettings?.restaurantDetails?.name || 'GUESTO RESTAURENT';
    const monochromeLogo = currentSettings?.branding?.logoMonochrome || null;
    const showQR = currentSettings?.printingSettings?.showKOTQRCode && order.orderType !== 'delivery' && (order.orderSource === 'online' || order.orderType === 'online');

    if (showQR && currentSettings.printingSettings.kotQRCodeImage) {
      qrCodeUrl = currentSettings.printingSettings.kotQRCodeImage;
    }

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
            .qr-section { text-align: center; margin-top: 20px; }
            .qr-label { font-size: 10px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); window.close(); }, 500);">
          <div class="header">
            ${monochromeLogo
        ? `<img src="${monochromeLogo}" style="width: 45mm; height: auto; margin: 0 auto 5px auto; display: block;" />`
        : `<div class="restaurant-name">${restaurantName}</div>`
      }
            <div class="kot-title">KOT</div>
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
          
          ${qrCodeUrl ? `
            <div class="qr-section">
              <div class="qr-label">${currentSettings.printingSettings.kotQRCodeType === 'upi' ? 'Scan to Pay' : 'Scan to Pay'}</div>
              <img src="${qrCodeUrl}" style="width: 120px; height: 120px; border: 1px solid #000; padding: 5px;" />
            </div>
          ` : ''}

          <div class="divider"></div>
          <div style="text-align: center; font-weight: bold; margin-top: 10px;">
            --- END OF KOT ---
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleUpdateItemStatus = async (orderId, itemId, newStatus, itemName, currentStatus) => {
    if (newStatus === currentStatus) return;

    const labels = { placed: 'Placed', preparing: 'Preparing', ready: 'Ready', delayed: 'Delayed' };

    try {
      await api.patch(`/api/orders/${orderId}/items/${itemId}/status`, { kitchenStatus: newStatus });
      showToast('success', `"${itemName}" → ${labels[newStatus]}`);
      fetchOrders(true);
    } catch (error) {
      console.error('Status update failed:', error);
      showToast('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleBulkUpdateOrderItems = async (orderId, newStatus, orderNumber) => {
    try {
      await api.patch(`/api/orders/${orderId}/items/bulk-status`, { kitchenStatus: newStatus });
      const labels = { placed: 'Placed', preparing: 'Preparing', ready: 'Ready', delayed: 'Delayed' };
      showToast('success', `All items in ${orderNumber} → ${labels[newStatus]}`);
      fetchOrders(true);
    } catch (error) {
      console.error('Bulk status update failed:', error);
      showToast('error', error.response?.data?.message || 'Failed to update all item statuses');
    }
  };

  const handleStartPreparation = async (order) => {
    try {

      const placedItems = order.items.filter(i => (i.kitchenStatus || 'placed') === 'placed');
      if (placedItems.length === 0) {
        showToast('info', 'No new items to start preparing');
        return;
      }
      const updatePromises = placedItems.map(item =>
        api.patch(`/api/orders/${order._id}/items/${item._id}/status`, { kitchenStatus: 'preparing' })
      );

      await Promise.all(updatePromises);

      showToast('success', `${placedItems.length} new item(s) on ${order.orderNumber} sent to preparing!`);
      fetchOrders(true);
    } catch (error) {
      console.error('Failed to start preparation:', error);
      showToast('error', 'Failed to update statuses');
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
      await api.patch(`/api/orders/${orderId}/status`, { orderStatus: 'delivered' });
      showToast('success', `Order ${orderNumber} removed from kitchen`);
      fetchOrders(true);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to remove order');
    }
  };

  const handleLogout = () => {
    logoutStaff(navigate);
  };

  const filteredOrders = orders.filter(o => {

    let typeMatch = false;
    if (activeTab === 'delivery') typeMatch = o.orderType === 'delivery' || o.orderType === 'online';
    else if (activeTab === 'takeaway') typeMatch = o.orderType === 'takeaway' || o.orderType === 'take-away';
    else if (activeTab === 'dine-in') typeMatch = o.orderType === 'dine-in' || o.orderType === 'dining';
    else typeMatch = o.orderType === activeTab;

    if (!typeMatch) return false;



    if (o.items?.some(i => i.kitchenStatus === 'delayed')) return true;
    if (activeStatusFilter === 'all') return true;
    if (activeStatusFilter === 'new') return o.items?.some(i => (i.kitchenStatus || 'placed') === 'placed');
    if (activeStatusFilter === 'preparing') return o.items?.some(i => i.kitchenStatus === 'preparing');
    if (activeStatusFilter === 'delayed') return o.items?.some(i => i.kitchenStatus === 'delayed');

    return true;
  });

  const pendingCount = orders.filter(o =>
    o.items?.some(i => i.kitchenStatus === 'placed' || i.kitchenStatus === 'preparing')
  ).length;

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300">

      { }
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      { }
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-background-card border-r border-border-light flex flex-col transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-64'}
        w-64
      `}>
        { }
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-background-card z-20 transition-transform duration-300 ${!isSidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronRight size={14} />
        </button>

        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar">
          { }
          <div className="p-6 border-b border-border-light flex items-center justify-center relative">
            <img
              src={
                (isSidebarCollapsed && !isMobileMenuOpen)
                  ? '/browser-icon.png'
                  : (isDarkMode ? (settings?.branding?.logoGold || '/logo-golden.png') : (settings?.branding?.logoDark || '/logo-dark.png'))
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

          { }
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="px-4 pt-4">
              <div className="flex items-center space-x-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <ChefHat size={16} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{staff.role === 'admin' ? 'Admin Access' : 'Kitchen Panel'}</p>
                  <p className="text-xs font-bold text-text-primary truncate">{staff.name || 'Staff'}</p>
                </div>
              </div>
            </div>
          )}

          { }
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            {TABS.map((tab) => {
              const count = orders.filter(o => {
                let typeMatch = false;
                if (tab.type === 'delivery') typeMatch = o.orderType === 'delivery' || o.orderType === 'online';
                else if (tab.type === 'takeaway') typeMatch = o.orderType === 'takeaway' || o.orderType === 'take-away';
                else if (tab.type === 'dine-in') typeMatch = o.orderType === 'dine-in' || o.orderType === 'dining';
                else typeMatch = o.orderType === tab.type;

                if (!typeMatch) return false;


                return o.items?.some(i => (i.kitchenStatus || 'placed') === 'placed');
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
                <p className="text-sm font-bold text-text-primary">{staff.name || 'User'}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">
                  {staff.role === 'admin' ? 'Administrator' : (staff.employeeId || 'Staff')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500/10 flex items-center justify-center text-amber-500 font-black shrink-0 text-sm">
                {staff.name?.charAt(0) || staff.role?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* Status Filter Bar */}
          <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pb-4 pt-1 -mt-1 flex items-center space-x-3 flex-wrap gap-y-2">
            {[
              { id: 'new', label: 'New Orders', icon: Bell, filterKey: 'placed' },
              { id: 'preparing', label: 'Preparing', icon: ChefHat, filterKey: 'preparing' },
              { id: 'delayed', label: 'Delayed', icon: AlertTriangle, filterKey: 'delayed' },
            ].map(filter => {
              const tabOrders = orders.filter(o => {
                let typeMatch = false;
                if (activeTab === 'delivery') typeMatch = o.orderType === 'delivery' || o.orderType === 'online';
                else if (activeTab === 'takeaway') typeMatch = o.orderType === 'takeaway' || o.orderType === 'take-away';
                else if (activeTab === 'dine-in') typeMatch = o.orderType === 'dine-in' || o.orderType === 'dining';
                else typeMatch = o.orderType === activeTab;
                if (!typeMatch) return false;
                return o.items?.some(i => filter.filterKey === 'placed' ? (i.kitchenStatus || 'placed') === 'placed' : i.kitchenStatus === filter.filterKey);
              });
              const count = tabOrders.length;
              const isDelayed = filter.id === 'delayed';
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveStatusFilter(filter.id)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                    ${activeStatusFilter === filter.id
                      ? isDelayed ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105' : 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : isDelayed && count > 0 ? 'text-red-500 hover:bg-red-500/10 border border-red-500/20 animate-pulse' : 'text-text-muted hover:bg-background-muted hover:text-text-primary'
                    }
                  `}
                >
                  <filter.icon size={14} className={activeStatusFilter === filter.id ? 'animate-pulse' : ''} />
                  <span>{filter.label}</span>
                  {count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] ${activeStatusFilter === filter.id ? 'bg-white/20 text-white' :
                      isDelayed ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListSkeleton key={i} />
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredOrders.map((order) => {
                const allReady = order.items?.every(i => i.kitchenStatus === 'ready');
                return (
                  <div
                    key={order._id}
                    className={`bg-background-card/80 backdrop-blur-sm rounded-[2.5rem] border flex flex-col transition-all duration-300 relative overflow-hidden
                      ${allReady ? 'border-status-on/30 shadow-emerald-500/5' : order.kitchenStatus === 'delayed' ? 'border-red-500/40 shadow-red-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'border-border-light shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/30'}
                    `}
                  >
                    {/* Delayed Glow Effect */}
                    {order.kitchenStatus === 'delayed' && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 animate-pulse" />
                    )}
                    {/* Order Header */}
                    <div className={`p-4 border-b border-border-light flex items-center justify-between rounded-t-[2.5rem] ${allReady ? 'bg-status-on/5' : 'bg-background-muted/20'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-background-card rounded-xl flex items-center justify-center border border-border-light shadow-sm">
                          <Package size={18} className={allReady ? 'text-status-available' : 'text-primary'} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-text-primary tracking-tight truncate">
                            {order.orderNumber}
                            {order.orderType === 'dine-in' && order.table && (
                              <span className="ml-2 text-primary">| Table {order.table.tableNumber}</span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`flex items-center space-x-1 border-l border-border-light pl-2 ${getAgeColor(getOrderAge(order.createdAt))}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest">{getOrderAge(order.createdAt)}m</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Print KOT - always visible */}
                        <button
                          onClick={() => handlePrintKOT(order)}
                          className="p-2 bg-background-card text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-border-light shadow-sm"
                          title="Print KOT"
                        >
                          <Printer size={14} />
                        </button>
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm
                          ${order.orderType === 'takeaway' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            order.orderType === 'dine-in' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              'bg-orange-500/10 text-orange-500 border-orange-500/20'}
                        `}>
                          {order.orderType === 'takeaway' ? 'CTR' : order.orderType === 'dine-in' ? 'DNE' : 'DLV'}
                        </span>
                      </div>
                    </div>



                    {/* Progress Bar & Actions */}
                    {activeStatusFilter !== 'new' && (
                      <div className="px-5 py-3 border-b border-border-light bg-background-muted/10 flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.1em]">Order Progress</span>
                          <span className="text-[10px] font-bold text-text-muted">
                            {order.items?.filter(i => i.kitchenStatus === 'ready').length || 0} / {order.items?.length || 0} Ready
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-background-muted rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${((order.items?.filter(i => i.kitchenStatus === 'ready').length || 0) / (order.items?.length || 1)) * 100}%` }}
                          />
                        </div>
                        {order.items?.some(i => i.kitchenStatus !== 'ready') && (
                          <div className="pt-2 flex justify-end">
                            <div className="relative">
                              <select
                                value=""
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus) handleBulkUpdateOrderItems(order._id, newStatus, order.orderNumber);
                                }}
                                className="appearance-none px-4 py-1.5 bg-background-card border border-border-light text-text-primary text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm hover:border-primary/50 cursor-pointer pr-8"
                              >
                                <option value="">Bulk Update Items</option>
                                <option value="preparing">All Preparing</option>
                                <option value="delayed">All Delayed</option>
                                <option value="ready">All Ready</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-text-muted">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Special Instructions */}
                    {order.remarks && (
                      <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Special Instructions</p>
                            <p className="text-xs font-bold text-amber-900/80 dark:text-amber-200/80">{order.remarks}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* In 'new' tab: only show 'placed' items to avoid re-showing already-preparing items */}
                      {(activeStatusFilter === 'new'
                        ? order.items?.filter(i => (i.kitchenStatus || 'placed') === 'placed')
                        : order.items
                      )?.slice().reverse().map((item) => {
                        const status = item.kitchenStatus || 'placed';
                        return (
                          <div key={item._id} className={`grid ${activeStatusFilter === 'new' ? 'grid-cols-[40px_1fr]' : 'grid-cols-[48px_1fr_auto]'} items-center p-3 bg-background-muted/10 rounded-2xl border border-border-light hover:border-primary/20 transition-all gap-3 group/item`}>
                            { }
                            <div className="w-10 h-10 bg-background-card rounded-xl flex items-center justify-center border border-border-light shrink-0 overflow-hidden shadow-sm">
                              {item.image || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.image : '') ? (
                                <img src={item.image || item.menuItem.image} alt={item.name || item.menuItem.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                              ) : (
                                <Package size={18} className="text-primary/20" />
                              )}
                            </div>

                            {/* Column 2: Details */}
                            <div className="min-w-0 flex flex-col justify-center">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-black text-text-primary text-[11px] leading-tight uppercase tracking-tight">
                                  {item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item')}
                                  {item.size && (
                                    <span className="inline-block ml-1.5 text-[8px] bg-background-card px-1.5 py-0.5 rounded-md border border-border-light text-text-muted font-black uppercase tracking-widest align-middle">
                                      {item.size}
                                    </span>
                                  )}
                                </p>
                                <span className="text-[11px] text-primary font-black uppercase tracking-widest shrink-0 mt-[-1px]">x {item.quantity}</span>
                              </div>

                              { }
                              {item.bogoItem && (
                                <div className="mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
                                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-1.5 opacity-90">Buy 1 Get 1 Free Add-on:</span>
                                  <div className="flex flex-col gap-1 pl-1.5 border-l-[1.5px] border-emerald-500/40">
                                    <span className="text-emerald-700 text-[9px] font-black flex items-center gap-1.5">
                                      <span className="text-emerald-500/60 text-[8px]">🎁</span> Free {item.bogoItem.name} {item.bogoItem.size ? `(${item.bogoItem.size})` : ''} x {item.bogoItem.quantity || item.quantity}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Combo Items */}
                              {item.comboItems && item.comboItems.length > 0 && (
                                <div className="mt-2 bg-primary/5 p-2 rounded-lg border border-primary/10">
                                  <span className="text-[8px] font-black text-primary uppercase tracking-widest block mb-1.5 opacity-90">Combo includes:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.comboItems.map((ci, idx) => (
                                      <span key={idx} className="text-primary text-[9px] font-black bg-background-card px-1.5 py-0.5 rounded border border-primary/10">
                                        {ci.quantity || 1}x {ci.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Included Items (Add-ons) */}
                              {item.includedItems && item.includedItems.length > 0 && (
                                <div className="mt-2 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                                  <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest block mb-1.5 opacity-90">Includes Add-ons:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.includedItems.map((ii, idx) => (
                                      <span key={idx} className="text-purple-700 text-[9px] font-black bg-background-card px-1.5 py-0.5 rounded border border-purple-500/20">
                                        {ii.quantity || 1}x {ii.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Column 3: Status Actions */}
                            {activeStatusFilter !== 'new' && (
                              <div className="flex justify-end pr-1">
                                <ItemStatusActions
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
                            )}
                          </div>
                        );
                      })}
                    </div>

                    { }
                    <div className="px-4 pb-4 space-y-2">
                      { }
                      {activeStatusFilter === 'new' && order.items?.some(i => (i.kitchenStatus || 'placed') === 'placed') && (
                        <div className="relative w-full">
                          <select
                            value=""
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === 'preparing') handleStartPreparation(order);
                              else if (newStatus) handleBulkUpdateOrderItems(order._id, newStatus, order.orderNumber);
                            }}
                            className="appearance-none w-full py-3 bg-background-card text-text-primary border border-border-light rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:border-primary/50 transition-all cursor-pointer text-center outline-none"
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="">-- Update All Items --</option>
                            <option value="preparing">Preparing (Start All)</option>
                            <option value="delayed">Delayed</option>
                            <option value="ready">Ready</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-text-muted">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      )}

                      {allReady && (
                        <button
                          onClick={() => handleRemoveOrder(order._id, order.orderNumber)}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-status-off/10 hover:bg-status-off/20 text-status-unavailable border border-status-off/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95"
                        >
                          <Trash2 size={14} />
                          <span>Remove Order from Kitchen</span>
                        </button>
                      )}
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
