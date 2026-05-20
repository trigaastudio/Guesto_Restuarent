import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, Eye, Trash2, Clock, Edit2,
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowUpDown,
  ShoppingCart, User, Phone, CreditCard, ChevronRight,
  MoreVertical, Printer, Package, Utensils, RotateCcw,
  Copy, MapPin, ExternalLink, Minus, Truck, X, ChevronLeft,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import Swal from 'sweetalert2';
import Loader from '../../../components/Loader/Loader';
import Pagination from '../../../components/Pagination/Pagination';
import TableSection from './TableSection';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

const OrderSection = () => {
  const handleCopyForWhatsApp = (order) => {
    // Support both items structures
    const itemsText = order.items.map(item => {
      const name = item.name || (item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Menu Item');
      const price = item.unitPrice || item.price || 0;
      return `- ${name} (${item.size}) x${item.quantity}`;
    }).join('\n');

    // Support both customerDetails and address structures
    const name = (order.orderSource === 'online' || order.orderSource === 'user')
      ? (order.address?.recipientName || order.customerDetails?.name || 'Walk-in')
      : (order.customerDetails?.name || order.address?.recipientName || 'Walk-in');
    const phone = order.customerDetails?.phone || order.address?.mobile || 'N/A';
    const address = order.customerDetails?.address || order.address?.address || 'N/A';
    const location = order.customerDetails?.location || order.address?.location;

    // Construct location URL if it's an object or already a string
    let locationUrl = '';
    const locToUse = location || address; 
    
    if (typeof location === 'object' && location?.lat) {
      locationUrl = `\n📍 *Location:* https://www.google.com/maps?q=${location.lat},${location.lng}`;
    } else if (typeof locToUse === 'string' && locToUse && locToUse !== 'N/A') {
      const urlMatch = locToUse.match(/https?:\/\/[^\s]+/);
      locationUrl = urlMatch 
        ? `\n📍 *Location:* ${urlMatch[0]}` 
        : `\n📍 *Location:* https://www.google.com/maps?q=${encodeURIComponent(locToUse)}`;
    }

    const text = `*ORDER: ${order.orderNumber}*\n` +
      `--------------------------\n` +
      `👤 *Customer:* ${name}\n` +
      `📞 *Phone:* ${phone}\n` +
      `🏠 *Address:* ${address}\n` +
      `--------------------------\n` +
      `📦 *Items:*\n${itemsText}\n` +
      `--------------------------\n` +
      `💰 *Total:* ₹${order.totalAmount}\n` +
      `💳 *Payment:* ${order.paymentMethod?.toUpperCase()} (${order.paymentStatus?.toUpperCase()})\n` +
      locationUrl;

    navigator.clipboard.writeText(text);
    showToast('success', 'Copied for WhatsApp!');
  };

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('orderSearchTerm') || '');
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState(localStorage.getItem('orderStatusFilter') || 'all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(localStorage.getItem('orderActiveTab') === 'all' ? 'takeaway' : (localStorage.getItem('orderActiveTab') || 'takeaway'));
  const [historyOrderTypeFilter, setHistoryOrderTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('orderActiveTab', tab);
    setSelectedOrderIds([]); // Reset selection on tab change
    setCurrentPage(1); // Reset pagination on tab change
  };
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // POS State
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [posOrderType, setPosOrderType] = useState('takeaway');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [updateProfile, setUpdateProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    fetchOrders();
    fetchMenu();

    // Socket Setup for Real-time updates
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('ordersUpdated', () => {
      fetchOrders(true);
    });
    socketRef.current.on('newOrder', () => {
      fetchOrders(true);
    });

    // Polling fallback every 30 seconds
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 30000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

    if (showQR && settings.printingSettings.kotQRCodeImage) {
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
              <div class="qr-label">${settings.printingSettings.kotQRCodeType === 'upi' ? 'Scan to Pay' : 'Scan for Info'}</div>
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

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) showToast('error', 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async (ids = null) => {
    const isManualSelection = Array.isArray(ids);
    const title = isManualSelection ? `Clear ${ids.length} Selected Orders?` : 'Clear History?';
    const text = isManualSelection
      ? `This will permanently delete the ${ids.length} marked orders from the database.`
      : `This will permanently delete all history orders matching current filters from the database.`;

    const result = await showDeleteConfirmation(title, text);
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/orders/clear-history`, {
          params: {
            orderType: historyOrderTypeFilter,
            startDate,
            endDate,
            ids: isManualSelection ? ids.join(',') : undefined
          }
        });
        if (response.data.success) {
          showToast('success', response.data.message);
          setSelectedOrderIds([]);
        }
      } catch (error) {
        showToast('error', 'Failed to clear history');
      }
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/menus`);
      setMenuItems(response.data.filter(m => !m.isBlocked));
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showToast('warning', 'Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update customer profile if requested
      if (updateProfile && selectedUserId) {
        const currentUserData = allUsers.find(u => u._id === selectedUserId);
        if (currentUserData) {
          const newAddresses = [...(currentUserData.addresses || [])];
          const defaultIdx = newAddresses.findIndex(a => a.isDefault);

          if (defaultIdx > -1) {
            // Update existing default
            newAddresses[defaultIdx] = {
              ...newAddresses[defaultIdx],
              address: deliveryAddress,
              location: deliveryLocation
            };
          } else if (newAddresses.length > 0) {
            // No default, update first one
            newAddresses[0] = { ...newAddresses[0], address: deliveryAddress, location: deliveryLocation, isDefault: true };
          } else {
            // No addresses at all, add first one
            newAddresses.push({ address: deliveryAddress, location: deliveryLocation, type: 'home', isDefault: true });
          }

          await axios.put(`${API_BASE_URL}/users/${selectedUserId}`, {
            addresses: newAddresses
          });
        }
      }

      const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

      if (selectedOrder) {
        // Full Edit mode (replaces items)
        const response = await axios.patch(`${API_BASE_URL}/orders/${selectedOrder._id}/items`, {
          items: cart,
          cashReceived: parseFloat(cashReceived) || selectedOrder.cashReceived || 0,
          deliveryAddress: deliveryAddress,
          deliveryLocation: deliveryLocation,
          customerDetails: customer
        });
        if (response.data.success) {
          showToast('success', 'Order updated successfully');
          setIsModalOpen(false);
          setCart([]);
          setSelectedOrder(response.data.data);
          setOrders(orders.map(o => o._id === selectedOrder._id ? response.data.data : o));
        }
        return;
      }

      const dFee = posOrderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
      const totalAmount = subtotal + dFee;

      if (paymentMethod === 'cash') {
        const received = parseFloat(cashReceived) || 0;
        if (received < totalAmount) {
          showToast('warning', `Cash received (₹${received}) is less than the total amount (₹${totalAmount})`);
          setIsSubmitting(false);
          return;
        }
      }

      const received = paymentMethod === 'cash' ? (parseFloat(cashReceived) || 0) : (paymentMethod === 'upi/card' ? totalAmount : 0);
      const bal = paymentMethod === 'cash' ? Math.max(0, received - totalAmount) : 0;
      const status = paymentMethod === 'Not Specified' ? 'unpaid' : 'paid';

      const orderData = {
        customerDetails: {
          ...customer,
          address: posOrderType === 'delivery' ? deliveryAddress : '',
          location: posOrderType === 'delivery' ? deliveryLocation : ''
        },
        items: cart,
        orderType: posOrderType,
        orderSource: 'admin',
        paymentMethod,
        paymentStatus: status,
        subtotal,
        deliveryFee: dFee,
        tax: 0,
        discount: 0,
        totalAmount,
        cashReceived: received,
        balance: bal,
        orderStatus: 'processing'
      };

      const response = await axios.post(`${API_BASE_URL}/orders/counter`, orderData);
      if (response.data.success) {
        showToast('success', 'Order created successfully');
        setIsModalOpen(false);
        setCart([]);
        setCustomer({ name: 'Walk-in', phone: '' });
        fetchOrders();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showAlert({ icon: 'error', title: 'Order Failed', text: error.response?.data?.message || 'Failed to create order' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderToUpdate = orders.find(o => o._id === orderId);
      const updateData = { orderStatus: newStatus };

      // If any order is marked delivered and is not already paid, ask for payment
      if (newStatus === 'delivered' && orderToUpdate?.paymentStatus !== 'paid') {
        const defaultMethod = (orderToUpdate?.paymentMethod && orderToUpdate.paymentMethod !== 'unpaid' && orderToUpdate.paymentMethod !== 'Not Specified') ? orderToUpdate.paymentMethod : 'cash';
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
        updateData.paymentMethod = result.value.paymentMethod;
        updateData.paymentStatus = 'paid';
        updateData.paidAmount = result.value.cashReceived;
        updateData.cashReceived = result.value.cashReceived;
        updateData.balance = result.value.balance;
      }

      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, updateData);
      if (response.data.success) {
        showToast('success', `Order marked as ${newStatus}${updateData.paymentStatus ? ' and Paid' : ''}`);
        setOrders(orders.map(o => o._id === orderId ? response.data.data : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleConfirmOrder = async (order) => {
    const itemsHtml = order.items.map(item => `
      <div class="flex justify-between items-center py-2 border-b border-border-light/50 last:border-0">
        <div class="text-left">
          <p class="text-[10px] font-black text-text-primary uppercase tracking-tight">${item.name}</p>
          <p class="text-[8px] font-bold text-text-muted uppercase opacity-70">${item.size} × ${item.quantity}</p>
        </div>
        <p class="text-[10px] font-black text-text-primary">₹${item.totalPrice}</p>
      </div>
    `).join('');

    const customerName = (order.orderSource === 'online' || order.orderSource === 'user')
      ? (order.address?.recipientName || order.customerDetails?.name || 'Walk-in')
      : (order.customerDetails?.name || order.address?.recipientName || 'Walk-in');

    const customerAddress = order.customerDetails?.address || order.address?.address || 'N/A';
    const customerPhone = order.customerDetails?.phone || order.address?.mobile || 'N/A';
    const paymentMethod = order.paymentMethod || 'Not Specified';

    const loc = order.customerDetails?.location || order.address?.location;
    let mapsUrl = '';
    if (typeof loc === 'object' && loc.lat) {
      mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    } else if (typeof loc === 'string') {
      const match = loc.match(/https?:\/\/[^\s]+/);
      mapsUrl = match ? match[0] : `https://www.google.com/maps?q=${loc}`;
    }

    const result = await showAlert({
      title: `Confirm ${order.orderType === 'takeaway' ? 'Takeaway' : 'Delivery'} Order?`,
      html: `
        <div class="space-y-6 mt-2 text-left">
          <!-- Items First -->
          <div class="px-2">
            <p class="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Ordered Items</p>
            <div class="max-h-[160px] overflow-y-auto pr-2 no-scrollbar">
              ${itemsHtml}
            </div>
          </div>

          <!-- Customer Details & Payment -->
          <div class="p-4 bg-primary/5 rounded-3xl border border-primary/10">
            <div class="flex justify-between items-start mb-3">
              <div>
                <p class="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">${order.orderType === 'takeaway' ? 'Customer' : 'Delivery To'}</p>
                <p class="text-xs font-black text-text-primary">${customerName}</p>
                <p class="text-[10px] font-bold text-text-muted mt-0.5">${customerPhone}</p>
              </div>
              <div class="text-right">
                <p class="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Payment</p>
                <span class="px-2 py-1 bg-background-card border border-border-light rounded-lg text-[9px] font-black text-text-primary uppercase tracking-wider shadow-sm">
                  ${paymentMethod}
                </span>
              </div>
            </div>
            
            ${order.orderType === 'delivery' ? `<p class="text-[10px] font-bold text-text-secondary leading-relaxed border-t border-primary/5 pt-2 mt-2">${customerAddress}</p>` : ''}
            
            ${mapsUrl ? `
              <a href="${mapsUrl}" target="_blank" class="inline-flex items-center space-x-1.5 mt-3 px-3 py-1.5 bg-background-card border border-primary/20 rounded-xl text-[8px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm no-underline">
                <span>📍 VIEW ON GOOGLE MAPS</span>
              </a>
            ` : ''}
          </div>
          
          <!-- Total Bill -->
          <div class="pt-4 border-t-2 border-dashed border-border-light flex justify-between items-center px-2">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Payable Amount</p>
            <p class="text-xl font-black text-primary">₹${order.totalAmount}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Order',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#B91C1C',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-2xl max-w-[440px] bg-background-card text-text-primary',
        htmlContainer: 'px-6 pb-2',
        confirmButton: 'rounded-xl px-8 py-3 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all mb-4',
        cancelButton: 'rounded-xl px-8 py-3 font-black uppercase tracking-widest text-[9px] bg-background-muted text-text-muted hover:bg-background-muted/80 transition-all mb-4 ml-2'
      }
    });

    if (result.isConfirmed) {
      handleUpdateOrderStatus(order._id, 'processing');
    }
  };

  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, { kitchenStatus: newStatus });
      if (response.data.success) {
        showToast('success', 'Status updated');
        // Update local state for both order list and selected order modal
        const updatedOrder = response.data.data;
        setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Update failed');
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      const updateData = { paymentStatus: newStatus };
      // Automatically set order status to delivered if marked as paid
      if (newStatus === 'paid') {
        updateData.orderStatus = 'delivered';
        // Record the current total as paidAmount when marking as paid
        const orderToUpdate = orders.find(o => o._id === orderId);
        if (orderToUpdate) {
          updateData.paidAmount = orderToUpdate.totalAmount;
        }
      }

      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, updateData);
      if (response.data.success) {
        showToast('success', `Payment marked as ${newStatus}${newStatus === 'paid' ? ' and order Delivered' : ''}`);
        setOrders(orders.map(o => o._id === orderId ? response.data.data : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const [editCustomer, setEditCustomer] = useState({ name: '', phone: '' });
  const [editCashReceived, setEditCashReceived] = useState('');

  useEffect(() => {
    if (selectedOrder) {
      setEditCustomer({
        name: (selectedOrder.orderSource === 'online' || selectedOrder.orderSource === 'user')
          ? (selectedOrder.address?.recipientName || selectedOrder.customerDetails?.name || '')
          : (selectedOrder.customerDetails?.name || selectedOrder.address?.recipientName || ''),
        phone: selectedOrder.customerDetails?.phone || selectedOrder.address?.mobile || ''
      });
      setEditCashReceived(selectedOrder.cashReceived || '');
    }
  }, [selectedOrder]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setAllUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCustomerSearch = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));

    if (allUsers.length === 0) fetchUsers();

    // Debounce the actual filtering for performance
    if (window.searchTimer) clearTimeout(window.searchTimer);

    window.searchTimer = setTimeout(() => {
      if (value.length >= 1) {
        const filtered = allUsers.filter(u => {
          const nameMatch = u.name?.toLowerCase().includes(value.toLowerCase());
          const phoneMatch = u.phone?.includes(value);
          return nameMatch || phoneMatch;
        });

        setUserSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 150); // 150ms delay is perfect for real-time feel without lag
  };

  const selectUserSuggestion = (user) => {
    setSelectedUserId(user._id);
    setCustomer({
      name: user.name,
      phone: user.phone || ''
    });

    // Find default address or use the first one
    const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];

    if (defaultAddr) {
      setDeliveryAddress(defaultAddr.address || '');
      if (defaultAddr.location) {
        handleLocationLinkChange(defaultAddr.location);
      }
    }
    setShowSuggestions(false);
    setUpdateProfile(false);
  };

  const handleOpenModal = (order = null) => {
    fetchMenu();
    fetchUsers();
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
      setCart([]);
      setCustomer({ name: 'Walk-in', phone: '' });
      setSelectedUserId(null);
      setUpdateProfile(false);
    }
    setIsModalOpen(true);
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleUpdatePaymentDetails = async () => {
    try {
      const subtotal = selectedOrder.totalAmount || 0;
      const cash = parseFloat(editCashReceived) || 0;
      const balance = cash - subtotal;

      const response = await axios.patch(`${API_BASE_URL}/orders/${selectedOrder._id}/status`, {
        customerDetails: editCustomer,
        cashReceived: cash,
        balance: balance
      });

      if (response.data.success) {
        showToast('success', 'Order details updated');
        setOrders(orders.map(o => o._id === selectedOrder._id ? response.data.data : o));
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to update details');
    }
  };

  const addToCart = (item, variant) => {
    // Stock Check: Prioritize the item's total stock
    const availableStock = item.totalStock;
    if (availableStock !== undefined && availableStock <= 0) {
      showToast('error', `Out of stock: ${item.name} is currently unavailable`);
      return;
    }

    const sizeName = variant.size || 'Standard';
    
    const bogoInfo = (variant?.isBOGO && variant?.bogoItem) ? {
      name: menuItems.find(m => m._id.toString() === variant.bogoItem.toString())?.name || 'Free Item',
      size: variant.bogoVariant || '',
      quantity: 1
    } : null;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(c => c.menuItem === item._id && c.size === sizeName);
      
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
        if (bogoInfo) {
          newCart[existingIndex].bogoItem = {
            ...bogoInfo,
            quantity: newCart[existingIndex].quantity
          };
        }
        return newCart;
      } else {
        return [...prevCart, {
          menuItem: item._id,
          name: item.name,
          image: item.image || '',
          size: sizeName,
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price,
          bogoItem: bogoInfo
        }];
      }
    });

    showToast('success', `${item.name} added`);
  };

  const updateCartQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.quantity = Math.max(1, item.quantity + delta);
    item.totalPrice = item.quantity * item.unitPrice;
    if (item.bogoItem) {
      item.bogoItem.quantity = item.quantity;
    }
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper to calculate distance from coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  // Helper to parse Google Maps link for coordinates
  const handleLocationLinkChange = async (url) => {
    setDeliveryLocation(url);
    if (!url) return;

    let targetUrl = url;

    // Improved coordinate extraction helper
    const extractCoords = (text) => {
      if (!text) return null;
      const coordRegex = /([-.\d]+),([-.\d]+)/g;
      let match;
      while ((match = coordRegex.exec(text)) !== null) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && Math.abs(lat) > 0.01) {
          return { lat, lng };
        }
      }
      return null;
    };

    // If it's a short link or no coords found, expand it first
    if (url.includes('maps.app.goo.gl') || url.includes('share.google') || !extractCoords(url)) {
      try {
        setIsResolvingLink(true);
        showToast('info', 'Processing link...');
        const res = await axios.post(`${API_BASE_URL}/utils/expand-url`, { url });
        targetUrl = res.data.expandedUrl;
      } catch (err) {
        console.error('Failed to expand URL:', err);
      } finally {
        setIsResolvingLink(false);
      }
    }

    const coords = extractCoords(targetUrl);

    if (coords && settings?.restaurantDetails?.location?.lat) {
      const { lat: destLat, lng: destLng } = coords;
      const restLat = settings.restaurantDetails.location.lat;
      const restLng = settings.restaurantDetails.location.lng;

      let roundedDist = Math.ceil(calculateDistance(restLat, restLng, destLat, destLng) * 10) / 10;

      // Try to get Road Distance from OSRM (FREE)
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${restLng},${restLat};${destLng},${destLat}?overview=false`;
        const osrmRes = await axios.get(osrmUrl);
        if (osrmRes.data?.routes?.[0]?.distance) {
          const roadDistKm = osrmRes.data.routes[0].distance / 1000;
          roundedDist = Math.ceil(roadDistKm * 10) / 10;
        }
      } catch (osrmErr) {
        console.error('OSRM failed, falling back to straight line:', osrmErr);
      }

      // Update distance input and fee
      const distInput = document.getElementById('pos-distance-input');
      if (distInput) distInput.value = roundedDist;

      const freeLimit = settings.deliverySettings?.freeDistanceLimit || 5;
      const rate = settings.deliverySettings?.chargePerExtraKm || 10;
      setDeliveryFee(roundedDist <= freeLimit ? '0' : ((roundedDist - freeLimit) * rate).toFixed(0));
      showToast('success', `Road distance calculated: ${roundedDist} KM`);
    }
  };

  const getFriendlyStatus = (order) => {
    if (!order) return { label: 'Unknown', color: 'bg-background-muted/10 text-text-muted border-border-light' };

    // Terminal States
    if (order.orderStatus === 'cancelled') return { label: 'Cancelled', color: 'bg-status-off/10 text-status-unavailable border-status-off/20' };
    if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') return { label: 'Delivered', color: 'bg-primary/10 text-primary border-primary/20' };

    // Active States
    if (order.orderStatus === 'placed') return { label: 'New Order', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (order.orderStatus === 'out-for-delivery') return { label: 'Out for Delivery', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
    if (order.orderStatus === 'billed') return { label: 'Billed', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };

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

  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      let valA, valB;

      switch (sortConfig.key) {
        case 'orderNumber':
          valA = a.orderNumber;
          valB = b.orderNumber;
          break;
        case 'customer':
          valA = a.customerDetails?.name || '';
          valB = b.customerDetails?.name || '';
          break;
        case 'amount':
          valA = a.totalAmount;
          valB = b.totalAmount;
          break;
        case 'createdAt':
          valA = new Date(a.createdAt);
          valB = new Date(b.createdAt);
          break;
        default:
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const applyFilters = (data, tabId, filters = {}) => {
    const {
      search = searchTerm,
      status = orderStatusFilter,
      payment = paymentFilter,
      method = paymentMethodFilter,
      histType = historyOrderTypeFilter,
      sDate = startDate,
      eDate = endDate
    } = filters;

    return data.filter(o => {
      const searchLower = (search || '').toLowerCase();
      const customerName = o.customerDetails?.name || o.address?.recipientName || '';
      const customerPhone = o.customerDetails?.phone || o.address?.mobile || '';
      const orderStatus = o.orderStatus || '';

      const matchesSearch = (o.orderNumber || '').toLowerCase().includes(searchLower) ||
        customerPhone.includes(search) ||
        customerName.toLowerCase().includes(searchLower);

      const matchesStatus = status === 'all' || orderStatus === status;
      const matchesPayment = payment === 'all' || o.paymentStatus === payment;
      const matchesPaymentMethod = method === 'all' || o.paymentMethod === method;

      const isHistoryOrder = o.orderStatus === 'delivered' || o.orderStatus === 'completed' || o.orderStatus === 'cancelled';

      let matchesType = false;
      if (tabId === 'history') {
        if (!isHistoryOrder) return false;
        const matchesHistType = histType === 'all' || o.orderType === histType;
        const orderDate = new Date(o.createdAt);
        let matchesDate = true;
        if (sDate) matchesDate = matchesDate && orderDate >= new Date(sDate);
        if (eDate) {
          const end = new Date(eDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && orderDate <= end;
        }
        matchesType = matchesHistType && matchesDate;
      } else if (tabId === 'all') {
        matchesType = !isHistoryOrder;
      } else if (tabId === 'dine-in') {
        // Show all dine-in orders (admin or waiter) that are not in history
        matchesType = (o.orderType === 'dine-in' || o.orderType === 'dining') && !isHistoryOrder;
      } else {
        if (isHistoryOrder) {
          matchesType = false;
        } else if (tabId === 'delivery') {
          matchesType = o.orderType === 'delivery' || o.orderType === 'online';
        } else if (tabId === 'takeaway') {
          matchesType = o.orderType === 'takeaway' || o.orderType === 'take-away' || o.orderType === 'counter';
        } else {
          matchesType = o.orderType === tabId;
        }
      }
      return matchesSearch && matchesStatus && matchesPayment && matchesPaymentMethod && matchesType;
    });
  };

  const filteredOrders = getSortedData(applyFilters(orders, activeTab));

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderStatusFilter, paymentFilter, paymentMethodFilter, historyOrderTypeFilter, startDate, endDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'out-for-delivery': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'placed': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-background-muted text-text-muted border-border-light';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Order Management</h2>
            <p className="text-text-secondary text-sm">Monitor all orders and operational status</p>
          </div>
          {activeTab !== 'all' && activeTab !== 'history' && activeTab !== 'dine-in' && (
            <button
              onClick={() => {
                setSelectedOrder(null);
                setCart([]);
                setPosSearchTerm('');
                setCashReceived('');
                setPosOrderType(activeTab === 'all' ? 'takeaway' : activeTab);
                setDeliveryAddress('');
                setDeliveryFee('');
                setCustomer({ name: 'Walk-in', phone: '' });
                setIsModalOpen(true);
              }}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>New Order</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 bg-background-card p-1.5 rounded-2xl border border-border/40 w-fit shadow-sm">
          {[
            { id: 'takeaway', label: 'Counter', icon: ShoppingCart },
            { id: 'dine-in', label: 'Dine In', icon: Utensils },
            { id: 'delivery', label: 'Delivery', icon: ChevronRight },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-muted hover:bg-background-muted hover:text-text-primary'
                }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}>
                {applyFilters(orders, tab.id).length}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'dine-in' ? (
          <TableSection />
        ) : (
        <div className="bg-background-card rounded-[2.5rem] border border-border/40 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 border-b border-border-light bg-background-muted/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search by order # or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    localStorage.setItem('orderSearchTerm', e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'history' ? (
                  <>
                    <select
                      value={historyOrderTypeFilter}
                      onChange={(e) => setHistoryOrderTypeFilter(e.target.value)}
                      className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="takeaway">Counter</option>
                      <option value="dine-in">Dine In</option>
                      <option value="delivery">Delivery</option>
                    </select>
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="all">Payment Method</option>
                      <option value="cash">Cash</option>
                      <option value="upi/card">UPI / Card</option>
                      <option value="online">Online</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-background-card text-text-primary border border-border-main rounded-lg px-2 py-1.5 text-[10px] outline-none"
                      />
                      <span className="text-text-muted text-[10px]">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-background-card text-text-primary border border-border-main rounded-lg px-2 py-1.5 text-[10px] outline-none"
                      />
                    </div>
                    <div className="h-8 w-px bg-border/40 mx-2 hidden md:block"></div>
                  </>
                ) : (
                  <>
                    <Filter size={14} className="text-text-muted" />
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => {
                        setOrderStatusFilter(e.target.value);
                        localStorage.setItem('orderStatusFilter', e.target.value);
                      }}
                      className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="all">All Orders</option>
                      <option value="placed">Placed</option>
                      <option value="processing">Processing</option>
                      {(activeTab === 'delivery' || activeTab === 'all') && (
                        <>
                          <option value="out-for-delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                        </>
                      )}
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="all">All Payment</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="all">Payment Method</option>
                      <option value="cash">Cash</option>
                      <option value="upi/card">UPI / Card</option>
                      <option value="online">Online</option>
                    </select>
                  </>
                )}

                <button
                  onClick={() => {
                    setSearchTerm('');
                    localStorage.removeItem('orderSearchTerm');
                    setOrderStatusFilter('all');
                    localStorage.removeItem('orderStatusFilter');
                    setPaymentFilter('all');
                    setPaymentMethodFilter('all');
                    setHistoryOrderTypeFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  disabled={!searchTerm && orderStatusFilter === 'all' && paymentFilter === 'all' && paymentMethodFilter === 'all' && historyOrderTypeFilter === 'all' && !startDate && !endDate}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${!searchTerm && orderStatusFilter === 'all' && paymentFilter === 'all' && paymentMethodFilter === 'all' && historyOrderTypeFilter === 'all' && !startDate && !endDate
                    ? 'bg-background-muted/50 text-text-muted/30 border-border-light cursor-not-allowed'
                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white'
                    }`}
                  title="Reset All Filters"
                >
                  <RotateCcw size={12} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Reset</span>
                </button>

                {activeTab === 'history' && (
                  <div className="flex items-center ml-auto">
                    {selectedOrderIds.length > 0 ? (
                      <button
                        onClick={() => handleClearHistory(selectedOrderIds)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-status-unavailable text-white shadow-lg shadow-status-unavailable/20 hover:bg-status-unavailable/90 active:scale-95 transition-all group"
                      >
                        <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Delete Selected ({selectedOrderIds.length})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClearHistory()}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-status-unavailable/20 text-status-unavailable hover:bg-status-unavailable hover:text-white shadow-sm hover:shadow-status-unavailable/30 active:scale-95 transition-all group"
                        title="Permanently Delete All History Records"
                      >
                        <Trash2 size={14} className="group-hover:shake transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Delete All Records</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  {activeTab === 'history' && (
                    <th className="px-3 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredOrders.map(o => o._id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-border-main text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </th>
                  )}
                  <th className="px-2 py-2.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('orderNumber')}>
                    <div className="flex items-center space-x-1">
                      <span>Order #</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'orderNumber' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  {activeTab === 'history' && (
                    <th className="px-2 py-2.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('orderType')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        <ArrowUpDown size={12} className={sortConfig.key === 'orderType' ? 'text-primary' : 'text-text-muted'} />
                      </div>
                    </th>
                  )}
                  {activeTab === 'dine-in' && (
                    <th className="px-2 py-2.5">
                      <div className="flex items-center space-x-1">
                        <span>Table</span>
                      </div>
                    </th>
                  )}
                  <th className="px-2 py-2.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Date & Time</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'createdAt' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'customer' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'amount' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-center">Order</th>
                  <th className="px-2 py-2.5 text-center">Payment</th>
                  {activeTab === 'history' && (
                    <th className="px-2 py-2.5 text-center">Method</th>
                  )}
                  <th className="px-2 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr>
                    <td colSpan={activeTab === 'history' ? 10 : (activeTab === 'dine-in' ? 8 : 7)} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <Loader size="large" />
                        <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'history' ? 10 : (activeTab === 'dine-in' ? 8 : 7)} className="px-6 py-12 text-center text-text-muted italic">No orders found</td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => {
                        if (order.orderStatus === 'placed' && (order.orderSource === 'user' || order.orderSource === 'online')) {
                          handleConfirmOrder(order);
                        } else {
                          handleOpenDetails(order);
                        }
                      }}
                      className={`hover:bg-background-muted/30 transition-colors group cursor-pointer ${selectedOrderIds.includes(order._id) ? 'bg-primary/5' : ''}`}
                    >
                      {activeTab === 'history' && (
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds(prev => [...prev, order._id]);
                              } else {
                                setSelectedOrderIds(prev => prev.filter(id => id !== order._id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border-main text-primary focus:ring-primary cursor-pointer accent-primary"
                          />
                        </td>
                      )}
                      <td className="px-2 py-2.5 font-black text-text-primary">
                        <div className="flex items-center space-x-2">
                          {order.orderStatus === 'placed' && (
                            <div className="flex items-center shrink-0">
                              <Zap size={12} className="text-primary fill-primary animate-pulse" />
                              <span className="ml-1 text-[8px] font-black text-primary uppercase tracking-tighter">New</span>
                            </div>
                          )}
                          <span>{order.orderNumber}</span>
                        </div>
                      </td>
                      {activeTab === 'history' && (
                        <td className="px-2 py-2.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-widest ${order.orderType === 'delivery' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            order.orderType === 'takeaway' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-primary/10 text-primary border-primary/20'
                            }`}>
                            {order.orderType}
                          </span>
                        </td>
                      )}
                      {activeTab === 'dine-in' && (
                        <td className="px-2 py-2.5">
                          {order.table ? (
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-black border border-primary/20">
                              T-{order.table.tableNumber}
                            </span>
                          ) : (
                            <span className="text-text-muted text-[10px] font-bold italic">No Table</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">{new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                          <span className="text-[10px] text-text-muted">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 font-bold text-text-secondary">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>
                              {(order.orderSource === 'online' || order.orderSource === 'user')
                                ? (order.address?.recipientName || order.customerDetails?.name || 'Walk-in')
                                : (order.customerDetails?.name || order.address?.recipientName || 'Walk-in')
                              }
                            </span>
                            {/* Source Dot Indicator */}
                            {(order.orderSource === 'online' || order.orderSource === 'user') ? (
                              <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Online Order"></span>
                            ) : (
                              <span className="flex h-2 w-2 rounded-full bg-amber-500" title="Admin Order"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-muted">{order.customerDetails?.phone || order.address?.mobile || '-'}</span>
                          <span className="text-[8px] font-black uppercase tracking-tighter text-text-muted/50">
                            Source: {order.orderSource || 'admin'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 font-black text-text-primary">₹{order.totalAmount || order.subtotal || 0}</td>
                      <td className="px-2 py-2.5 text-center">
                        {(() => {
                          const status = getFriendlyStatus(order);
                          const isActionable = status.label === 'Ready' || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'billed' || order.orderStatus === 'processing';

                          if (isActionable) {
                            return (
                              <select
                                value={order.orderStatus === 'completed' ? 'delivered' : order.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer outline-none transition-all text-center ${status.color}`}
                              >
                                {['Order Accepted', 'Preparing', 'Ready'].includes(status.label) && (
                                  <>
                                    <option value="processing" className="bg-background-card text-text-primary">{status.label}</option>
                                    {order.orderType === 'dine-in' && (
                                      <option value="billed" className="bg-background-card text-text-primary">Billed</option>
                                    )}
                                  </>
                                )}
                                {order.orderStatus === 'billed' && (
                                  <option value="billed" className="bg-background-card text-text-primary">Billed</option>
                                )}
                                {order.orderType === 'delivery' && (
                                  <option value="out-for-delivery" className="bg-background-card text-text-primary">Out for Delivery</option>
                                )}
                                <option value="delivered" className="bg-background-card text-text-primary">Delivered</option>
                              </select>
                            );
                          }
                          return (
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${(order.paymentStatus === 'paid' || order.paymentStatus === 'completed') ? 'bg-status-on/10 text-status-available border-status-on/20' :
                          order.paymentStatus === 'unpaid' ? 'bg-status-off/10 text-status-unavailable border-status-off/20' :
                            order.paymentStatus === 'refunded' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-status-off/10 text-status-unavailable border-status-off/20'
                          }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      {activeTab === 'history' && (
                        <td className="px-2 py-2.5 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-background-muted text-text-secondary border border-border-light">
                            {order.paymentMethod || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const status = getFriendlyStatus(order);
                            return (
                              <>
                                {order.orderStatus === 'placed' && (
                                  <button
                                    onClick={() => handleConfirmOrder(order)}
                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all animate-pulse"
                                    title="Confirm Order"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintKOT(order)}
                                  className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                                  title="Print KOT"
                                >
                                  <Printer size={18} />
                                </button>
                                <button
                                  onClick={() => handleOpenDetails(order)}
                                  className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>

                                {order.orderType === 'delivery' && (
                                  <button
                                    onClick={() => handleCopyForWhatsApp(order)}
                                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                                    title="Copy for WhatsApp"
                                  >
                                    <Copy size={16} />
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
        )}
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden print:hidden">
          <div className="bg-background-card w-full max-w-2xl h-[85vh] rounded-[2.5rem] border border-border-light shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-xl font-black text-text-primary">{selectedOrder.orderNumber}</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                {(() => {
                  const status = getFriendlyStatus(selectedOrder);
                  return (
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center space-x-3">

                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-background-muted rounded-xl text-text-muted transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
              {/* Section 1: Order Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-light pb-2">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Ordered Items</p>
                  {activeTab !== 'history' && !['cancelled', 'completed', 'delivered'].includes(selectedOrder.orderStatus) &&
                    !(selectedOrder.orderType === 'delivery' && (selectedOrder.orderSource === 'user' || selectedOrder.orderSource === 'online')) && (
                      <button
                        onClick={() => {
                          setCashReceived(selectedOrder.cashReceived || '');
                          setCustomer({
                            name: (selectedOrder.orderSource === 'online' || selectedOrder.orderSource === 'user')
                              ? (selectedOrder.address?.recipientName || selectedOrder.customerDetails?.name || '')
                              : (selectedOrder.customerDetails?.name || selectedOrder.address?.recipientName || ''),
                            phone: selectedOrder.customerDetails?.phone || selectedOrder.address?.mobile || ''
                          });
                          setDeliveryAddress(selectedOrder.customerDetails?.address || selectedOrder.address?.address || '');
                          setDeliveryLocation(selectedOrder.address?.location || (typeof selectedOrder.customerDetails?.location === 'string' ? selectedOrder.customerDetails.location : ''));
                          setPosOrderType(selectedOrder.orderType);
                          setPaymentMethod(selectedOrder.paymentMethod || 'cash');
                          // Populate cart with existing items for editing
                          setCart(selectedOrder.items.map(item => ({
                            ...item,
                            menuItem: item.menuItem?._id || item.menuItem,
                            name: item.name || item.menuItem?.name || 'Item',
                            image: item.image || item.menuItem?.image || '',
                            unitPrice: item.unitPrice || item.price,
                            totalPrice: item.totalPrice || ((item.unitPrice || item.price) * item.quantity)
                          })));
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] font-black text-primary uppercase hover:underline flex items-center space-x-1"
                      >
                        <Edit2 size={12} />
                        <span>Edit Items</span>
                      </button>
                    )}
                </div>

                {selectedOrder.orderStatus === 'pending' && (
                  <div className="flex items-center space-x-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Confirmation</p>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedOrder?.items?.map((item) => {
                    const ks = item?.kitchenStatus || 'placed';
                    const ksStyles = ks === 'ready' ? 'bg-status-on/10 text-status-available border-status-on/20' : ks === 'preparing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ks === 'delayed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                    return (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-background-muted/20 rounded-2xl border border-border-light hover:border-primary/20 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-background-card rounded-xl flex items-center justify-center border border-border-light overflow-hidden shrink-0">
                          {item?.image || item?.menuItem?.image ? (
                            <img src={item?.image || item?.menuItem?.image} alt={item?.name || item?.menuItem?.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-primary/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-text-primary text-[13px] truncate">
                            {item?.name && item.name !== 'Unknown Item' ? item.name : (item?.menuItem?.name || item?.name || 'Menu Item')}
                          </p>
                          <p className="text-[9px] text-text-muted font-bold uppercase">
                            {item?.size} • ₹{item?.unitPrice || item?.price} x {item?.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${ksStyles}`}>
                          {ks}
                        </span>
                        <p className="text-xs font-black text-text-primary">
                          ₹{item?.totalPrice || ((item?.unitPrice || item?.price || 0) * item?.quantity)}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Customer & Order Details */}
              <div className="grid grid-cols-2 gap-4 bg-background-muted/10 p-5 rounded-3xl border border-border-light">
                <div className="space-y-1">
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Customer</p>
                  <p className="text-xs font-black text-text-primary truncate">
                    {selectedOrder?.address?.recipientName || selectedOrder?.customerDetails?.name || 'Walk-in'}
                  </p>
                  <p className="text-[10px] text-text-muted font-bold">{selectedOrder?.customerDetails?.phone || selectedOrder?.address?.mobile || 'No Phone'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Order Info</p>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] text-text-primary font-bold uppercase tracking-widest mb-1">
                      {selectedOrder.orderStatus === 'processing' ? 'Order Accepted' : selectedOrder.orderStatus}
                    </p>
                    <p className={`text-[11px] font-black uppercase tracking-tight mb-1 ${selectedOrder.paymentStatus === 'paid' ? 'text-status-available' : 'text-amber-500'}`}>
                      PAYMENT - {selectedOrder.paymentStatus}
                    </p>
                    {selectedOrder.orderType === 'dine-in' && selectedOrder.table && (
                      <span className="mt-2 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase border border-primary/20">
                        Table {selectedOrder.table.tableNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Delivery Location */}
              {selectedOrder.orderType === 'delivery' && (selectedOrder.customerDetails?.address || selectedOrder.address?.address) && (
                <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 overflow-hidden">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] text-primary font-bold uppercase tracking-widest flex items-center space-x-1">
                          <MapPin size={10} />
                          <span>Delivery Address</span>
                        </p>
                        <p className="text-xs font-bold text-text-primary leading-relaxed line-clamp-2">
                          {selectedOrder.customerDetails?.address || selectedOrder.address?.address}
                        </p>
                      </div>
                      {(() => {
                        const loc = selectedOrder.customerDetails?.location || selectedOrder.address?.location;
                        let url;
                        if (typeof loc === 'object' && loc.lat) {
                          url = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
                        } else if (typeof loc === 'string') {
                          url = loc.match(/https?:\/\/[^\s]+/) ? loc.match(/https?:\/\/[^\s]+/)[0] : `https://www.google.com/maps?q=${loc}`;
                        }
                        if (!url) return null;
                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/20"
                            title="View on Maps"
                          >
                            <ExternalLink size={14} />
                          </a>
                        );
                      })()}
                    </div>

                    {(() => {
                      const loc = selectedOrder.customerDetails?.location || selectedOrder.address?.location;
                      let lat, lng;
                      if (typeof loc === 'object' && loc.lat) {
                        lat = loc.lat; lng = loc.lng;
                      } else if (typeof loc === 'string') {
                        const match = loc.match(/q=([\d.-]+),([\d.-]+)/);
                        if (match) { lat = match[1]; lng = match[2]; }
                      }
                      if (lat && lng) return (
                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-border-light shadow-inner relative group">
                          <iframe
                            title="Order Location"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                            className="grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                          />
                          <div className="absolute inset-0 pointer-events-none border border-primary/5 rounded-2xl" />
                        </div>
                      );
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-background-muted/30 border-t border-border-light flex items-center justify-between">
              <div className="flex flex-col space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-col mb-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                      Subtotal: ₹{selectedOrder.subtotal || 0}
                    </span>
                    {selectedOrder.platformFee > 0 && (
                      <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                        Platform Fee: +₹{selectedOrder.platformFee}
                      </span>
                    )}
                    {selectedOrder.deliveryFee > 0 && (
                      <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                        Delivery Fee: +₹{selectedOrder.deliveryFee}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Bill Amount</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-text-primary">
                      ₹{selectedOrder.totalAmount || 0}
                    </span>
                    {selectedOrder.paidAmount > 0 && (selectedOrder.totalAmount || selectedOrder.subtotal) > selectedOrder.paidAmount && (
                      <span className="px-2 py-0.5 bg-status-off/10 text-status-unavailable text-[10px] font-black rounded-lg uppercase tracking-tighter">
                        Partial Payment
                      </span>
                    )}
                  </div>
                </div>

                {selectedOrder.paidAmount > 0 && (selectedOrder.totalAmount || selectedOrder.subtotal) > selectedOrder.paidAmount && (
                  <div className="animate-in slide-in-from-left duration-500">
                    <div className="flex items-center space-x-4 p-4 bg-background-card rounded-[1.5rem] border border-status-unavailable/20 shadow-sm">
                      <div className="w-10 h-10 bg-status-off/10 text-status-unavailable rounded-xl flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-status-unavailable uppercase tracking-widest mb-0.5">Balance to Collect</p>
                        <div className="flex items-baseline space-x-3">
                          <span className="text-2xl font-black text-text-primary">
                            ₹{(selectedOrder?.totalAmount || selectedOrder?.subtotal || 0) - (selectedOrder?.paidAmount || 0)}
                          </span>
                          <div className="h-4 w-[1px] bg-border-light" />
                          <span className="text-[10px] font-bold text-text-muted uppercase">
                            Paid: ₹{selectedOrder?.paidAmount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {null}

                {selectedOrder.orderStatus === 'placed' && (
                  <button
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder._id, 'processing');
                      setIsDetailsModalOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 min-w-[160px]"
                  >
                    <CheckCircle2 size={18} />
                    <span>Confirm</span>
                  </button>
                )}

                {['placed', 'pending', 'processing', 'out-for-delivery'].includes(selectedOrder.orderStatus) && (
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Cancel Order?',
                        text: "Are you sure you want to cancel this order?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#6b7280',
                        confirmButtonText: 'Yes, Cancel',
                        scrollbarPadding: false,
                        heightAuto: false
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleUpdateOrderStatus(selectedOrder._id, 'cancelled');
                          setIsDetailsModalOpen(false);
                        }
                      });
                    }}
                    className="flex items-center justify-center space-x-2 bg-background-muted text-text-muted px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-status-off/10 hover:text-status-unavailable transition-all border border-border-light min-w-[140px]"
                  >
                    <XCircle size={18} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden print:hidden">
          <div className="bg-background-card w-full max-w-5xl h-[85vh] rounded-[3rem] border border-border/40 shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Menu Selection Side */}
            <div className="flex-1 flex flex-col border-r border-border-light">
              <div className="p-6 border-b border-border-light flex items-center justify-between">
                <h3 className="text-xl font-black text-text-primary">Create Order</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={posSearchTerm}
                    onChange={(e) => setPosSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-background-muted rounded-lg text-xs outline-none focus:border-primary/50 border border-transparent"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 no-scrollbar">
                {menuItems
                  .filter(item => {
                    const searchLower = (posSearchTerm || '').toLowerCase();
                    return (item.name || '').toLowerCase().includes(searchLower);
                  })
                  .map(item => (
                    <div 
                      key={item._id} 
                      onClick={() => {
                        const targetVariant = (item.variants && item.variants.length > 0) 
                          ? item.variants[0] 
                          : { size: 'Standard', price: item.price || 0 };
                        addToCart(item, targetVariant);
                      }}
                      className={`bg-background-muted/30 p-3 rounded-2xl border border-border-light hover:border-primary/30 transition-all group relative cursor-pointer active:scale-[0.98] ${item.totalStock <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                    >
                      <div className="w-full aspect-square bg-background-card rounded-xl mb-3 overflow-hidden border border-border-light relative">
                        <img src={item.image || '/placeholder-dish.png'} alt={item.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.totalStock <= 0 ? 'grayscale' : ''}`} />
                        {item.totalStock <= 0 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-text-primary text-xs line-clamp-1">{item.name}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${item.totalStock > 10 ? 'bg-primary/10 text-primary' : item.totalStock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                            {item.totalStock} Left
                          </span>
                        </div>
                        {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.comboItems.map((ci, idx) => (
                              <span key={idx} className="text-[7px] font-black text-text-muted bg-background-muted px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-border-light">
                                {ci.menuItem?.name || ci.name || 'Item'}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.isCombo ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetVariant = (item.variants && item.variants.length > 0) 
                                ? item.variants[0] 
                                : { size: 'Standard', price: item.price || 0 };
                              addToCart(item, targetVariant);
                            }}
                            className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20 mt-1"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {item.variants && item.variants.map((v, idx) => {
                              const isOutOfStock = item.totalStock !== undefined && item.totalStock <= 0;
                              return (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isOutOfStock) addToCart(item, v);
                                  }}
                                  disabled={isOutOfStock}
                                  className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${isOutOfStock
                                    ? 'bg-background-muted text-text-muted cursor-not-allowed border border-border-light'
                                    : 'bg-primary text-white hover:bg-primary-light shadow-sm active:scale-95'
                                    }`}
                                >
                                  {v.size}: ₹{v.price}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cart Side */}
            <div className="w-96 flex flex-col bg-background-muted/10">
              <div className="p-6 border-b border-border-light">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-text-primary uppercase tracking-wider text-xs">
                    {selectedOrder ? `Adding to ${selectedOrder.orderNumber}` : 'Current Cart'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)}><XCircle size={20} className="text-text-muted hover:text-status-unavailable" /></button>
                </div>

                {selectedOrder && (
                  <div className="mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Editing Order Mode</p>
                    <p className="text-[9px] text-text-muted font-medium italic">You can add, remove, or change quantities below.</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 bg-background-card p-1.5 rounded-2xl border border-border-light mb-4">
                  {['takeaway', 'delivery'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setPosOrderType(type);
                        if (type === 'delivery') setPaymentMethod('cod');
                        else setPaymentMethod('cash');
                      }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${posOrderType === type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-background-muted'}`}
                    >
                      {type === 'takeaway' ? 'Counter' : type.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 relative">
                  {posOrderType === 'delivery' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 bg-background-card p-2 rounded-xl border border-border-light">
                        <User size={12} className="text-text-muted" />
                        <input
                          type="text"
                          placeholder="Name"
                          value={customer.name}
                          onChange={e => handleCustomerSearch('name', e.target.value)}
                          onFocus={() => customer.name.length > 1 && setShowSuggestions(true)}
                          className="bg-transparent text-[10px] font-bold text-text-primary outline-none w-full"
                        />
                      </div>
                      <div className="flex items-center space-x-2 bg-background-card p-2 rounded-xl border border-border-light">
                        <Phone size={12} className="text-text-muted" />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={customer.phone}
                          onChange={e => handleCustomerSearch('phone', e.target.value)}
                          onFocus={() => customer.phone.length > 1 && setShowSuggestions(true)}
                          className="bg-transparent text-[10px] font-bold text-text-primary outline-none w-full"
                        />
                      </div>
                    </div>
                  )}

                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 z-[500] mt-2 bg-background-card border-2 border-primary/20 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-3 border-b border-border-light bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Customer Suggestions</p>
                          {userSuggestions.length > 0 && <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{userSuggestions.length} Found</span>}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSuggestions(false);
                          }}
                          className="p-1 hover:bg-primary/10 rounded-full text-text-muted hover:text-primary transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {userSuggestions.length === 0 ? (
                          <div className="p-6 text-center">
                            <User size={24} className="mx-auto text-text-muted/30 mb-2" />
                            <p className="text-[10px] text-text-muted font-bold">No matching customers found</p>
                            <p className="text-[8px] text-text-muted/50 mt-1">Creating as a new walk-in customer</p>
                          </div>
                        ) : (
                          userSuggestions.map(user => (
                            <button
                              key={user._id}
                              onClick={() => selectUserSuggestion(user)}
                              className="w-full p-4 flex items-center justify-between hover:bg-primary/10 active:bg-primary/20 transition-all border-b border-border-light last:border-0 group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-start text-left">
                                  <span className="text-xs font-black text-text-primary group-hover:text-primary transition-colors">{user.name}</span>
                                  <div className="flex items-center space-x-1 text-text-muted">
                                    <Phone size={8} />
                                    <span className="text-[9px] font-bold">{user.phone || 'No phone'}</span>
                                  </div>
                                </div>
                              </div>
                              {user.addresses?.[0]?.address && (
                                <div className="flex flex-col items-end max-w-[150px]">
                                  <span className="text-[8px] text-primary/70 font-black uppercase tracking-tighter">Saved Address</span>
                                  <span className="text-[9px] text-text-muted font-medium truncate w-full text-right">{user.addresses[0].address}</span>
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      <div className="p-2 bg-background-muted/30 border-t border-border-light text-center">
                        <p className="text-[8px] text-text-muted font-bold">Press ESC to close suggestions</p>
                      </div>
                    </div>
                  )}

                  {posOrderType === 'delivery' && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative group/field flex items-center bg-primary/[0.03] px-3 py-2 rounded-xl border border-primary/20 focus-within:border-primary transition-all">
                          <Truck size={12} className="text-primary mr-2" />
                          <div className="flex-1">
                            <input
                              id="pos-distance-input"
                              type="number"
                              placeholder="Distance (KM)"
                              onChange={(e) => {
                                const dist = parseFloat(e.target.value) || 0;
                                const freeLimit = settings.deliverySettings?.freeDistanceLimit || 5;
                                const rate = settings.deliverySettings?.chargePerExtraKm || 10;
                                setDeliveryFee(dist <= freeLimit ? '0' : ((dist - freeLimit) * rate).toFixed(0));
                              }}
                              className="bg-transparent text-[10px] font-black text-primary outline-none w-full placeholder:text-primary/30"
                            />
                          </div>
                        </div>

                        <div className="relative group/field flex items-center bg-primary/[0.03] px-3 py-2 rounded-xl border border-primary/20 focus-within:border-primary transition-all">
                          <ExternalLink size={12} className="text-primary mr-2" />
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Maps Link"
                              value={deliveryLocation}
                              onChange={e => handleLocationLinkChange(e.target.value)}
                              className="bg-transparent text-[10px] font-black text-primary outline-none w-full placeholder:text-primary/30"
                            />
                          </div>
                          <button
                            onClick={() => handleLocationLinkChange(deliveryLocation)}
                            className="p-1 hover:bg-primary/10 rounded-lg text-primary disabled:opacity-30"
                            disabled={isResolvingLink}
                          >
                            <Loader2 size={12} className={isResolvingLink ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>

                      <div className="relative bg-background-card px-3 py-2 rounded-xl border border-border-main focus-within:border-primary transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            <MapPin size={10} className="text-primary" />
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Delivery Address</p>
                          </div>

                          {selectedUserId && (
                            <button
                              type="button"
                              onClick={() => setUpdateProfile(!updateProfile)}
                              className="flex items-center space-x-1.5 group cursor-pointer"
                            >
                              <div className={`w-3 h-3 rounded-[4px] border flex items-center justify-center transition-all ${updateProfile ? 'bg-primary border-primary' : 'bg-transparent border-border-main'}`}>
                                {updateProfile && <CheckCircle2 size={8} className="text-white" />}
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${updateProfile ? 'text-primary' : 'text-text-muted'}`}>Update Profile</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          placeholder="Building, Street, Area Details..."
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-text-primary outline-none w-full h-12 resize-none placeholder:text-text-muted/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
                    <ShoppingCart size={48} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Cart Empty</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex-1">
                        <p className="font-bold text-text-primary text-xs">{item.name}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase">{item.size} • ₹{item.unitPrice}</p>
                        {item.bogoItem && (
                          <p className="text-[9px] font-black text-status-available uppercase tracking-tighter">
                            + free: {item.bogoItem.name} {item.bogoItem.size && `(${item.bogoItem.size})`} x {item.bogoItem.quantity}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-background-card px-2 py-1 rounded-lg border border-border-light">
                          <button onClick={() => updateCartQuantity(idx, -1)} className="text-text-muted hover:text-primary font-black">-</button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(idx, 1)} className="text-text-muted hover:text-primary font-black">+</button>
                        </div>
                        <p className="font-black text-xs w-12 text-right">₹{item.totalPrice}</p>
                        <button onClick={() => removeFromCart(idx)} className="text-text-muted hover:text-status-unavailable opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-background-card border-t border-border-light space-y-3">
                <div className="space-y-2">
                  {posOrderType === 'delivery' && !settings.deliverySettings?.pricingType === 'distance' && (
                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded-xl border border-primary/10 mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Manual Delivery Fee</span>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/60 text-[10px]">₹</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={deliveryFee}
                          onChange={e => setDeliveryFee(e.target.value)}
                          className="w-full bg-white/50 border border-primary/20 rounded-lg py-1 pl-5 pr-2 text-xs font-black text-primary outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 border-b border-border-light pb-2">
                    <div className="flex items-center justify-between text-text-muted text-[10px] font-bold uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>₹{cart.reduce((acc, i) => acc + i.totalPrice, 0)}</span>
                    </div>
                    {cart.reduce((acc, item) => {
                      const menuItem = menuItems.find(m => m._id === item.menuItem);
                      if (!menuItem) return acc;
                      if (menuItem.isCombo && menuItem.comboItems) {
                        const sumOfItems = menuItem.comboItems.reduce((sum, ci) => sum + (ci.price || 0), 0);
                        return acc + (Math.max(0, sumOfItems - item.unitPrice) * item.quantity);
                      }
                      if (menuItem.hasOffer && menuItem.price > item.unitPrice) {
                        return acc + ((menuItem.price - item.unitPrice) * item.quantity);
                      }
                      return acc;
                    }, 0) > 0 && (
                        <div className="flex items-center justify-between text-status-available text-[10px] font-bold uppercase tracking-widest">
                          <span>Total Savings</span>
                          <span>₹{cart.reduce((acc, item) => {
                            const menuItem = menuItems.find(m => m._id === item.menuItem);
                            if (!menuItem) return acc;
                            if (menuItem.isCombo && menuItem.comboItems) {
                              const sumOfItems = menuItem.comboItems.reduce((sum, ci) => sum + (ci.price || 0), 0);
                              return acc + (Math.max(0, sumOfItems - item.unitPrice) * item.quantity);
                            }
                            if (menuItem.hasOffer && menuItem.price > item.unitPrice) {
                              return acc + ((menuItem.price - item.unitPrice) * item.quantity);
                            }
                            return acc;
                          }, 0)}</span>
                        </div>
                      )}
                    {posOrderType === 'delivery' && (
                      <div className="flex items-center justify-between text-primary text-[10px] font-bold uppercase tracking-widest">
                        <span>Delivery Fee</span>
                        <span>₹{parseFloat(deliveryFee) || 0}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-text-primary">
                    <span className="font-bold text-xs uppercase tracking-wider text-text-muted">Total Amount</span>
                    <span className="text-xl font-black">
                      ₹{cart.reduce((acc, i) => acc + i.totalPrice, 0) + (posOrderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0)}
                    </span>
                  </div>

                  {selectedOrder && selectedOrder.paidAmount > 0 && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center justify-between p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/20">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Payment Summary</p>
                          <p className="text-[11px] font-bold text-text-muted">Already Paid: ₹{selectedOrder.paidAmount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-status-unavailable uppercase tracking-widest">Balance Due</p>
                          <p className="text-lg font-black text-status-unavailable">
                            ₹{Math.max(0, cart.reduce((acc, i) => acc + i.totalPrice, 0) - selectedOrder.paidAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Not Specified', label: 'Not Specified' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'upi/card', label: 'UPI / Card' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setPaymentMethod(m.id);
                        setCashReceived('');
                      }}
                      className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${paymentMethod === m.id
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-background-muted text-text-muted border-border-light hover:border-primary/50'
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Cash Received</label>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">₹</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-1.5 bg-background border border-border-light rounded-xl focus:outline-none focus:border-primary text-right font-black text-xs text-text-primary"
                        />
                      </div>
                    </div>
                    {parseFloat(cashReceived) > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black border-t border-border-light/60 pt-2">
                        <span className="text-text-secondary uppercase tracking-wider text-[8px]">Balance to Return</span>
                        <span className={parseFloat(cashReceived) >= (cart.reduce((acc, i) => acc + i.totalPrice, 0) + (posOrderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0)) ? "text-emerald-600 text-xs" : "text-amber-500 uppercase text-[8px]"}>
                          {parseFloat(cashReceived) >= (cart.reduce((acc, i) => acc + i.totalPrice, 0) + (posOrderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0))
                            ? `₹${(parseFloat(cashReceived) - (cart.reduce((acc, i) => acc + i.totalPrice, 0) + (posOrderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0))).toFixed(2)}`
                            : "Insufficient Cash"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isSubmitting
                    ? 'bg-background-muted text-text-muted cursor-not-allowed opacity-50'
                    : 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  {isSubmitting ? 'Processing Order...' : (selectedOrder ? 'Update Order' : 'Save Order')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default OrderSection;
