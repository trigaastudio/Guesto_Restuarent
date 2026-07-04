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
import CardSkeleton from '../../components/Skeleton/CardSkeleton';
import DineInPOSModal from '../../components/POS/DineInPOSModal';
import { logoutStaff } from '../../utils/auth';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'https://guest-o-backend.onrender.com';

const WaiterDashboard = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [selectedOrderSeats, setSelectedOrderSeats] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [selectedViewTableId, setSelectedViewTableId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedMergeTableNumbers, setSelectedMergeTableNumbers] = useState([]);

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


    socketRef.current = io(SOCKET_URL, { withCredentials: true });


    socketRef.current.on('ordersUpdated', () => {
      fetchTables(true);
    });


    socketRef.current.on('tablesUpdated', () => {
      fetchTables(true);
    });

    const handleDbChange = (event) => {
      const data = event.detail;

      if (['Table', 'tables', 'Order', 'orders'].includes(data.collection)) {
        fetchTables(true);
      }
    };
    window.addEventListener('db_change', handleDbChange);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      window.removeEventListener('db_change', handleDbChange);
    };
  }, []);

  const getComputedOrderStatus = (order) => {
    if (!order) return '';
    let actualStatus = order.orderStatus;
    const isReady = order.items?.length > 0 && order.items.every(i => i.kitchenStatus === 'ready');
    if (actualStatus === 'placed' && order.items?.some(i => ['preparing', 'ready'].includes(i.kitchenStatus))) {
      actualStatus = 'processing';
    }
    return (actualStatus === 'processing' && isReady) ? 'ready' : actualStatus;
  };


  const handleLogout = () => {
    logoutStaff(navigate);
  };

  const handleTakeOrder = async (table) => {
    const capacity = table.capacity || 4;
    const currentOccupied = table.occupiedSeats || 0;
    const remainingSeats = capacity - currentOccupied;

    if (remainingSeats <= 0) {
      Swal.fire({
        title: '<div style="font-size:20px; font-weight:800; color:var(--color-text-primary);">Table is Fully Seated</div>',
        text: 'All seats on this table are currently occupied.',
        icon: 'warning',
        confirmButtonColor: 'var(--color-primary)'
      });
      return;
    }

    const result = await Swal.fire({
      title: '<div style="font-size:24px; font-weight:900; color:var(--color-text-primary); letter-spacing:-0.5px; margin-bottom:4px; font-family:\'Inter\', sans-serif;">Guest Count</div>',
      html: `
        <div style="font-size:11px; font-weight:800; color:var(--color-primary); margin-bottom:24px; text-transform:uppercase; letter-spacing:1.5px; background: rgba(185, 28, 28, 0.05); padding: 6px 14px; display:inline-block; border: 1px solid rgba(185, 28, 28, 0.1); border-radius: 9999px;">
          Table Capacity: ${capacity} Guests
        </div>
        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:15px;">
          ${Array.from({ length: capacity }, (_, i) => i + 1).map(num => {
        const isOccupied = num <= currentOccupied;
        if (isOccupied) {
          return `
                <button 
                  disabled
                  style="width: 54px; height: 54px; border-radius: 16px; border: 2px dashed rgba(156, 163, 175, 0.3); background: var(--color-background-muted); color: #9ca3af; font-size: 18px; font-weight: 900; cursor: not-allowed; opacity: 0.65; position: relative;"
                  title="Already occupied"
                >
                  ${num}
                </button>
              `;
        } else {
          return `
                <button 
                  id="swal-seat-btn-${num}" 
                  onclick="window.selectSwalSeats(${num})"
                  style="width: 54px; height: 54px; border-radius: 16px; border: 2px solid var(--color-border); background: var(--color-background-card); color: var(--color-text-primary); font-size: 18px; font-weight: 900; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.02);"
                  onmouseover="this.style.transform='scale(1.08)'; this.style.borderColor='var(--color-primary)';"
                  onmouseout="if(!window.clickedSeatIndex || window.clickedSeatIndex < ${num}) { this.style.transform='scale(1)'; this.style.borderColor='var(--color-border)'; }"
                >
                  ${num}
                </button>
              `;
        }
      }).join('')}
        </div>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Confirm',
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: '#9ca3af',
      customClass: {
        popup: 'rounded-3xl border border-border-light shadow-2xl p-6 bg-white dark:bg-gray-900',
        confirmButton: 'px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-primary hover:bg-primary-light shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-300',
        cancelButton: 'px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-text-secondary bg-background-muted hover:bg-background-card border border-border-light hover:-translate-y-0.5 transition-all duration-300'
      },
      didOpen: () => {
        window.selectedSwalSeatsVal = 0;
        window.clickedSeatIndex = 0;

        window.selectSwalSeats = (num) => {
          window.selectedSwalSeatsVal = num - currentOccupied;
          window.clickedSeatIndex = num;

          for (let i = currentOccupied + 1; i <= capacity; i++) {
            const btn = document.getElementById(`swal-seat-btn-${i}`);
            if (btn) {
              if (i <= num) {
                btn.style.background = 'var(--color-primary)';
                btn.style.borderColor = 'var(--color-primary)';
                btn.style.color = '#ffffff';
                btn.style.transform = 'scale(1.08)';
                btn.style.boxShadow = '0 10px 20px -3px rgba(185, 28, 28, 0.35)';
              } else {
                btn.style.background = 'var(--color-background-card)';
                btn.style.borderColor = 'var(--color-border)';
                btn.style.color = 'var(--color-text-primary)';
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
              }
            }
          }
        };
      },
      preConfirm: () => {
        if (!window.selectedSwalSeatsVal || window.selectedSwalSeatsVal === 0) {
          Swal.showValidationMessage('Please select the guest count');
          return false;
        }
        return window.selectedSwalSeatsVal;
      }
    });

    if (result.isConfirmed) {
      const selectedSeats = result.value;
      setSelectedOrderForEdit(null);
      setSelectedOrderSeats(selectedSeats);
      setSelectedTable(table);
      setIsPOSModalOpen(true);
    }
  };

  const handleEditOrder = (table, order) => {
    setSelectedTable(table);
    setSelectedOrderForEdit(order);
    setIsPOSModalOpen(true);
  };

  const handleStartMergeMode = () => {
    setIsMergeMode(true);
    setSelectedMergeTableNumbers([]);
    showToast('info', 'Select tables to merge and click "Merge Selected"');
  };

  const handleCancelMerge = () => {
    setIsMergeMode(false);
    setSelectedMergeTableNumbers([]);
  };

  const handleSaveMerge = async () => {
    if (selectedMergeTableNumbers.length < 2) return;
    setIsLoading(true);
    try {
      await api.post('/api/tables/coshare-merge', { tableNumbers: selectedMergeTableNumbers });
      showToast('success', `Tables ${selectedMergeTableNumbers.join(', ')} merged successfully!`);
      await fetchTables();
      setIsMergeMode(false);
      setSelectedMergeTableNumbers([]);
    } catch (error) {
      console.error('Error merging tables:', error);
      showToast('error', error.response?.data?.message || 'Failed to merge tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmerge = async (tableNumber) => {
    const confirmResult = await Swal.fire({
      title: '<div style="font-size:20px; font-weight:800; color:var(--color-text-primary); letter-spacing:-0.5px;">Unmerge Tables?</div>',
      text: `Are you sure you want to split and unmerge Table ${tableNumber} and its grouped tables?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Unmerge',
      cancelButtonText: 'Cancel',
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: '#9ca3af',
      customClass: {
        popup: 'rounded-3xl border border-border-light shadow-2xl p-6 bg-white dark:bg-gray-900',
        confirmButton: 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-primary hover:bg-primary-light transition-all',
        cancelButton: 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-text-secondary bg-background-muted border border-border-light transition-all'
      }
    });

    if (confirmResult.isConfirmed) {
      setIsLoading(true);
      try {
        await api.post('/api/tables/coshare-unmerge', { tableNumber });
        showToast('success', 'Tables successfully unmerged!');
        await fetchTables();
        setSelectedViewTableId(null);
      } catch (error) {
        console.error('Error unmerging tables:', error);
        showToast('error', error.response?.data?.message || 'Failed to unmerge tables');
      } finally {
        setIsLoading(false);
      }
    }
  };



  const toggleOrderExpansion = (e, orderId) => {
    e.stopPropagation();
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, forceSilent = false) => {
    try {
      const updateData = { orderStatus: newStatus };
      const orderToUpdate = tables.flatMap(t => t.activeOrders || []).find(o => o._id === orderId);

      if (forceSilent) {
        updateData.paymentStatus = 'paid';
        updateData.paymentMethod = 'cash';
      }

      if (newStatus === 'delivered' && orderToUpdate?.paymentStatus !== 'paid' && !forceSilent) {
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
                        changeEl.textContent = '₹' + (received - total).toFixed(0);
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
                Swal.showValidationMessage('Cash received is less than total order amount (₹' + total.toFixed(0) + ')');
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


    const aggregatedItems = [];
    order.items.forEach(item => {
      const itemId = item.menuItem?._id || item.menuItem;
      const itemName = item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item');
      const size = item.size || 'Standard';

      const existing = aggregatedItems.find(
        x => ((x.menuItem?._id || x.menuItem) === itemId || x.name === itemName) && x.size === size
      );

      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.totalPrice || ((item.unitPrice || item.price || 0) * item.quantity);
      } else {
        aggregatedItems.push({
          ...item,
          name: itemName,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || ((item.unitPrice || item.price || 0) * item.quantity)
        });
      }
    });

    const itemsHtml = aggregatedItems.map(item => {
      const name = item.name;
      const unitPrice = item.unitPrice;
      const totalPrice = item.totalPrice;
      return `
      <tr>
        <td colspan="4" style="text-transform: uppercase; font-weight: bold; padding-top: 8px;">${name} (${item.size})</td>
      </tr>
      ${item.bogoItem && (item.menuItem?.variants || item.menuItem?.sizes || [])?.find(v => (v.size || 'Standard') === (item.size || 'Standard'))?.isBOGO ? `
      <tr>
        <td colspan="4" style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: #000; padding-left: 10px;">
          * FREE: ${item.bogoItem.name || 'Free Item'} ${item.bogoItem.size ? `(${item.bogoItem.size})` : ''} x ${item.bogoItem.quantity || 1}
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="width: 40%;"></td>
        <td style="width: 15%; text-align: left;">${item.quantity} P</td>
        <td style="width: 20%; text-align: right;">${unitPrice.toFixed(0)}</td>
        <td style="width: 25%; text-align: right;">${totalPrice.toFixed(0)}</td>
      </tr>
    `;
    }).join('');

    // Dynamic settings for Bill
    const restaurantName = settings?.restaurantDetails?.name || 'GUESTO RESTAURENT';
    const restaurantAddress = settings?.restaurantDetails?.address || 'Chammannur,Athirthi';
    const restaurantPhone = settings?.restaurantDetails?.contactNumber || '7034805085';
    const monochromeLogo = settings?.branding?.logoMonochrome || null;


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
            <span>${(order.totalAmount || order.subtotal || 0).toFixed(0)}</span>
          </div>
          ${order.paidAmount > 0 && (order.totalAmount || order.subtotal) > order.paidAmount ? `
            <div style="font-size: 13px; font-weight: bold; margin-top: 5px; display: flex; justify-content: space-between;">
              <span>PAID AMOUNT:</span>
              <span>₹${order.paidAmount.toFixed(0)}</span>
            </div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 3px; display: flex; justify-content: space-between; border: 1px solid #000; padding: 4px;">
              <span>BALANCE DUE:</span>
              <span>₹${((order.totalAmount || order.subtotal) - order.paidAmount).toFixed(0)}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="payment-info">
            ${order.paymentMethod === 'cash' ? `
              <div style="display: flex; justify-content: space-between;">
                <span>CASH RECEIVED :</span>
                <span>${(order.cashReceived || order.totalAmount || order.subtotal || 0).toFixed(0)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 3px;">
                <span>CHANGE :</span>
                <span>${(order.balance || 0).toFixed(0)}</span>
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
              <div class="qr-label">${settings?.printingSettings?.kotQRCodeType === 'upi' ? 'Scan to Pay' : 'Scan to Pay'}</div>
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
      { }
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="h-14 sm:h-20 bg-background-card border-b border-border-main flex items-center justify-between px-3 sm:px-4 lg:px-8 shrink-0 overflow-hidden">

          {/* LEFT — Mobile: icon + title only | Desktop: logo + divider + title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">

            {/* Logo — hidden on mobile, shown on sm+ */}
            <img
              src={isDarkMode ? (settings?.branding?.logoGold || '/logo-golden.png') : (settings?.branding?.logoDark || '/logo-dark.png')}
              alt="Logo"
              className="hidden sm:block h-10 w-auto transition-all duration-500 shrink-0"
            />

            {/* Mobile icon badge instead of logo */}
            <div className="sm:hidden w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <UtensilsCrossed size={16} className="text-primary" />
            </div>

            <div className="border-l border-border-light pl-2 sm:pl-4 min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-text-primary tracking-tight leading-none">Waiter</h1>
              <p className="text-[9px] sm:text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 hidden sm:block">
                Table & Dine-in Management
              </p>
            </div>
          </div>

          {/* RIGHT — Mobile: compact icons only | Desktop: full with name/ID */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">

            {/* Theme */}
            <button onClick={toggleTheme} className="p-1.5 sm:p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all" title="Toggle theme">
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Refresh */}
            <button onClick={() => fetchTables()} className="p-1.5 sm:p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all group" title="Refresh">
              <RefreshCw size={17} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            </button>

            {/* Staff — name+ID hidden on mobile, only avatar shown */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border-light ml-1">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary leading-tight">{staff.name || 'User'}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider leading-tight">{staff.employeeId || 'Staff'}</p>
              </div>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center text-purple-500 font-black shrink-0 text-xs">
                {staff.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-status-unavailable hover:bg-status-off/5 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
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
          ) : selectedViewTableId ? (
            (() => {
              const currentTable = tables.find(t => t._id === selectedViewTableId);
              if (!currentTable) {
                setSelectedViewTableId(null);
                return null;
              }
              const isOccupied = currentTable.status === 'occupied';

              return (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                  { }
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setSelectedViewTableId(null)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-background-card hover:bg-background-muted border border-border-light rounded-xl transition-all text-text-secondary hover:text-primary shadow-sm font-bold text-xs uppercase tracking-wider group"
                    >
                      <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16} strokeWidth={3} />
                      <span>Back to Tables</span>
                    </button>

                    <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] bg-background-muted/80 px-4 py-2 rounded-full border border-border-light">
                      Dine-in Console
                    </span>
                  </div>

                  { }
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    { }
                    <div className="lg:col-span-4 bg-background-card border border-border-light rounded-[2.5rem] p-6 lg:p-8 shadow-md flex flex-col items-center relative overflow-hidden">
                      { }
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-light/5 rounded-full blur-3xl pointer-events-none" />

                      <div className="w-full aspect-[4/3] max-w-[200px] mb-6 flex items-center justify-center p-2 relative bg-background-muted/30 rounded-3xl border border-border-light/60 overflow-hidden shadow-inner group">
                        <img
                          src="/table_pic.png"
                          alt={`Table ${currentTable.tableNumber}`}
                          className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="text-center w-full mb-6">
                        <h2 className="text-3xl font-black text-text-primary tracking-tight">Table {currentTable.tableNumber}</h2>
                        {currentTable.mergedGroup && currentTable.mergedGroup.length > 0 && (
                          <div className="mt-2 flex flex-col items-center gap-2 animate-in fade-in duration-300">
                            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 rounded-2xl border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                              <GitMerge size={12} strokeWidth={3} />
                              <span>Merged Group ({currentTable.mergedGroup.join(" + ")})</span>
                            </div>
                            <button onClick={() => handleUnmerge(currentTable.tableNumber)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-wider border border-red-500/20 transition-all active:scale-95">
                              Unmerge Tables
                            </button>
                          </div>
                        )}

                        {(() => {
                          const curCapacity = currentTable.capacity || 4;
                          const curOccupied = currentTable.occupiedSeats || 0;
                          const isCurFullyOccupied = curOccupied >= curCapacity;
                          const isCurPartiallyOccupied = curOccupied > 0 && curOccupied < curCapacity;

                          return (
                            <div className="flex flex-col items-center mt-3 space-y-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isCurFullyOccupied
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : isCurPartiallyOccupied
                                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${isCurFullyOccupied ? 'bg-red-500' : isCurPartiallyOccupied ? 'bg-amber-500' : 'bg-emerald-500'
                                  } animate-pulse`} />
                                {isCurFullyOccupied ? 'Fully Seated' : isCurPartiallyOccupied ? 'Partially Occupied' : 'Available'}
                              </span>

                              { }
                              <div className="w-full max-w-[240px] mt-4">
                                <div className="flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                                  <span>Seating Status</span>
                                  <span>{curOccupied} / {curCapacity} Seats</span>
                                </div>
                                <div className="w-full h-2.5 bg-background-muted rounded-full overflow-hidden border border-border-light shadow-inner">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isCurFullyOccupied ? 'bg-red-500' : isCurPartiallyOccupied ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                    style={{ width: `${(curOccupied / curCapacity) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="w-full border-t border-border-light pt-6 space-y-3">

                        <button
                          onClick={() => handleTakeOrder(currentTable)}
                          disabled={currentTable.activeOrders?.length >= 4}
                          className={`w-full flex items-center justify-center space-x-2.5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${currentTable.activeOrders?.length >= 4
                            ? 'bg-background-muted border border-border-light text-text-muted cursor-not-allowed opacity-60'
                            : 'bg-primary hover:bg-primary-light text-white shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-98'
                            }`}
                          title={currentTable.activeOrders?.length >= 4 ? "Maximum 4 orders allowed per table" : ""}
                        >
                          <Plus size={18} strokeWidth={2.5} />
                          <span>{currentTable.activeOrders?.length >= 4 ? 'Table Full' : 'Create Order'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Active Orders Area */}
                    <div className="lg:col-span-8 bg-background-card border border-border-light rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 lg:p-8 flex flex-col min-h-[55vh]">
                      {isOccupied ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                          <div className="flex items-center justify-between text-[11px] font-black text-text-muted uppercase tracking-[0.2em] opacity-90 border-b border-border-light pb-4">
                            <span>Active Orders ({currentTable.activeOrders?.length || 0})</span>
                            <span className="text-[10px] text-primary lowercase tracking-normal bg-primary/5 px-2.5 py-0.5 rounded-full font-bold">co-sharing enabled</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentTable.activeOrders?.map(order => {
                              const currentStatus = getComputedOrderStatus(order);
                              const isReady = currentStatus === 'ready';
                              const isWaitingApproval = currentStatus === 'placed';
                              const isPreparing = currentStatus === 'processing';
                              const cardStatusStyle = isReady
                                ? 'bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-background border-border-light/60';

                              return (
                                <div
                                  key={order._id}
                                  onClick={() => {
                                    setSelectedTable(currentTable);
                                    setSelectedOrderForView(order);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  className={`rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-lg ${cardStatusStyle} group/order overflow-hidden flex flex-col cursor-pointer hover:border-primary/30`}
                                >
                                  <div className="flex items-center justify-between px-5 pt-5 pb-2">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs md:text-sm font-black text-primary uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-full">{order.orderNumber?.toUpperCase()}</span>
                                    </div>
                                    {isReady ? (
                                      <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                        <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
                                        <span className="text-[10px] md:text-xs font-black text-emerald-500 capitalize tracking-wider">Ready</span>
                                      </div>
                                    ) : isWaitingApproval ? (
                                      <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                        <div className="flex space-x-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                                        </div>
                                        <span className="text-[10px] md:text-xs font-black text-amber-500 capitalize tracking-wider">Waiting Approval</span>
                                      </div>
                                    ) : isPreparing ? (
                                      <div className="flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full">
                                        <div className="flex space-x-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        </div>
                                        <span className="text-[10px] md:text-xs font-black text-blue-500 capitalize tracking-wider">Preparing</span>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center justify-between px-5 pb-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-lg shrink-0 shadow-sm border border-primary/10">
                                        {order.customerDetails?.name?.charAt(0) || 'C'}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-base md:text-lg font-extrabold text-text-primary truncate leading-tight">{order.customerDetails?.name || 'Walk-in'}</p>
                                        <p className="text-xs md:text-sm text-text-muted font-bold tracking-wide mt-0.5">₹{Math.round(order.totalAmount || 0)} • {order.items?.length || 0} items</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-5 pb-4 space-y-2 border-t border-border-light/50 pt-4 bg-background-muted/30 flex-1">
                                    {order.items && order.items.slice(0, 3).map((item, idx) => {
                                      const ks = item.kitchenStatus || 'placed';
                                      const ksColor = ks === 'ready' ? 'text-emerald-500' : ks === 'preparing' ? 'text-blue-500' : ks === 'delayed' ? 'text-red-500' : 'text-amber-500';
                                      const ksBg = ks === 'ready' ? 'bg-emerald-500' : ks === 'preparing' ? 'bg-blue-500' : ks === 'delayed' ? 'bg-red-500' : 'bg-amber-500';
                                      const isLastSlotAndMore = idx === 2 && order.items.length > 3;

                                      return (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-black/20 p-2.5 rounded-xl border border-border-light/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-[52px]">
                                          <div className="min-w-0 flex-1 pr-2 pl-1">
                                            <div className="text-xs md:text-sm font-extrabold text-text-primary truncate capitalize tracking-normal flex items-center gap-1.5">
                                              <span className="line-clamp-2 leading-tight">{item.name || 'Item'} {item.size ? `(${item.size})` : ''}</span>
                                              {isLastSlotAndMore && (
                                                <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                                                  +{order.items.length - 3} more
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] md:text-xs font-bold text-text-muted mt-0.5">Quantity: {item.quantity}</div>
                                          </div>
                                          <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border ${ksColor.replace('text-', 'border-').replace('500', '500/30')} ${ksColor.replace('text-', 'bg-').replace('500', '500/10')} shrink-0`}>
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ksBg}`} />
                                            <span className={`text-[10px] md:text-xs font-black capitalize tracking-wider ${ksColor}`}>{ks}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-10 animate-in fade-in duration-500 my-auto">
                          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
                            <CheckCircle2 size={32} strokeWidth={2.5} />
                          </div>
                          <h3 className="text-2xl font-black text-text-primary tracking-tight mb-2">
                            Table is Vacant
                          </h3>
                          <p className="text-sm font-bold text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
                            There are currently no active orders on this table. Seating capacity is completely vacant and available for guest seating.
                          </p>
                          <button
                            onClick={() => handleTakeOrder(currentTable)}
                            className="flex items-center space-x-2.5 bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-98"
                          >
                            <ShoppingCart size={18} strokeWidth={2.5} />
                            <span>Start Serving Guests</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-6">
              { }
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-card border border-border-light rounded-3xl p-5 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-text-primary tracking-tight">
                    {isMergeMode ? 'Merge Tables Mode' : 'Select a Table to Manage'}
                  </h2>
                  <p className="text-xs font-bold text-text-secondary mt-1">
                    {isMergeMode
                      ? 'Select multiple tables below to link them in a shared dining group.'
                      : 'Select any table to view orders, seat guests, or manage table status.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isMergeMode ? (
                    <>
                      <button
                        onClick={handleCancelMerge}
                        className="px-5 py-2.5 bg-background border border-border-light text-text-secondary hover:text-primary hover:bg-background-muted rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMerge}
                        disabled={selectedMergeTableNumbers.length < 2}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all shadow-md ${selectedMergeTableNumbers.length < 2
                          ? 'bg-background-muted text-text-muted border border-border-light cursor-not-allowed opacity-60'
                          : 'bg-primary hover:bg-primary-light shadow-primary/25'
                          }`}
                      >
                        Merge Selected ({selectedMergeTableNumbers.length})
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStartMergeMode}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
                    >
                      <GitMerge size={14} strokeWidth={3} />
                      <span>Merge Tables</span>
                    </button>
                  )}
                </div>
              </div>

              { }
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {(() => {
                  const displayTables = tables.filter(table => {
                    if (table.mergedGroup && table.mergedGroup.length > 0) {
                      const sortedGroup = [...table.mergedGroup].sort((a, b) => parseInt(a) - parseInt(b));
                      return table.tableNumber.toString() === sortedGroup[0].toString();
                    }
                    return true;
                  });

                  return displayTables.map((table) => {
                    const isOccupied = table.status === 'occupied';
                    const isSelectedForMerge = isMergeMode && selectedMergeTableNumbers.includes(table.tableNumber);
                    const hasMergedGroup = table.mergedGroup && table.mergedGroup.length > 0;

                    return (
                      <div
                        key={table._id}
                        onClick={() => {
                          if (isMergeMode) {
                            if (table.occupiedSeats > 0) {
                              showToast('warning', 'Only available tables can be selected for merging.');
                              return;
                            }
                            setSelectedMergeTableNumbers(prev =>
                              prev.includes(table.tableNumber)
                                ? prev.filter(num => num !== table.tableNumber)
                                : [...prev, table.tableNumber]
                            );
                          } else {
                            setSelectedViewTableId(table._id);
                          }
                        }}
                        className={`relative cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-md bg-white dark:bg-gray-900 transition-all duration-300 ${isSelectedForMerge
                          ? 'border-2 border-primary ring-4 ring-primary/10 scale-[1.02] shadow-lg'
                          : isMergeMode && table.occupiedSeats > 0
                            ? 'border border-border-light opacity-60 cursor-not-allowed grayscale'
                            : 'border border-border-light hover:-translate-y-0.5 active:scale-98'
                          }`}
                      >
                        { }
                        {isSelectedForMerge && (
                          <div className="absolute top-3.5 left-3.5 bg-primary text-white p-1.5 rounded-xl z-20 shadow-md flex items-center justify-center animate-in zoom-in-50 duration-200">
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                        )}

                        <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-950 flex items-center justify-center p-2">
                          <img
                            src="/table_pic.png"
                            alt={`Table ${table.tableNumber}`}
                            className="w-full h-full object-contain drop-shadow-lg"
                          />
                        </div>

                        { }
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
                          {hasMergedGroup && (
                            <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20 text-[9px] font-black uppercase tracking-wider">
                              <GitMerge size={10} strokeWidth={3} />
                              <span>Merged</span>
                            </div>
                          )}
                          {(() => {
                            const capacity = table.capacity || 4;
                            const occupied = table.occupiedSeats || 0;
                            const isFullyOccupied = occupied >= capacity;
                            const isPartiallyOccupied = occupied > 0 && occupied < capacity;
                            return (
                              <div className={`w-3 h-3 rounded-full ${isFullyOccupied
                                ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                                : isPartiallyOccupied
                                  ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.85)]'
                                  : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.85)]'
                                } animate-pulse border-2 border-white/80`} />
                            );
                          })()}
                        </div>

                        { }
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-0.5">
                                {hasMergedGroup ? 'Tables' : 'Table'}
                              </p>
                              <h3 className="text-3xl font-black text-white drop-shadow-md leading-none">
                                {hasMergedGroup ? [...table.mergedGroup].sort((a, b) => parseInt(a) - parseInt(b)).join(' & ') : table.tableNumber}
                              </h3>
                              <p className="text-white/85 text-[11px] font-bold mt-2 flex items-center gap-1.5">
                                <Users size={12} className="opacity-80" /> {table.capacity} Seats
                              </p>
                            </div>
                            {(() => {
                              const capacity = table.capacity || 4;
                              const occupied = table.occupiedSeats || 0;
                              const isFullyOccupied = occupied >= capacity;
                              const isPartiallyOccupied = occupied > 0 && occupied < capacity;
                              const isFree = occupied === 0;

                              if (isFullyOccupied) {
                                return (
                                  <div className="bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl backdrop-blur-sm shadow-md">
                                    Fully Seated
                                  </div>
                                );
                              } else if (isPartiallyOccupied) {
                                const remaining = capacity - occupied;
                                return (
                                  <div className="bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl backdrop-blur-sm shadow-md">
                                    {remaining} Seat{remaining > 1 ? 's' : ''} Available
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl backdrop-blur-sm shadow-md">
                                    Available
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                })()}
              </div>
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
        orderSource={staff.role || "waiter"}
        occupiedSeats={selectedOrderSeats}
      />

      {isDetailsModalOpen && selectedOrderForView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => {
            setIsDetailsModalOpen(false);
            setSelectedOrderForView(null);
          }}></div>
          <div className="bg-background-card w-full max-w-lg max-h-[80vh] rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
            {/* Header */}
            <div className="p-6 border-b border-border-light flex justify-between items-center bg-background-card">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">Order Details</h3>
                <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
                  {selectedOrderForView.orderNumber?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedOrderForView(null);
                }}
                className="p-2 bg-background-muted text-text-muted hover:text-primary rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-background">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-card p-4 rounded-2xl border border-border-light">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Customer</p>
                  <p className="font-extrabold text-text-primary text-base">
                    {selectedOrderForView.customerDetails?.name || 'Walk-in'}
                  </p>
                </div>
                <div className="bg-background-card p-4 rounded-2xl border border-border-light">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Order Status</p>
                  {(() => {
                    const status = getComputedOrderStatus(selectedOrderForView);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-1 ${status === 'completed' || status === 'delivered' || status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : status === 'placed'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                        {status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              { }
              <div className="space-y-3">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Items, Quantity & Status</p>
                <div className="space-y-2">
                  {selectedOrderForView.items?.map((item, idx) => {
                    const ks = item.kitchenStatus || 'placed';
                    const ksColor = ks === 'ready' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : ks === 'preparing' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' : ks === 'delayed' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10';
                    const ksBg = ks === 'ready' ? 'bg-emerald-500' : ks === 'preparing' ? 'bg-blue-500' : ks === 'delayed' ? 'bg-red-500' : 'bg-amber-500';
                    return (
                      <div key={idx} className="flex justify-between items-center bg-background-card p-4 rounded-2xl border border-border-light shadow-sm">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-extrabold text-text-primary text-sm truncate capitalize">
                            {item.name || 'Item'} {item.size ? `(${item.size})` : ''}
                          </p>
                          <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-wider">
                            Quantity: {item.quantity}
                          </p>

                          {/* Combo Items */}
                          {item.comboItems?.length > 0 && (
                            <div className="mt-1.5 pl-2 border-l border-primary/30">
                              <span className="text-[9px] font-black text-primary uppercase tracking-wider block mb-0.5">Combo includes:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.comboItems.map((ci, cIdx) => (
                                  <span key={cIdx} className="inline-flex items-center text-text-muted text-[10px] font-bold">
                                    {ci.quantity || 1}x {ci.menuItem?.name || ci.name || 'Combo Item'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          { }
                          {item.includedItems?.length > 0 && (
                            <div className="mt-1.5 pl-2 border-l border-primary/30">
                              <span className="text-[9px] font-black text-primary uppercase tracking-wider block mb-0.5">Includes Add-ons:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.includedItems.map((ii, iIdx) => (
                                  <span key={iIdx} className="inline-flex items-center text-text-muted text-[10px] font-bold">
                                    {ii.quantity || 1}x {ii.menuItem?.name || ii.name || 'Add-on'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border ${ksColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ksBg}`} />
                          <span className="text-xs font-black capitalize tracking-wider">{ks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            { }
            <div className="p-6 bg-background-card border-t border-border-light flex justify-between items-center shrink-0 gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedOrderForEdit(selectedOrderForView);
                    setIsPOSModalOpen(true);
                  }}
                  className="px-4 py-3 bg-background border border-border-light text-text-primary hover:text-primary hover:border-primary/50 hover:bg-primary/5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Item</span>
                </button>
                <button
                  onClick={() => {
                    handlePrintKOT(selectedOrderForView);
                    if (selectedOrderForView.orderStatus !== 'delivered') {
                      handleUpdateOrderStatus(selectedOrderForView._id, 'billed', false);
                    }
                    setIsDetailsModalOpen(false);
                  }}
                  title="Print Bill"
                  className="px-4 py-3 bg-background border border-border-light text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <span>Print</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedOrderForView(null);
                }}
                className="px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-md shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default WaiterDashboard;
