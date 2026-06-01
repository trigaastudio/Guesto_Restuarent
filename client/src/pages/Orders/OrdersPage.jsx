import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Timer, XCircle, ShoppingBag, MapPin, CreditCard, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';
import { logoutToLanding } from '../../utils/auth';
import socket from '../../services/socket';
import Pagination from '../../components/Pagination/Pagination';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const dropdownRef = useRef(null);

  const { cartItems, settings } = useCart();
  const { theme } = useTheme();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  useEffect(() => {
    window.scrollTo(0, 0);

    
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

  useEffect(() => {
    socket.connect();
    
    if (user && user._id) {
      socket.emit('joinUser', user._id);
    }

    const onOrderStatusUpdate = (data) => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order._id === data.orderId) {
            return {
              ...order,
              orderStatus: data.status,
              kitchenStatus: data.kitchenStatus
            };
          }
          return order;
        })
      );
    };

    socket.on('orderStatusUpdated', onOrderStatusUpdate);

    // Also listen to general ordersUpdated as fallback
    const onOrdersUpdatedFallback = () => {
      fetchOrders();
    };
    socket.on('ordersUpdated', onOrdersUpdatedFallback);

    const refreshTimer = setInterval(() => {
      fetchOrders();
    }, 60000);

    return () => {
      socket.off('orderStatusUpdated', onOrderStatusUpdate);
      socket.off('ordersUpdated', onOrdersUpdatedFallback);
      clearInterval(refreshTimer);
    };
  }, [user?._id]);

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
    logoutToLanding(navigate);
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
        scrollbarPadding: false,
        heightAuto: false,
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
            scrollbarPadding: false,
            heightAuto: false,
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
        scrollbarPadding: false,
        heightAuto: false,
        customClass: {
          popup: 'rounded-[2rem] bg-background-card text-text-primary'
        }
      });
    }
  };

  const handleRepayment = async (order) => {
    try {
      setLoading(true);
      
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

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

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
              {}
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
              {}
              <div className="space-y-8 relative z-10">
                <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.03)] min-h-[400px] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-1 bg-primary rounded-full"></span>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-primary tracking-widest uppercase">Order History</p>
                        <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Recent Activity</h3>
                      </div>
                    </div>
                    <button
                      onClick={fetchOrders}
                      className="p-2.5 rounded-xl bg-background border border-border/40 text-text-muted hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm"
                      title="Refresh Orders"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : ''} />
                    </button>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {currentOrders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="bg-background rounded-xl border border-border/60 hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer active:scale-[0.99]"
                      >
                        {}
                        <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-6">

                          {}
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-background-muted/30 rounded-lg p-2 border border-border/20 flex-shrink-0 flex items-center justify-center relative">
                            <img
                              src={order.items[0]?.image || order.items[0]?.menuItem?.image || '/placeholder-food.jpg'}
                              alt="order item"
                              className="w-full h-full object-contain"
                            />
                            {order.items.length > 1 && (
                              <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                +{order.items.length - 1}
                              </div>
                            )}
                          </div>

                          {}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="space-y-0.5">
                              <h4 className="text-sm md:text-base font-black text-text-primary tracking-tight truncate capitalize group-hover:text-primary transition-colors">
                                {order.items[0]?.name || order.items[0]?.menuItem?.name}
                              </h4>
                              {order.items.length > 1 && (
                                <p className="text-[11px] font-bold text-text-muted hover:text-primary transition-colors cursor-pointer">
                                  + {order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <p className="text-[11px] font-medium text-text-muted">
                                Order ID: <span className="font-bold text-text-primary uppercase tracking-wider">{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                              </p>
                              {order.items[0]?.size && (
                                <p className="text-[11px] font-medium text-text-muted">
                                  Size: <span className="font-bold text-text-primary uppercase">{order.items[0].size}</span>
                                </p>
                              )}
                              <p className="text-[11px] font-medium text-text-muted">
                                Qty: <span className="font-bold text-text-primary">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                              </p>
                            </div>
                            <p className="text-[10px] font-medium text-text-muted opacity-60">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          {}
                          <div className="w-full md:w-auto md:min-w-[120px] md:text-center">
                            <p className="text-lg font-black text-text-primary tracking-tighter">₹{(order.subtotal || 0) + (order.deliveryFee || 0) + (order.platformFee || 0) + (order.tax || 0)}</p>
                            <div className="flex items-center gap-1.5 md:justify-center mt-0.5">
                              {order.orderStatus !== 'cancelled' && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600 animate-pulse'}`}>
                                  {order.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>

                          {}
                          <div className="w-full md:w-auto md:min-w-[200px] space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${order.orderStatus === 'delivered' ? 'bg-emerald-500' :
                                  order.orderStatus === 'cancelled' ? 'bg-red-500' :
                                    'bg-primary animate-pulse'
                                }`}></div>
                              <span className="text-sm font-black text-text-primary tracking-tight">
                                {getStatusLabel(order.orderStatus)}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium leading-tight">
                              {order.orderStatus === 'delivered' ? <p className="text-text-muted">Your meal has been delivered</p> :
                                order.orderStatus === 'cancelled' ? (
                                  order.rejectionReason ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2 mt-1.5 inline-block">
                                      <p className="text-red-600 font-bold tracking-wide">
                                        <span className="opacity-70 uppercase text-[9px] mr-1">Reason:</span>
                                        {order.rejectionReason}
                                      </p>
                                    </div>
                                  ) : <p className="text-text-muted">This order was cancelled</p>
                                ) :
                                  order.orderStatus === 'processing' ? <p className="text-text-muted">Your feast is being prepared by our chef</p> :
                                    <p className="text-text-muted">Your order is being processed</p>}
                            </div>
                          </div>

                          {}
                          <div className="w-full md:w-auto flex items-center justify-end gap-4 min-w-[150px]">
                            {order.orderStatus !== 'cancelled' && (
                              <div className="flex items-center gap-3 w-full justify-end">
                                {}

                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/track-order/${order._id}`); }}
                                  className="flex-1 md:flex-none px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <Truck size={14} strokeWidth={3} />
                                  Track Order
                                </button>
                              </div>
                            )}

                            {}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pt-6 mt-6 border-t border-border/40 relative z-10 flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-background-card rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300">
            {}
            <div className="p-6 md:p-8 border-b border-border/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Order Details</p>
                <h3 className="text-xl font-black text-text-primary tracking-tight">#{selectedOrder.orderNumber || selectedOrder._id.slice(-8).toUpperCase()}</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-10 h-10 rounded-full bg-background-muted/50 flex items-center justify-center text-text-muted hover:text-primary transition-colors active:scale-90"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            {}
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-background-muted/20 border border-border/5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-background border border-border/10 p-2 flex-shrink-0">
                        <img
                          src={item.image || item.menuItem?.image || '/placeholder-food.jpg'}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-text-primary tracking-tight capitalize">{item.name || item.menuItem?.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                            Qty: {item.quantity}
                          </span>
                          {item.size && (
                            <span className="text-[11px] font-bold text-text-muted opacity-60 uppercase">
                              {item.size}
                            </span>
                          )}
                        </div>

                        {/* Combo Items */}
                        {item.comboItems?.length > 0 && (
                          <div className="mt-1.5 space-y-1 pl-2 border-l-2 border-primary/20">
                            <span className="text-[8px] font-bold text-primary uppercase tracking-wider block">Combo includes:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.comboItems.map((ci, cIdx) => (
                                <span key={cIdx} className="inline-flex items-center text-text-muted text-[9px] font-semibold">
                                  {ci.quantity || 1}x {ci.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BOGO Items */}
                        {item.bogoItem && (
                          <div className="mt-1.5 space-y-1 pl-2 border-l-2 border-emerald-500/30">
                            <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider block">Free Add-on:</span>
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center text-text-muted text-[9px] font-semibold">
                                🎁 {item.bogoItem.quantity || item.quantity}x {item.bogoItem.name} {item.bogoItem.size ? `(${item.bogoItem.size})` : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Included Items (Add-ons) */}
                        {item.includedItems?.length > 0 && (
                          <div className="mt-1.5 space-y-1 pl-2 border-l-2 border-primary/20">
                            <span className="text-[8px] font-bold text-primary uppercase tracking-wider block">Includes Add-ons:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.includedItems.map((ii, iIdx) => (
                                <span key={iIdx} className="inline-flex items-center text-text-muted text-[9px] font-semibold">
                                  {ii.quantity || 1}x {ii.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && hasOrders && <Footer />}
    </div>
  );
};

export default OrdersPage;
