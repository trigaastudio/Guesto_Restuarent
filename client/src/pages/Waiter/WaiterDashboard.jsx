import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  LogOut, RefreshCw, Bell, Sun, Moon, Plus, Edit2, Trash2,
  UtensilsCrossed, X, ChevronRight, ChevronDown, Menu, Users, ShoppingCart, Hash, GitMerge, AlertCircle, CheckCircle2, Printer
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { showToast } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';
import DineInPOSModal from '../../components/POS/DineInPOSModal';

const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

const WaiterDashboard = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState([]);
  
  
  const staff = JSON.parse(localStorage.getItem('staff_user') || '{}');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useCart();
  const isDarkMode = theme === 'dark';
  const socketRef = useRef();

  const fetchTables = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      if (!silent) showToast('error', 'Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    document.title = 'Waiter | Dashboard';

    // Socket Setup
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('ordersUpdated', () => {
      fetchTables(true);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    navigate('/staff/login', { replace: true });
  };

  const handleTakeOrder = (table) => {
    setSelectedOrderForEdit(null);
    setSelectedTable(table);
    setIsPOSModalOpen(true);
  };

  const handleEditOrder = (table, order) => {
    setSelectedTable(table);
    setSelectedOrderForEdit(order);
    setIsPOSModalOpen(true);
  };



  const toggleOrderExpansion = (e, orderId) => {
    e.stopPropagation();
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = { orderStatus: newStatus };
      const orderToUpdate = tables.flatMap(t => t.activeOrders || []).find(o => o._id === orderId);

      if (newStatus === 'delivered' && orderToUpdate?.paymentStatus !== 'paid') {
        const defaultMethod = (orderToUpdate?.paymentMethod && orderToUpdate.paymentMethod !== 'unpaid') ? orderToUpdate.paymentMethod : 'cash';
        const payOptions = [
          { val: 'cash', label: 'Cash', color: '#16a34a', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>` },
          { val: 'upi/card', label: 'UPI / Card', color: '#7c3aed', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><rect x="16" y="15" width="4" height="4" rx="1"/></svg>` },
        ];
        const result = await Swal.fire({
          title: '<div style="font-size:20px; font-weight:800; color:var(--color-text-primary); letter-spacing:-0.5px; margin-bottom:10px;">Payment Method</div>',
          html: `
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:5px;">
              ${payOptions.map(({ val, label, color, icon }) => `
                <label id="pay-label-${val}" onclick="
                  document.querySelectorAll('[id^=pay-label-]').forEach(el=>{
                    el.style.borderColor='var(--color-border-light)';
                    el.style.background='var(--color-background-muted)';
                    el.querySelector('.pay-icon-wrap').style.background='rgba(0,0,0,0.05)';
                    el.querySelector('.pay-icon-wrap').style.color='var(--color-text-secondary)';
                    el.querySelector('.pay-check').style.opacity='0';
                  });
                  this.style.borderColor='${color}';
                  this.style.background='${color}15';
                  this.querySelector('.pay-icon-wrap').style.background='${color}25';
                  this.querySelector('.pay-icon-wrap').style.color='${color}';
                  this.querySelector('.pay-check').style.opacity='1';
                  document.getElementById('pay-val').value='${val}';
                  if ('${val}' === 'cash') {
                    document.getElementById('cash-calculator').style.display='block';
                  } else {
                    document.getElementById('cash-calculator').style.display='none';
                    document.getElementById('swal-cash-received').value='';
                    document.getElementById('swal-change-wrap').style.display='none';
                  }
                " style="display:flex; align-items:center; gap:16px; padding:16px; border:2px solid ${val === defaultMethod ? color : 'var(--color-border-light)'}; border-radius:18px; cursor:pointer; background:${val === defaultMethod ? color + '15' : 'var(--color-background-muted)'}; transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);">
                  <div class="pay-icon-wrap" style="width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:${val === defaultMethod ? color + '25' : 'rgba(0,0,0,0.05)'}; color:${val === defaultMethod ? color : 'var(--color-text-secondary)'}; flex-shrink:0; transition:all 0.2s;">
                    ${icon}
                  </div>
                  <div style="flex:1; text-align:left;">
                    <div style="font-weight:700; font-size:16px; color:var(--color-text-primary);">${label}</div>
                    <div style="font-size:12px; color:var(--color-text-secondary); margin-top:2px;">${val === 'cash' ? 'Pay by physical cash' : 'PhonePe, GPay, Debit/Credit cards'}</div>
                  </div>
                  <div class="pay-check" style="opacity:${val === defaultMethod ? '1' : '0'}; width:24px; height:24px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </label>
              `).join('')}
            </div>
            <input type="hidden" id="pay-val" value="${defaultMethod}" />
            <div id="cash-calculator" style="margin-top: 15px; display: ${defaultMethod === 'cash' ? 'block' : 'none'}; padding: 16px; background: rgba(0,0,0,0.02); border: 1px solid var(--color-border-light); border-radius: 18px;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <label style="font-size:10px; font-weight:800; color:var(--color-text-secondary); text-transform:uppercase; tracking-widest;">Cash Received</label>
                <div style="position:relative; width:120px;">
                  <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:12px; font-weight:bold; color:var(--color-text-muted);">₹</span>
                  <input type="number" id="swal-cash-received" value="" oninput="
                    const total = ${orderToUpdate.totalAmount || orderToUpdate.subtotal};
                    const received = parseFloat(this.value) || 0;
                    const changeWrap = document.getElementById('swal-change-wrap');
                    const changeEl = document.getElementById('swal-change-val');
                    if (received > 0) {
                      changeWrap.style.display = 'flex';
                      if (received >= total) {
                        changeEl.textContent = '₹' + (received - total).toFixed(2);
                        changeEl.style.color = '#10b981';
                      } else {
                        changeEl.textContent = 'Insufficient Cash';
                        changeEl.style.color = '#f59e0b';
                      }
                    } else {
                      changeWrap.style.display = 'none';
                    }
                  " placeholder="0" style="width:100%; padding:8px 8px 8px 22px; background:var(--color-background-card); border:1px solid var(--color-border-light); border-radius:12px; font-weight:900; text-align:right; font-size:13px; color:var(--color-text-primary);" />
                </div>
              </div>
              <div id="swal-change-wrap" style="display:none; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px dashed var(--color-border-light); font-size:12px; font-weight:800;">
                <span style="color:var(--color-text-secondary); text-transform:uppercase; font-size:10px; tracking:widest;">Balance to Return</span>
                <span id="swal-change-val" style="font-size:13px; color:#10b981;">₹0.00</span>
              </div>
            </div>
          `,
          background: 'var(--color-background-card)',
          showCancelButton: true,
          confirmButtonText: 'Confirm Payment',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#9ca3af',
          customClass: {
            confirmButton: 'swal-confirm-btn',
            popup: 'swal-payment-popup',
            title: 'swal-title'
          },
          didOpen: () => {
            const style = document.createElement('style');
            style.textContent = `
              .swal-payment-popup { border-radius: 28px !important; padding: 30px !important; }
              .swal-confirm-btn { border-radius: 14px !important; font-weight: 700 !important; font-size: 14px !important; padding: 12px 30px !important; text-transform: uppercase; letter-spacing: 0.5px; }
              .swal-title { padding-top: 0 !important; }
            `;
            document.head.appendChild(style);
          },
          preConfirm: () => {
            const val = document.getElementById('pay-val')?.value;
            if (!val) { Swal.showValidationMessage('Please select a payment method'); return false; }
            if (val === 'cash') {
              const cashRec = parseFloat(document.getElementById('swal-cash-received')?.value) || 0;
              const total = orderToUpdate.totalAmount || orderToUpdate.subtotal;
              if (cashRec < total) {
                Swal.showValidationMessage('Cash received is less than total order amount (₹' + total.toFixed(2) + ')');
                return false;
              }
              return { paymentMethod: 'cash', cashReceived: cashRec, balance: cashRec - total };
            }
            return { paymentMethod: val, cashReceived: orderToUpdate.totalAmount || orderToUpdate.subtotal, balance: 0 };
          }
        });

        if (!result.isConfirmed) return;

        updateData.paymentStatus = 'paid';
        updateData.paymentMethod = result.value.paymentMethod;
        updateData.cashReceived = result.value.cashReceived;
        updateData.balance = result.value.balance;
      }
      await api.patch(`/api/orders/${orderId}/status`, updateData);
      showToast('success', `Order marked as ${newStatus}`);
      fetchTables(true);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePrintKOT = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => {
      const name = item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item');
      const unitPrice = item.unitPrice || item.price || 0;
      const totalPrice = item.totalPrice || (unitPrice * item.quantity);
      return `
      <tr>
        <td colspan="4" style="text-transform: uppercase; font-weight: bold; padding-top: 8px;">${name} (${item.size})</td>
      </tr>
      ${item.bogoItem ? `
      <tr>
        <td colspan="4" style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: #000; padding-left: 10px;">
          * FREE: ${item.bogoItem.name || 'Free Item'} ${item.bogoItem.size ? `(${item.bogoItem.size})` : ''} x ${item.bogoItem.quantity || 1}
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="width: 40%;"></td>
        <td style="width: 15%; text-align: left;">${item.quantity} P</td>
        <td style="width: 20%; text-align: right;">${unitPrice.toFixed(2)}</td>
        <td style="width: 25%; text-align: right;">${totalPrice.toFixed(2)}</td>
      </tr>
    `;
    }).join('');

    // Dynamic settings for Bill
    const restaurantName = settings?.restaurantDetails?.name || 'GUESTO RESTAURENT';
    const restaurantAddress = settings?.restaurantDetails?.address || 'Chammannur,Athirthi';
    const restaurantPhone = settings?.restaurantDetails?.contactNumber || '7034805085';
    const monochromeLogo = settings?.branding?.logoMonochrome || null;

    // Dynamic QR Logic
    let qrCodeUrl = '';
    const showQR = settings?.printingSettings?.showKOTQRCode && (order.orderType === 'delivery' || order.orderSource === 'online' || order.orderType === 'online');

    if (showQR && settings?.printingSettings?.kotQRCodeImage) {
      qrCodeUrl = settings.printingSettings.kotQRCodeImage;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>RECEIPT - ${order.orderNumber}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              padding: 15px; 
              margin: 0; 
              color: #000;
              font-size: 14px;
              line-height: 1.2;
            }
            .header { text-align: center; margin-bottom: 5px; }
            .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 0px; }
            .details { font-size: 11px; margin-bottom: 0px; line-height: 1.1; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 5px; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            .total-section { font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; margin-top: 5px; }
            .payment-info { font-size: 13px; margin-top: 10px; }
            .qr-section { text-align: center; margin-top: 20px; }
            .qr-label { font-size: 10px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); window.close(); }, 500);">
          <div class="header">
            ${monochromeLogo
        ? `<img src="${monochromeLogo}" style="width: 45mm; height: auto; margin: 0 auto 2px auto; display: block;" />`
        : `<div class="restaurant-name">${restaurantName}</div>`
      }
            <div class="details">${restaurantAddress}</div>
            <div class="details">MOB: ${restaurantPhone}</div>
          </div>
          <div class="divider"></div>
          <div class="info-grid">
            <div>BILL NO:${order.orderNumber.split('-')[1] || order.orderNumber}</div>
            <div style="text-align: right;">DATE: ${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
            <div></div>
            <div style="text-align: right;">TIME: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="font-weight: bold;">
                <th style="width: 40%; text-align: left;">ITEM</th>
                <th style="width: 15%; text-align: left;">QTY</th>
                <th style="width: 20%; text-align: right;">PRICE</th>
                <th style="width: 25%; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="4"><div class="divider"></div></td></tr>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="total-section">
            <span>TOTAL :</span>
            <span>${(order.totalAmount || order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${order.paidAmount > 0 && (order.totalAmount || order.subtotal) > order.paidAmount ? `
            <div style="font-size: 13px; font-weight: bold; margin-top: 5px; display: flex; justify-content: space-between;">
              <span>PAID AMOUNT:</span>
              <span>₹${order.paidAmount.toFixed(2)}</span>
            </div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 3px; display: flex; justify-content: space-between; border: 1px solid #000; padding: 4px;">
              <span>BALANCE DUE:</span>
              <span>₹${((order.totalAmount || order.subtotal) - order.paidAmount).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="payment-info">
            ${order.paymentMethod === 'cash' ? `
              <div style="display: flex; justify-content: space-between;">
                <span>CASH RECEIVED :</span>
                <span>${(order.cashReceived || order.totalAmount || order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 3px;">
                <span>CHANGE :</span>
                <span>${(order.balance || 0).toFixed(2)}</span>
              </div>
            ` : (order.orderType === 'dine-in' && order.orderStatus !== 'delivered') ? `
              <div style="display: flex; justify-content: space-between;">
                <span>STATUS :</span>
                <span style="text-transform: uppercase; font-weight: bold;">BILLED</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between;">
                <span>PAYMENT METHOD :</span>
                <span style="text-transform: uppercase;">${order.paymentMethod || 'Not Specified'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 3px;">
                <span>STATUS :</span>
                <span style="text-transform: uppercase;">${order.paymentStatus || 'pending'}</span>
              </div>
            `}
          </div>
          
          ${qrCodeUrl ? `
            <div class="qr-section">
              <div class="qr-label">${settings?.printingSettings?.kotQRCodeType === 'upi' ? 'Scan to Pay' : 'Scan for Info'}</div>
              <img src="${qrCodeUrl}" style="width: 120px; height: 120px; border: 1px solid #000; padding: 5px;" />
            </div>
          ` : ''}

          <div class="divider"></div>
          <div style="text-align: center; font-size: 11px; margin-top: 10px;">
            ${(order.orderType === 'delivery' || order.orderType === 'online') ? 'THANK YOU FOR ORDER!' : 'THANK YOU FOR VISITING!'}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-background-card z-20 transition-transform duration-300 ${!isSidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronRight size={14} />
        </button>

        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar">
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

          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="px-4 pt-4">
              <div className="flex items-center space-x-2 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <UtensilsCrossed size={16} className="text-purple-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Waiter Panel</p>
                  <p className="text-xs font-bold text-text-primary truncate">{staff.name || 'Staff'}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            <button
              className={`w-full flex items-center rounded-xl transition-all duration-200 p-3 group relative bg-primary text-white shadow-lg shadow-primary/20 font-semibold ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
            >
              <Hash size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap flex-1 text-left ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                Tables
              </span>
            </button>
          </nav>

          <div className="p-4 border-t border-border-light">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl text-status-unavailable hover:bg-status-off/5 transition-all p-3 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`}
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap font-medium ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-[5.5rem]' : 'lg:ml-64'}`}>
        <header className="h-20 bg-background-card border-b border-border-main flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:bg-background-muted rounded-lg"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-black text-text-primary tracking-tight">Waiter Dashboard</h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest hidden sm:block">
                Table & Dine-in Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={toggleTheme} className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => fetchTables()} className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all group">
              <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-border-light">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary">{staff.name || 'User'}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">{staff.employeeId || 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/10 flex items-center justify-center text-purple-500 font-black shrink-0 text-sm">
                {staff.name?.charAt(0) || 'W'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
              <Loader size="large" />
              <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading Tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-28 h-28 bg-background-muted/50 rounded-full flex items-center justify-center border-2 border-dashed border-border-light">
                <Hash size={40} className="text-text-muted opacity-30" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-primary">No Tables Available!</h2>
                <p className="text-text-secondary font-medium mt-1">Please ask an admin to configure tables.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {tables.map((table) => {
                const isOccupied = table.status === 'occupied';
                const statusColor = isOccupied ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                const headerBg = isOccupied 
                  ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10' 
                  : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10';

                return (
                  <div key={table._id} className="bg-background-card rounded-[2rem] border border-border-light shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col group hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative">
                    <div className={`p-6 ${headerBg} border-b border-border-light/50 relative overflow-hidden`}>
                      <div className="flex justify-between items-start relative z-0">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h3 className="text-5xl font-black text-text-primary tracking-tighter leading-none">{table.tableNumber}</h3>
                            <div className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
                          </div>
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor} backdrop-blur-md`}>
                            {table.status}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-1.5 text-text-secondary bg-white/40 dark:bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                            <Users size={15} className="text-text-muted" />
                            <span className="font-extrabold text-sm">{table.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {isOccupied ? (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-[0.15em] opacity-80 mb-1">
                            <span>Active Orders ({table.activeOrders?.length || 0})</span>
                            <div className="h-[1px] flex-1 bg-border-light mx-4 opacity-50" />
                          </div>
                          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar scroll-smooth">
                            {table.activeOrders?.map(order => {
                              const isReady = order.items?.every(i => i.kitchenStatus === 'ready');
                              const currentStatus = (order.orderStatus === 'processing' && isReady) ? 'ready' : order.orderStatus;
                              const isPlaced = currentStatus === 'placed';
                              const isActiveOrder = ['processing', 'ready', 'billed'].includes(currentStatus);
                              const cardStatusStyle = isReady 
                                ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/30' 
                                : 'bg-background border-border-light/60';

                              return (
                                <div key={order._id} className={`rounded-[1.5rem] border transition-all duration-300 shadow-sm hover:shadow-md ${cardStatusStyle} group/order overflow-hidden`}>
                                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                    <div className="flex items-center gap-2.5">
                                      <button 
                                        onClick={(e) => toggleOrderExpansion(e, order._id)}
                                        className={`p-1.5 rounded-xl transition-all ${expandedOrders.includes(order._id) ? 'rotate-180 bg-primary/10 text-primary' : 'bg-background-muted text-text-muted hover:bg-primary/5 hover:text-primary'}`}
                                      >
                                        <ChevronDown size={14} strokeWidth={3} />
                                      </button>
                                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{order.orderNumber}</span>
                                    </div>
                                    {isReady && (
                                      <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ready</span>
                                      </div>
                                    )}
                                  </div>

                                  <div onClick={() => handleEditOrder(table, order)} className="flex items-center justify-between px-4 pb-4 cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                        {order.customerDetails?.name?.charAt(0) || 'C'}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[15px] font-extrabold text-text-primary truncate leading-tight">{order.customerDetails?.name || 'Walk-in'}</p>
                                        <p className="text-[11px] text-text-muted font-bold tracking-wide mt-0.5">₹{order.totalAmount} • {order.items?.length || 0} items</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 translate-x-2 group-hover/order:translate-x-0 transition-transform opacity-0 group-hover/order:opacity-100 duration-300">
                                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">View Detail</span>
                                      <ChevronRight size={18} className="text-primary" strokeWidth={3} />
                                    </div>
                                  </div>

                                  {expandedOrders.includes(order._id) && order.items && order.items.length > 0 && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-border-light/50 pt-4 bg-background-muted/30">
                                      {order.items.map((item, idx) => {
                                        const ks = item.kitchenStatus || 'placed';
                                        const ksColor = ks === 'ready' ? 'text-emerald-500' : ks === 'preparing' ? 'text-blue-500' : ks === 'delayed' ? 'text-red-500' : 'text-amber-500';
                                        const ksBg = ks === 'ready' ? 'bg-emerald-500' : ks === 'preparing' ? 'bg-blue-500' : ks === 'delayed' ? 'bg-red-500' : 'bg-amber-500';
                                        return (
                                          <div key={idx} className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded-xl border border-border-light/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                            <div className="min-w-0 flex-1 pr-4">
                                              <div className="text-[10px] font-extrabold text-text-primary truncate uppercase tracking-tight">
                                                {item.name || 'Item'} {item.size ? `(${item.size})` : ''}
                                              </div>
                                              <div className="text-[9px] font-bold text-text-muted mt-0.5">Quantity: {item.quantity}</div>
                                            </div>
                                            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${ksColor.replace('text-', 'border-').replace('500', '500/20')} ${ksColor.replace('text-', 'bg-').replace('500', '500/5')}`}>
                                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ksBg}`} />
                                              <span className={`text-[8px] font-black uppercase tracking-widest ${ksColor}`}>{ks}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {isPlaced && (
                                    <div className="px-4 pb-4 flex flex-wrap gap-3 border-t border-border-light/50 pt-4 items-center bg-amber-50/30 dark:bg-amber-950/10">
                                      <div className="flex-1 min-w-[120px] text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="flex space-x-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                                        </div>
                                        Awaiting Confirmation
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order._id, 'processing'); }}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                                      >
                                        Confirm Order
                                      </button>
                                    </div>
                                  )}

                                  {isActiveOrder && (
                                    <div className="px-4 pb-4 flex gap-2.5 border-t border-border-light/50 pt-4 items-center">
                                      <div className="relative flex-1">
                                        <select
                                          value={currentStatus}
                                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full text-[10px] font-black uppercase tracking-[0.15em] bg-background-muted/50 border border-border-light/80 rounded-xl px-3 py-2.5 text-text-primary outline-none cursor-pointer appearance-none hover:border-primary/50 transition-colors"
                                        >
                                          {currentStatus === 'processing' && (
                                            <>
                                              <option value="processing">Processing</option>
                                              <option value="cancelled">Cancelled</option>
                                            </>
                                          )}
                                          {currentStatus === 'ready' && (
                                            <>
                                              <option value="ready">Ready</option>
                                              <option value="billed">Billed</option>
                                              <option value="delivered">Delivered (Mark Paid)</option>
                                              <option value="cancelled">Cancelled</option>
                                            </>
                                          )}
                                          {currentStatus === 'billed' && (
                                            <>
                                              <option value="billed">Billed</option>
                                              <option value="delivered">Delivered (Mark Paid)</option>
                                              <option value="cancelled">Cancelled</option>
                                            </>
                                          )}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                          <ChevronDown size={12} strokeWidth={3} />
                                        </div>
                                      </div>
                                      {currentStatus === 'billed' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePrintKOT(order); }}
                                          className="p-2.5 bg-background-muted/50 text-text-secondary hover:text-primary rounded-xl transition-all border border-border-light/80 hover:border-primary/50"
                                          title="Print KOT / Bill"
                                        >
                                          <Printer size={16} strokeWidth={2.5} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-6 text-text-muted opacity-60">
                          <div className="w-16 h-16 rounded-full bg-background-muted flex items-center justify-center mb-3">
                            <Hash size={24} />
                          </div>
                          <p className="font-bold text-sm">Table is empty</p>
                          <p className="text-[10px] uppercase tracking-widest mt-1">Ready for seating</p>
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-6 pt-0">
                      <button
                        onClick={() => handleTakeOrder(table)}
                        className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-3 rounded-xl font-bold transition-colors text-sm shadow-md shadow-primary/20"
                      >
                        <ShoppingCart size={16} />
                        <span>Add Customer Order</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <DineInPOSModal 
        isOpen={isPOSModalOpen} 
        onClose={() => setIsPOSModalOpen(false)} 
        table={selectedTable} 
        fetchTables={fetchTables} 
        editingOrder={selectedOrderForEdit}
      />


    </div>
  );
};

export default WaiterDashboard;
