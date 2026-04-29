import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, Clock,
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowUpDown,
  ShoppingCart, User, Phone, CreditCard, ChevronRight,
  MoreVertical, Printer, Package, Utensils
} from 'lucide-react';
import axios from 'axios';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';

const API_BASE_URL = 'http://localhost:5000/api';

const OrderSection = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // POS State
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, []);

  const handlePrintKOT = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => `
      <tr>
        <td colspan="4" style="text-transform: uppercase; font-weight: bold; padding-top: 8px;">${item.name} (${item.size})</td>
      </tr>
      <tr>
        <td style="width: 40%;"></td>
        <td style="width: 15%; text-align: left;">${item.quantity} P</td>
        <td style="width: 20%; text-align: right;">${item.unitPrice.toFixed(2)}</td>
        <td style="width: 25%; text-align: right;">${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('');

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
            .header { text-align: center; margin-bottom: 15px; }
            .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .details { font-size: 13px; margin-bottom: 2px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            .total-section { font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; margin-top: 5px; }
            .payment-info { font-size: 13px; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="restaurant-name">GUESTO RESTAURENT</div>
            <div class="details">Chammannur,Athirthi</div>
            <div class="details">MOB: 7034805085, 9947649007</div>
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
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="payment-info">
            <div style="display: flex; justify-content: space-between;">
              <span>CASH RECEIVED :</span>
              <span>${order.paymentStatus === 'paid' ? order.totalAmount.toFixed(2) : '0.00'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 3px;">
              <span>${order.paymentStatus === 'paid' ? 'CHANGE' : 'DUE'} :</span>
              <span>0.00</span>
            </div>
          </div>
          <div class="divider"></div>
          <div style="text-align: center; font-size: 11px; margin-top: 10px;">
            THANK YOU FOR VISITING!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('error', 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/menu`);
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
      const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

      if (selectedOrder) {
        // Adding items to existing order
        const response = await axios.patch(`${API_BASE_URL}/orders/${selectedOrder._id}/add-items`, { items: cart });
        if (response.data.success) {
          showToast('success', 'Items added to order');
          setIsModalOpen(false);
          setCart([]);
          setSelectedOrder(response.data.data);
          setOrders(orders.map(o => o._id === selectedOrder._id ? response.data.data : o));
        }
        return;
      }

      const orderData = {
        customerDetails: customer,
        items: cart,
        paymentMethod,
        subtotal,
        tax: 0,
        discount: 0,
        totalAmount: subtotal
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
      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        showToast('success', `Order marked as ${newStatus}`);
        setOrders(orders.map(o => o._id === orderId ? response.data.data : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to update order status');
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
      showToast('error', 'Update failed');
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { paymentStatus: newStatus });
      if (response.data.success) {
        showToast('success', `Payment marked as ${newStatus}`);
        setOrders(orders.map(o => o._id === orderId ? response.data.data : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to update payment status');
    }
  };

  const [editCustomer, setEditCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (selectedOrder) {
      setEditCustomer({
        name: selectedOrder.customerDetails?.name || '',
        phone: selectedOrder.customerDetails?.phone || ''
      });
    }
  }, [selectedOrder]);

  const handleUpdateCustomerDetails = async () => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/${selectedOrder._id}/status`, { customerDetails: editCustomer });
      if (response.data.success) {
        showToast('success', 'Customer details updated');
        setOrders(orders.map(o => o._id === selectedOrder._id ? response.data.data : o));
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to update details');
    }
  };

  const addToCart = (item, variant) => {
    const existingIndex = cart.findIndex(c => c.menuItem === item._id && c.size === variant.size.name);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        menuItem: item._id,
        name: item.name,
        image: item.image || '',
        size: variant.size.name,
        quantity: 1,
        unitPrice: variant.price,
        totalPrice: variant.price
      }]);
    }
    showToast('success', `${item.name} added`);
  };

  const updateCartQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.quantity = Math.max(1, item.quantity + delta);
    item.totalPrice = item.quantity * item.unitPrice;
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

  const filteredOrders = getSortedData(orders).filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerDetails?.phone || '').includes(searchTerm) ||
      (o.customerDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-status-off/10 text-status-unavailable border-status-off/20';
      case 'preparing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'delayed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'ready': return 'bg-status-on/10 text-status-available border-status-on/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-background-muted text-text-muted border-border-light';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Counter Orders</h2>
            <p className="text-text-secondary text-sm">Monitor POS orders and operational status</p>
          </div>
          <button
            onClick={() => { setSelectedOrder(null); setCart([]); setPosSearchTerm(''); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Order</span>
          </button>
        </div>

        <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-light bg-background-muted/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search by order # or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={14} className="text-text-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
                >
                  <option value="all">All Payment</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('orderNumber')}>
                    <div className="flex items-center space-x-1">
                      <span>Order #</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'orderNumber' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'customer' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      <ArrowUpDown size={12} className={sortConfig.key === 'amount' ? 'text-primary' : 'text-text-muted'} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Order</th>
                  <th className="px-6 py-4 text-center">Payment</th>
                  <th className="px-6 py-4 text-center">Method</th>
                  <th className="px-6 py-4 text-center">Kitchen</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-text-secondary font-medium">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-text-muted italic">No orders found</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-background-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-black text-text-primary">{order.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-text-secondary">
                        <div className="flex flex-col">
                          <span>{order.customerDetails?.name}</span>
                          <span className="text-[10px] text-text-muted">{order.customerDetails?.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-text-primary">₹{order.totalAmount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${order.status === 'completed' ? 'bg-primary/10 text-primary border-primary/20' :
                          order.status === 'confirmed' ? 'bg-status-on/10 text-status-available border-status-on/20' :
                            order.status === 'cancelled' ? 'bg-status-off/10 text-status-unavailable border-status-off/20' :
                              'bg-background-muted text-text-muted border-border-light'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${order.paymentStatus === 'paid' ? 'bg-status-on/10 text-status-available border-status-on/20' :
                          order.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            order.paymentStatus === 'refunded' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              'bg-status-off/10 text-status-unavailable border-status-off/20'
                          }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-background-muted text-text-muted text-[8px] font-black uppercase rounded-lg border border-border-light">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(order.kitchenStatus)}`}>
                          {order.kitchenStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handlePrintKOT(order)}
                            className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                            title="Print KOT"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                            className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden print:hidden">
          <div className="bg-background-card w-full max-w-3xl h-[85vh] rounded-[2.5rem] border border-border-light shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-text-primary">{selectedOrder.orderNumber}</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-text-muted hover:text-text-primary">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-3 gap-6 bg-background-muted/20 p-6 rounded-[2rem] border border-border-light">
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Customer Name</p>
                  <input
                    type="text"
                    value={editCustomer.name}
                    onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                    className="bg-transparent text-sm font-black text-text-primary outline-none w-full"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Phone Number</p>
                  <input
                    type="text"
                    value={editCustomer.phone}
                    onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                    className="bg-transparent text-sm font-black text-text-primary outline-none w-full"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Payment Method</p>
                  <p className="text-sm font-black text-text-primary uppercase">{selectedOrder.paymentMethod}</p>
                </div>

                <div className="space-y-1 pt-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Payment Status</p>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handleUpdatePaymentStatus(selectedOrder._id, e.target.value)}
                    className={`text-[10px] font-black uppercase rounded-lg border px-2 py-1 outline-none cursor-pointer ${selectedOrder.paymentStatus === 'paid' ? 'bg-status-on/10 text-status-available border-status-on/20' :
                      selectedOrder.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        selectedOrder.paymentStatus === 'refunded' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                          'bg-status-off/10 text-status-unavailable border-status-off/20'
                      }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="space-y-1 pt-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Order Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                    className="bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/20 px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-end justify-end pt-4">
                  {(editCustomer.name !== (selectedOrder.customerDetails?.name || '') ||
                    editCustomer.phone !== (selectedOrder.customerDetails?.phone || '')) && (
                      <button
                        onClick={handleUpdateCustomerDetails}
                        className="bg-primary text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        Save Changes
                      </button>
                    )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-light pb-2">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Order Items</p>
                  {!selectedOrder.isLocked && selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => { setIsModalOpen(true); }}
                      className="text-[10px] font-black text-primary uppercase hover:underline flex items-center space-x-1"
                    >
                      <Plus size={12} />
                      <span>Add Items</span>
                    </button>
                  )}
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="flex items-center space-x-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Confirmation to start kitchen</p>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-background-muted/20 rounded-2xl border border-border-light hover:border-primary/20 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-background-card rounded-lg flex items-center justify-center border border-border-light">
                          <Utensils size={18} className="text-primary/50" />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{item.name}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase">
                            {item.size} • ₹{item.unitPrice} x {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-text-primary">₹{item.totalPrice}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${selectedOrder.status === 'pending' ? 'bg-background-muted text-text-muted border-border-light opacity-50' : getStatusColor(item.kitchenStatus || 'pending')}`}>
                            {selectedOrder.status === 'pending' ? 'Locked' : (item.kitchenStatus || 'pending')}
                          </span>

                          {!selectedOrder.isLocked && selectedOrder.status === 'confirmed' && item.kitchenStatus === 'pending' && (
                            <button
                              onClick={async () => {
                                if (await showDeleteConfirmation('Cancel Item?', 'Remove this item from the order?')) {
                                  try {
                                    const res = await axios.patch(`${API_BASE_URL}/orders/${selectedOrder._id}/items/${item._id}/remove`);
                                    if (res.data.success) {
                                      showToast('success', 'Item removed');
                                      setSelectedOrder(res.data.data);
                                      setOrders(orders.map(o => o._id === selectedOrder._id ? res.data.data : o));
                                    }
                                  } catch (e) { showToast('error', 'Failed to remove'); }
                                }
                              }}
                              className="p-1.5 text-text-muted hover:text-status-unavailable transition-colors"
                              title="Cancel Item"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-background-muted/30 border-t border-border-light flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Bill Amount</p>
                <p className="text-3xl font-black text-text-primary">₹{selectedOrder.totalAmount}</p>
              </div>
              <button
                onClick={() => handlePrintKOT(selectedOrder)}
                className="flex items-center space-x-2 bg-text-primary text-background-card px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
              >
                <Printer size={18} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden print:hidden">
          <div className="bg-background-card w-full max-w-5xl h-[85vh] rounded-[2.5rem] border border-border-light shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300">
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
                  .filter(item => item.name.toLowerCase().includes(posSearchTerm.toLowerCase()))
                  .map(item => (
                    <div key={item._id} className="bg-background-muted/30 p-3 rounded-2xl border border-border-light hover:border-primary/30 transition-all group">
                      <div className="w-full aspect-square bg-background-card rounded-xl mb-3 overflow-hidden border border-border-light">
                        <img src={item.image || '/placeholder-dish.png'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <p className="font-bold text-text-primary text-xs line-clamp-1 mb-2">{item.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.variants.map((v, idx) => (
                          <button
                            key={idx}
                            onClick={() => addToCart(item, v)}
                            className="px-2 py-1 bg-primary text-white text-[9px] font-black rounded-lg hover:bg-primary-light transition-colors"
                          >
                            {v.size?.name}: ₹{v.price}
                          </button>
                        ))}
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
                  <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase mb-2">Already in Order:</p>
                    <div className="space-y-1">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-text-secondary font-bold">
                          <span>{item.name} ({item.size}) x{item.quantity}</span>
                          <span>₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-background-card p-2 rounded-xl border border-border-light">
                    <User size={14} className="text-text-muted" />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customer.name}
                      onChange={e => setCustomer({ ...customer, name: e.target.value })}
                      className="bg-transparent text-xs font-bold text-text-primary outline-none w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-3 bg-background-card p-2 rounded-xl border border-border-light">
                    <Phone size={14} className="text-text-muted" />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={customer.phone}
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                      className="bg-transparent text-xs font-bold text-text-primary outline-none w-full"
                    />
                  </div>
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

              <div className="p-6 bg-background-card border-t border-border-light space-y-4">
                <div className="flex items-center justify-between text-text-primary">
                  <span className="font-bold text-sm">Total Amount</span>
                  <span className="text-2xl font-black">₹{cart.reduce((acc, i) => acc + i.totalPrice, 0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'upi', 'card'].map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${paymentMethod === m
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-background-muted text-text-muted border-border-light hover:border-primary/50'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isSubmitting
                    ? 'bg-background-muted text-text-muted cursor-not-allowed'
                    : 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  {isSubmitting ? 'Processing Order...' : 'Save Order'}
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
