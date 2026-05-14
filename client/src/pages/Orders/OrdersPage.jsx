import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Timer, XCircle, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { cartItems, settings } = useCart();
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
    navigate('/login', { replace: true });
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
        confirmButtonColor: '#B91C1C',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, cancel it!',
        customClass: {
          popup: 'rounded-[2rem] bg-background-card text-text-primary',
          title: 'text-text-primary',
          htmlContainer: 'text-text-muted'
        }
      });

      if (result.isConfirmed) {
        const response = await api.put(`/api/orders/${orderId}/cancel`);
        if (response.data.success) {
          Swal.fire({
            title: 'Cancelled!',
            text: 'Your order has been cancelled.',
            icon: 'success',
            confirmButtonColor: '#B91C1C',
            customClass: {
              popup: 'rounded-[2rem] bg-background-card text-text-primary'
            }
          });
          fetchOrders();
        }
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to cancel order',
        icon: 'error',
        confirmButtonColor: '#B91C1C',
        customClass: {
          popup: 'rounded-[2rem] bg-background-card text-text-primary'
        }
      });
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
        name: settings?.restaurantDetails?.name || 'Guest-O Restaurant',
        description: 'Payment for your delicious meal',
        image: `${window.location.origin}${settings?.branding?.logoGold || '/logo-golden.png'}`,
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
                confirmButtonColor: '#B91C1C',
                customClass: {
                  popup: 'rounded-[2rem] bg-background-card text-text-primary'
                }
              });
              fetchOrders();
            }
          } catch (err) {
            console.error('Payment Verification Failed:', err);
            Swal.fire({
              title: 'Payment Failed',
              text: 'Payment verification failed. You can try again from here.',
              icon: 'error',
              confirmButtonColor: '#B91C1C',
              customClass: {
                popup: 'rounded-[2rem] bg-background-card text-text-primary'
              }
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
          color: '#B91C1C'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Repayment Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Could not initiate payment. Please try again.',
        icon: 'error',
        confirmButtonColor: '#B91C1C',
        customClass: {
          popup: 'rounded-[2rem] bg-background-card text-text-primary'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'out-for-delivery': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'placed': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-text-muted bg-text-muted/10 border-border/40';
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
      <Navbar
        user={user}
        cartItems={cartItems}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        handleLogout={handleLogout}
        navigate={navigate}
        dropdownRef={dropdownRef}
      />

      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background-card/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

        <main className={`max-w-7xl mx-auto px-6 pt-24 md:pt-32 ${hasOrders ? '' : 'min-h-[70vh] flex items-center justify-center'} relative z-10 pb-24`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 w-full">
              <Loader size="large" />
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
                Fetching your orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-10 px-10 text-center space-y-10 relative overflow-hidden animate-in fade-in zoom-in duration-1000">
              {/* Background Cinematic Effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

              <div className="relative">
                <div className="w-44 h-44 bg-background-card rounded-[4rem] flex items-center justify-center text-text-muted/10 shadow-[0_25px_60px_rgba(0,0,0,0.05)] border border-border/40 transition-transform duration-1000 hover:rotate-12 group">
                  <ShoppingBag size={80} strokeWidth={1} className="text-primary opacity-10 group-hover:opacity-20 transition-opacity" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/40 animate-float border-[6px] border-background">
                  <Package size={56} strokeWidth={2.5} />
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter leading-tight uppercase">
                  No Orders <span className="text-primary">Found</span>
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-text-muted tracking-[0.25em] opacity-70 max-w-[400px] mx-auto leading-relaxed uppercase">
                  Explore the authentic flavors of Thrissur. Your next favorite meal is waiting to be discovered.
                </p>
              </div>

              <button
                onClick={() => navigate('/home')}
                className="group relative bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center gap-2.5 hover:-translate-y-1 uppercase"
              >
                Start Exploring Menu
                <ArrowLeft className="rotate-180 group-hover:translate-x-2 transition-transform" size={20} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto w-full space-y-6 relative z-10">
              {/* Orders List */}
              <div className="space-y-8 relative z-10">
                <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.03)] min-h-[400px] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex items-center gap-3 mb-10">
                    <span className="w-6 h-1 bg-primary rounded-full"></span>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary tracking-widest lowercase">order history</p>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">recent activity</h3>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    {orders.map((order) => (
                      <div key={order._id} className="bg-background hover:bg-background-card rounded-[2.5rem] border border-border/40 hover:border-primary/20 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group relative">
                        {order.orderStatus === 'cancelled' && (
                          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden p-10">
                            <img
                              src="/cancelled.png.png"
                              alt="Cancelled"
                              className="w-full max-w-[250px] object-contain opacity-[0.3] dark:opacity-[0.1] -rotate-12"
                            />
                          </div>
                        )}
                        {/* Order Header */}
                        <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4 border-b border-border/20 bg-background-card">
                          <div className="flex gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${order.orderStatus === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-background shadow-sm text-primary'}`}>
                              {order.orderStatus === 'cancelled' ? <XCircle size={24} /> : <Package size={24} />}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border lowercase ${getStatusColor(order.orderStatus)}`}>
                                  {getStatusIcon(order.orderStatus)}
                                  {getStatusLabel(order.orderStatus)?.toLowerCase()}
                                </span>
                                <p className="text-[10px] font-bold text-text-muted tracking-wide">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <h3 className="font-mono font-black text-text-primary text-base md:text-lg tracking-[0.1em] bg-background/50 px-3 py-1 rounded-xl border border-border/40 w-fit flex items-center justify-center mt-2">
                                {order.orderNumber || order._id.slice(-8).toUpperCase()}
                              </h3>
                            </div>
                          </div>
                          <div className="md:text-right flex flex-col justify-center">
                            <p className="text-[9px] font-black text-text-muted tracking-widest lowercase opacity-60 mb-1">total amount</p>
                            <p className="text-2xl font-black text-primary tracking-tighter">₹{order.totalAmount}</p>
                          </div>
                        </div>

                        {/* Order Content */}
                        <div className="p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Items */}
                            <div className="space-y-4">
                              <p className="text-[9px] font-black text-text-muted tracking-widest lowercase opacity-60">items summary</p>
                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between group/item">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background-card border border-border/40 p-1">
                                        <img src={item.image || item.menuItem?.image || '/placeholder-food.jpg'} alt={item.name || item.menuItem?.name || 'Item'} className="w-full h-full object-contain" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-black text-text-primary tracking-tight truncate lowercase">{item.name || item.menuItem?.name || 'deleted item'}</h4>
                                        <p className="text-[9px] font-bold text-text-muted tracking-widest lowercase">
                                          {item.size && <span className="mr-2 text-primary">{item.size}</span>}
                                          qty: {item.quantity} × ₹{item.price || item.menuItem?.price || 0}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-black text-text-primary tracking-tight">₹{(item.price || item.menuItem?.price || 0) * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Delivery & Payment Info */}
                            <div className="bg-background/50 rounded-2xl p-4 border border-border/40 space-y-4">
                              <div>
                                <p className="text-[9px] font-black text-text-muted tracking-widest lowercase opacity-60 mb-3">delivery location</p>
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <MapPin size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-[11px] font-black text-text-primary mb-1 truncate lowercase">{order.customerDetails?.name || user.name}</h4>
                                    <p className="text-[10px] font-bold text-text-muted opacity-70 leading-relaxed line-clamp-2 lowercase">{order.customerDetails?.address}</p>
                                    {order.customerDetails?.location && (
                                      <p className="text-[9px] font-black text-primary mt-1 truncate">
                                        📍 {order.customerDetails.location.includes('http') ? 'map location saved' : order.customerDetails.location?.toLowerCase()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {order.orderStatus !== 'cancelled' && (
                                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-text-muted tracking-widest lowercase opacity-60">payment</span>
                                    <span className="text-[10px] font-black text-text-primary tracking-widest mt-1 lowercase">{order.paymentMethod === 'cod' ? 'cash on delivery' : 'online payment'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-black text-text-muted tracking-widest lowercase opacity-60">status</span>
                                    <span className={`block text-[10px] font-black tracking-widest mt-1 lowercase ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
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
                          <div className="px-4 md:px-6 py-4 bg-background-card border-t border-border/20 flex flex-wrap justify-end gap-2">
                            {order.paymentMethod === 'online' && order.paymentStatus === 'unpaid' && (
                              <button
                                onClick={() => handleRepayment(order)}
                                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-orange-500 text-white text-[10px] font-black tracking-widest lowercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
                              >
                                <CreditCard size={14} />
                                pay now
                              </button>
                            )}
                            {order.orderStatus === 'placed' && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-red-500/20 text-[10px] font-black text-red-500 tracking-widest lowercase hover:bg-red-500/10 transition-all active:scale-95 shadow-sm"
                              >
                                cancel order
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/track-order/${order._id}`)}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-primary/20 text-primary text-[10px] font-black tracking-widest lowercase hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                            >
                              track status
                            </button>
                            <button
                              onClick={() => navigate('/home')}
                              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black tracking-widest lowercase hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                            >
                              reorder
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
      </div>
      {!loading && hasOrders && <Footer />}
    </div>
  );
};

export default OrdersPage;
