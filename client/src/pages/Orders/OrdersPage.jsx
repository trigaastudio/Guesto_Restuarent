import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Timer, XCircle, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
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

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchOrders();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
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

  const handleRepayment = async (order) => {
    try {
      setLoading(true);
      // 1. Create Razorpay Order
      const { data: { data: razorpayOrder } } = await api.post('/api/payments/create-order', {
        amount: order.totalAmount,
        currency: 'INR',
        receipt: `receipt_${order.orderNumber}`
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Guest-O Restaurant',
        description: 'Payment for your delicious meal',
        image: '/logo.png',
        order_id: razorpayOrder.id,
        handler: async function (paymentResponse) {
          // 2. Verify Payment and Update Order
          try {
            const verificationData = {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              orderId: order._id
            };

            const { data: verificationResult } = await api.post('/api/payments/verify', verificationData);

            if (verificationResult.success) {
              Swal.fire({
                title: 'Payment Successful!',
                text: 'Your payment has been received.',
                icon: 'success',
                confirmButtonColor: '#DA9133'
              });
              fetchOrders();
            }
          } catch (err) {
            console.error('Payment Verification Failed:', err);
            Swal.fire({
              title: 'Payment Failed',
              text: 'Payment verification failed. You can try again from here.',
              icon: 'error',
              confirmButtonColor: '#DA9133'
            });
          }
        },
        modal: {
          ondismiss: function () {
            // Just refresh the orders to show latest status
            fetchOrders();
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: order.customerDetails?.phone || ''
        },
        theme: {
          color: '#D10000'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Repayment Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Could not initiate payment. Please try again.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
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
      <header className="relative bg-[#D10000] sticky top-0 z-40 transition-all duration-500 shadow-xl">
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

      <main className={`max-w-6xl mx-auto px-6 ${hasOrders ? 'py-4 md:py-8' : 'min-h-[70vh] flex items-center justify-center'} relative z-10 pb-24`}>
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

            <div className="relative">
              <div className="w-44 h-44 bg-white rounded-[4rem] flex items-center justify-center text-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.05)] border border-gray-50 transition-transform duration-1000 hover:rotate-12 group">
                <ShoppingBag size={80} strokeWidth={1} className="text-[#D10000] opacity-10 group-hover:opacity-20 transition-opacity" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#D10000] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-[#D10000]/40 animate-float border-[6px] border-[#FAF9F6]">
                <Package size={32} strokeWidth={2.5} />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter leading-tight">
                No Orders <span className="text-[#D10000]">Found</span>
              </h2>
              <p className="text-xs md:text-sm font-bold text-text-muted tracking-[0.25em] opacity-50 max-w-[400px] mx-auto leading-relaxed uppercase">
                Explore the authentic flavors of Thrissur. Your next favorite meal is waiting to be discovered.
              </p>
            </div>

            <button
              onClick={() => navigate('/home')}
              className="group relative bg-[#D10000] hover:bg-[#B00000] text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-[#D10000]/20 flex items-center gap-2.5 hover:-translate-y-1"
            >
              Start Exploring Menu
              <ArrowLeft className="rotate-180 group-hover:translate-x-2 transition-transform" size={20} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-6 relative z-10">
            {/* Orders List */}
            <div className="space-y-8 relative z-10">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.03)] min-h-[400px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-3 mb-10">
                  <span className="w-6 h-1 bg-[#D10000] rounded-full"></span>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#D10000] tracking-widest uppercase">Order History</p>
                    <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Recent Activity</h3>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-[#FAF9F6] hover:bg-white rounded-[2.5rem] border border-gray-100 hover:border-[#D10000]/20 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group relative">
                      {order.orderStatus === 'cancelled' && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden p-10">
                          <img
                            src="/cancelled.png.png"
                            alt="Cancelled"
                            className="w-full max-w-[250px] object-contain opacity-[0.3] -rotate-12"
                          />
                        </div>
                      )}
                      {/* Order Header */}
                      <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4 border-b border-gray-100/50 bg-white">
                        <div className="flex gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-white shadow-sm text-[#D10000]'}`}>
                            {order.orderStatus === 'cancelled' ? <XCircle size={24} /> : <Package size={24} />}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <h3 className="font-mono font-black text-text-primary text-base md:text-lg tracking-[0.1em] bg-gray-50/50 px-3 py-1 rounded-xl border border-gray-100 flex items-center justify-center">
                                {order.orderNumber || order._id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase ${getStatusColor(order.orderStatus)}`}>
                                {getStatusIcon(order.orderStatus)}
                                {getStatusLabel(order.orderStatus)}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-text-muted tracking-wide">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="md:text-right flex flex-col justify-center">
                          <p className="text-[9px] font-black text-text-muted tracking-widest uppercase opacity-40 mb-1">Total Amount</p>
                          <p className="text-2xl font-black text-text-primary tracking-tighter">₹{order.totalAmount}</p>
                        </div>
                      </div>

                      {/* Order Content */}
                      <div className="p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {/* Items */}
                          <div className="space-y-4">
                            <p className="text-[9px] font-black text-text-muted tracking-widest uppercase opacity-40">Items Summary</p>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group/item">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 p-1">
                                      <img src={item.menuItem?.image || '/placeholder-food.jpg'} alt={item.menuItem?.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                      <h4 className="text-[11px] font-black text-text-primary uppercase tracking-tight">{item.menuItem?.name || 'Deleted Item'}</h4>
                                      <p className="text-[9px] font-bold text-text-muted tracking-widest">
                                        {item.size && <span className="mr-2 text-[#D10000]">{item.size}</span>}
                                        Qty: {item.quantity} × ₹{item.price}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-black text-text-primary tracking-tight">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery & Payment Info */}
                          <div className="bg-white/50 rounded-2xl p-4 border border-gray-100/50 space-y-4">
                            <div>
                              <p className="text-[9px] font-black text-text-muted tracking-widest uppercase opacity-40 mb-3">Delivery Location</p>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#D10000]/10 flex items-center justify-center text-[#D10000] shrink-0">
                                  <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[11px] font-black text-text-primary mb-1 truncate uppercase">{order.customerDetails?.name || user.name}</h4>
                                  <p className="text-[10px] font-bold text-text-muted opacity-70 leading-relaxed line-clamp-2">{order.customerDetails?.address}</p>
                                  {order.customerDetails?.location && (
                                    <p className="text-[9px] font-black text-[#D10000] mt-1 truncate">
                                      📍 {order.customerDetails.location.includes('http') ? 'Map Location Saved' : order.customerDetails.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {order.orderStatus !== 'cancelled' && (
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-text-muted tracking-widest uppercase opacity-40">Payment</span>
                                  <span className="text-[10px] font-black text-text-primary tracking-widest mt-1 uppercase">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-black text-text-muted tracking-widest uppercase opacity-40">Status</span>
                                  <span className={`block text-[10px] font-black tracking-widest mt-1 uppercase ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                    {order.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      {order.orderStatus !== 'cancelled' && (
                        <div className="px-4 md:px-6 py-4 bg-white border-t border-gray-100/50 flex flex-wrap justify-end gap-2">
                          {order.paymentMethod === 'online' && order.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleRepayment(order)}
                              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#DA9133] text-white text-[10px] font-black tracking-widest uppercase hover:bg-[#C27D29] transition-all shadow-lg shadow-[#DA9133]/20 active:scale-95 flex items-center gap-2"
                            >
                              <CreditCard size={14} />
                              Pay Now
                            </button>
                          )}
                          {order.orderStatus === 'placed' && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-red-100 text-[10px] font-black text-red-500 tracking-widest uppercase hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                            >
                              Cancel Order
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/track-order/${order._id}`)}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#D10000]/20 text-[#D10000] text-[10px] font-black tracking-widest uppercase hover:bg-[#D10000] hover:text-white transition-all active:scale-95 shadow-sm"
                          >
                            Track Status
                          </button>
                          <button
                            onClick={() => navigate('/home')}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#D10000] text-white text-[10px] font-black tracking-widest uppercase hover:bg-[#B00000] transition-all shadow-lg shadow-[#D10000]/20 active:scale-95"
                          >
                            Reorder
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {!loading && hasOrders && <Footer />}
    </div>
  );
};

export default OrdersPage;
