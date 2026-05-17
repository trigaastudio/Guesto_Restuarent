import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosInstance';
import { Plus, Edit2, Trash2, X, RefreshCw, Users, GitMerge, ChevronRight, ChevronDown, User, Hash, AlertCircle, ShoppingCart, CheckCircle2, Clock, Printer } from 'lucide-react';
import Loader from '../../../components/Loader/Loader';
import DineInPOSModal from '../../../components/POS/DineInPOSModal';
import { showToast } from '../../../utils/sweetAlert';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const TableSection = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    _id: '',
    tableNumber: '',
    capacity: 4
  });

  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = (table = null) => {
    if (table) {
      setFormData({
        _id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity
      });
    } else {
      setFormData({
        _id: '',
        tableNumber: '',
        capacity: 4
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/api/tables/${formData._id}`, {
          tableNumber: formData.tableNumber,
          capacity: formData.capacity
        });
        showToast('success', 'Table updated successfully');
      } else {
        await api.post('/api/tables', {
          tableNumber: formData.tableNumber,
          capacity: formData.capacity
        });
        showToast('success', 'Table created successfully');
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will deactivate the table.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, deactivate it!',
      background: 'var(--color-background-card)',
      color: 'var(--color-text-primary)',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/tables/${id}`);
        showToast('success', 'Table deactivated successfully');
        fetchTables();
      } catch (error) {
        showToast('error', error.response?.data?.message || 'Failed to deactivate table');
      }
    }
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
      fetchTables();
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchTables}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-background-card border border-border-light text-text-secondary hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-light hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 text-sm sm:text-base"
          >
            <Plus size={20} />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size="large" />
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-background-card rounded-[2.5rem] border border-border-light p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-background-muted rounded-full flex items-center justify-center">
            <Hash size={32} className="text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">No Tables Found</h3>
          <p className="text-text-secondary text-sm max-w-md">Get started by adding your first table to manage dine-in customers.</p>
          <button
            onClick={() => openModal()}
            className="mt-4 flex items-center space-x-2 bg-primary/10 text-primary px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors"
          >
            <Plus size={20} />
            <span>Add Table</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const statusColor = isOccupied ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            const headerBg = isOccupied 
              ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10' 
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10';

            return (
              <div key={table._id} className="bg-background-card rounded-[2rem] border border-border-light shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col group hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative">
                
                <div className={`p-6 ${headerBg} border-b border-border-light/50 relative overflow-hidden`}>

                  <div className="absolute top-0 right-0 p-5 flex space-x-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0 z-10">

                     <button onClick={() => openModal(table)} className="w-8 h-8 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-primary transition-colors shadow-sm">
                        <Edit2 size={14} />
                     </button>
                     {!isOccupied && (
                       <button onClick={() => handleDelete(table._id)} className="w-8 h-8 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-status-unavailable transition-colors shadow-sm">
                          <Trash2 size={14} />
                       </button>
                     )}
                  </div>

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
                      <div className="space-y-4 max-h-56 overflow-y-auto pr-2 no-scrollbar scroll-smooth">
                        {table.activeOrders?.map(order => {
                          const allReady = order.items?.length > 0 && order.items.every(i => i.kitchenStatus === 'ready');
                          const currentStatus = (order.orderStatus === 'processing' && allReady) ? 'ready' : order.orderStatus;
                          const isPlaced = currentStatus === 'placed';
                          const isActiveOrder = ['processing', 'ready', 'billed'].includes(currentStatus);
                          
                          const cardStatusStyle = allReady 
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
                              {allReady && (
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ready</span>
                                </div>
                              )}
                            </div>
                            <div 
                              onClick={() => handleEditOrder(table, order)}
                              className="flex items-center justify-between px-4 pb-4 cursor-pointer"
                            >
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintKOT(order);
                                    }}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-background-card rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-border/50">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-background-muted text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
              {formData._id ? 'Edit Table' : 'Add New Table'}
            </h3>
            <p className="text-text-secondary text-sm mb-8">Configure your dining capacity.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">Table Number</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                     <Hash size={18} />
                   </div>
                   <input
                     type="number"
                     name="tableNumber"
                     value={formData.tableNumber}
                     onChange={handleInputChange}
                     className="w-full pl-12 pr-4 py-4 bg-background border border-border-light rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-text-primary"
                     required
                     min="1"
                     placeholder="e.g. 1"
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">Seating Capacity</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                     <Users size={18} />
                   </div>
                   <input
                     type="number"
                     name="capacity"
                     value={formData.capacity}
                     onChange={handleInputChange}
                     className="w-full pl-12 pr-4 py-4 bg-background border border-border-light rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-text-primary"
                     required
                     min="1"
                     placeholder="e.g. 4"
                   />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 px-4 bg-background-muted text-text-secondary font-bold rounded-2xl hover:bg-text-secondary hover:text-background-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 px-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-light transition-colors shadow-lg shadow-primary/25"
                >
                  {formData._id ? 'Update Table' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default TableSection;
