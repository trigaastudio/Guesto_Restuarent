import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Timer, XCircle, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useRef, useMemo } from 'react';
import Swal from 'sweetalert2';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { cartItems } = useCart();
  const { theme } = useTheme();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/my-orders');
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      const result = await Swal.fire({
        title: 'Cancel Order?',
        text: "Are you sure you want to cancel this order?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#D10000',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, cancel it!'
      });

      if (result.isConfirmed) {
        const response = await api.put(`/api/orders/${orderId}/cancel`);
        if (response.data.success) {
          Swal.fire('Cancelled!', 'Your order has been cancelled.', 'success');
          fetchOrders();
        }
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to cancel order', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50 border-green-100';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'out-for-delivery': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      case 'placed': return 'text-orange-500 bg-orange-50 border-orange-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 size={14} />;
      case 'processing': return <Timer size={14} />;
      case 'out-for-delivery': return <Truck size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      case 'placed': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'placed': return 'Placed';
      case 'processing': return 'Preparing';
      case 'out-for-delivery': return 'On the way';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const hasOrders = orders.length > 0 || loading;

  return (
    <div className={`min-h-screen bg-background font-sans overflow-x-hidden ${theme}`}>
      {hasOrders && (
        <header className="relative bg-[#D10000] sticky top-0 z-40 transition-all duration-500 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] pointer-events-none"></div>

          <Navbar
            user={user}
            cartItems={cartItems}
            showUserDropdown={showUserDropdown}
            setShowUserDropdown={setShowUserDropdown}
            handleLogout={handleLogout}
            navigate={navigate}
            dropdownRef={dropdownRef}
          />
        </header>
      )}

      <main className={`max-w-5xl mx-auto px-6 ${hasOrders ? 'pt-10 pb-20' : 'min-h-screen flex items-center justify-center'}`}>
        {loading ? (
          <div className="space-y-6 w-full">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-48 bg-white rounded-[2rem] animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-10 px-10 text-center space-y-10 relative overflow-hidden animate-in fade-in zoom-in duration-1000">
            {/* Background Cinematic Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D10000]/3 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#DA9133]/3 rounded-full blur-[100px] pointer-events-none animate-bounce-slow"></div>

            <div className="relative">
              <div className="w-44 h-44 bg-white rounded-[4rem] flex items-center justify-center text-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.05)] border border-gray-50 transition-transform duration-1000 hover:rotate-12 group">
                <ShoppingBag size={80} strokeWidth={1} className="text-[#D10000] opacity-10 group-hover:opacity-20 transition-opacity" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#D10000] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-[#D10000]/40 animate-float border-[6px] border-[#FAF9F6]">
                <Package size={32} strokeWidth={2.5} />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md px-5 py-2 rounded-full border border-gray-100 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#DA9133] animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#DA9133]">Ready for your first order?</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter uppercase leading-tight">
                No Orders <span className="text-[#D10000]">Found</span>
              </h2>
              <p className="text-xs md:text-sm font-bold text-text-muted uppercase tracking-[0.25em] opacity-50 max-w-[400px] mx-auto leading-relaxed">
                Explore the authentic flavors of Thrissur. Your next favorite meal is waiting to be discovered.
              </p>
            </div>

            <button
              onClick={() => navigate('/home')}
              className="group relative bg-[#DA9133] hover:bg-[#C27D29] text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl shadow-[#DA9133]/40 flex items-center gap-4 hover:-translate-y-1"
            >
              Start Exploring Menu
              <ArrowLeft className="rotate-180 group-hover:translate-x-2 transition-transform" size={20} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_15px_50px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_25px_80px_rgba(0,0,0,0.05)] transition-all duration-500">
                {/* ... (rest of order items) */}
                {/* Order Header */}
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6 bg-gray-50/30">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-[#D10000]/10 text-[#D10000]'}`}>
                      {order.orderStatus === 'cancelled' ? <XCircle size={24} /> : <Package size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-text-primary text-lg">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</h3>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {getStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-text-muted opacity-60">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Total Amount</p>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">₹{order.totalAmount}</p>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Items */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Items Summary</p>
                      <div className="space-y-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                <img src={item.menuItem?.image || '/placeholder-food.jpg'} alt={item.menuItem?.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-text-primary">{item.menuItem?.name || 'Deleted Item'}</h4>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                  {item.size && <span className="mr-2 text-[#D10000]">{item.size}</span>}
                                  Qty: {item.quantity} × ₹{item.price}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-text-primary">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Payment */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Delivery To</p>
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="text-[#D10000] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-black text-text-primary mb-1">{order.address?.recipientName}</h4>
                            <p className="text-xs font-bold text-text-muted opacity-70 leading-relaxed max-w-xs">{order.address?.address}</p>
                          </div>
                        </div>
                      </div>

                      {order.orderStatus !== 'cancelled' && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Payment Method</span>
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest mt-1">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                          </div>
                          <div className="text-right">
                            {order.paymentMethod !== 'cod' && (
                              <>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</span>
                                <span className={`block text-[10px] font-black uppercase tracking-widest mt-1 ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                                  {order.paymentStatus}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Footer Actions */}
                {order.orderStatus !== 'cancelled' && (
                  <div className="px-6 md:px-8 py-5 bg-gray-50/50 border-t border-gray-50 flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                    {order.orderStatus === 'placed' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="w-full md:w-auto px-6 py-3 rounded-xl border border-red-200 text-[10px] md:text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/track-order/${order._id}`)}
                      className="w-full md:w-auto px-6 py-3 rounded-xl border border-[#DA9133] text-[#DA9133] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#DA9133] hover:text-white transition-all active:scale-95"
                    >
                      Track Order
                    </button>
                    <button
                      onClick={() => navigate('/home')}
                      className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#DA9133] text-white text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#C27D29] transition-all shadow-lg shadow-[#DA9133]/20 active:scale-95"
                    >
                      Reorder Items
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </main>
      {!loading && hasOrders && <Footer />}
    </div>
  );
};

export default OrdersPage;
