import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, CheckCircle2, Truck, Timer, MapPin, 
  Phone, MessageSquare, ChevronRight, Clock, Star, 
  Home, HelpCircle, XCircle, Info
} from 'lucide-react';
import api from '../../api/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';
import StoreStatusBanner from '../../components/StoreStatus/StoreStatusBanner';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import socket from '../../services/socket';
import Loader from '../../components/Loader/Loader';
import Swal from 'sweetalert2';

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrderDetails();

    socket.connect();
    const onConnect = () => {
      socket.emit('joinOrder', orderId);
    };

    const onOrderStatusUpdate = ({ status, kitchenStatus }) => {
      setOrder(prev => prev ? { ...prev, orderStatus: status, kitchenStatus } : null);
    };

    socket.on('connect', onConnect);
    socket.on('orderStatusUpdated', onOrderStatusUpdate);

    if (socket.connected) onConnect();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.off('connect', onConnect);
      socket.off('orderStatusUpdated', onOrderStatusUpdate);
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [orderId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/api/orders/my-orders`);
      if (response.data.success) {
        const foundOrder = response.data.data.find(o => o._id === orderId);
        setOrder(foundOrder);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
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
          fetchOrderDetails();
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

  if (loading) return <Loader fullPage={true} />;

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6">
          <Package size={40} />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">Order Not Found</h2>
        <p className="text-[10px] font-bold text-text-muted opacity-60 mb-8 uppercase tracking-widest">We couldn't find the order you're looking for.</p>
        <button onClick={() => navigate('/my-orders')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 active:scale-95 transition-all">Back to Orders</button>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const orderDate = formatDate(order.createdAt);

  // Base steps
  let steps = [
    { id: 'placed', label: 'Order placed', color: 'text-primary', bg: 'bg-primary/5', dot: 'bg-primary', description: 'Your order has been received' },
    { id: 'accepted', label: 'Order accepted', color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500', description: 'Admin has approved your order' },
    { id: 'preparing', label: 'Order preparing', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', description: 'Chef is preparing your meal' },
    { id: 'out-for-delivery', label: 'On the way', color: 'text-indigo-600', bg: 'bg-indigo-50', dot: 'bg-indigo-600', description: 'Our delivery partner is nearby' },
    { id: 'delivered', label: 'Delivered', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-600', description: 'Enjoy your meal!' }
  ];

  // Logic to determine current tracking step
  let activeStepIndex = 0;
  if (order.orderStatus === 'cancelled') {
    const cancelStep = { id: 'cancelled', label: 'Order cancelled', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-600', description: 'This order has been cancelled' };
    
    // Determine where the order was before cancellation to place the 'Cancelled' step correctly
    if (order.kitchenStatus !== 'placed') {
      // If it somehow got cancelled while preparing
      steps = [steps[0], steps[1], steps[2], cancelStep];
      activeStepIndex = 3;
    } else if (order.orderStatus === 'processing' || (order.paymentStatus === 'paid' && order.orderStatus === 'placed')) {
      // If it was accepted or paid
      steps = [steps[0], steps[1], cancelStep];
      activeStepIndex = 2;
    } else {
      // If it was just placed
      steps = [steps[0], cancelStep];
      activeStepIndex = 1;
    }
  } else if (order.orderStatus === 'delivered') {
    activeStepIndex = 4;
  } else if (order.orderStatus === 'out-for-delivery') {
    activeStepIndex = 3;
  } else if (order.kitchenStatus === 'preparing' || order.kitchenStatus === 'ready') {
    activeStepIndex = 2;
  } else if (order.orderStatus === 'processing') {
    activeStepIndex = 1;
  } else {
    activeStepIndex = 0;
  }

  const activeStep = steps[activeStepIndex] || steps[0];
  const mainItem = order.items[0];

  return (
    <div className={`min-h-screen bg-background font-sans selection:bg-primary/10 overflow-x-hidden ${theme}`}>
      <div className="relative w-full overflow-hidden flex flex-col bg-primary">
        <div className="absolute inset-0 z-0 bg-primary"></div>
        
        <StoreStatusBanner />
        
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />
        
        {/* Spacer for Navbar visibility */}
        <div className="h-24 md:h-32"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 relative">
        {/* Breadcrumb / Back button */}
        <button
          onClick={() => navigate('/my-orders')}
          className="flex items-center gap-2 text-[11px] font-bold text-text-muted hover:text-primary mb-8 transition-all"
        >
          <ArrowLeft size={14} />
          Back to all orders
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Tracking & Items */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Product & Tracking Card */}
            <div className="bg-background-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              {/* Product Header */}
              <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-background rounded-lg border border-border/40 p-2 flex-shrink-0">
                  <img 
                    src={mainItem?.menuItem?.image || '/placeholder-food.jpg'} 
                    alt={mainItem?.menuItem?.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-text-primary leading-tight mb-1">
                    {mainItem?.menuItem?.name} {order.items.length > 1 ? `& ${order.items.length - 1} more items` : ''}
                  </h1>
                  <p className="text-xs text-text-muted mb-2 font-medium">Order ID: <span className="font-bold text-text-primary">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span></p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-text-primary">₹{order.totalAmount}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'text-green-600 bg-green-50' : 'text-primary bg-primary/10'}`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Payment pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Stepper (Project Theme Style) */}
              <div className="p-6 md:p-10">
                <div className="relative">
                  {steps.map((step, index) => {
                    const isCompleted = index <= activeStepIndex;
                    const isActive = index === activeStepIndex;
                    const isLast = index === steps.length - 1;

                    return (
                      <div key={step.id} className="relative flex gap-6 pb-8 last:pb-0">
                        {/* Vertical Line */}
                        {!isLast && (
                          <div className={`absolute left-[11px] top-6 bottom-[-8px] w-[2px] ${index < activeStepIndex ? step.dot : 'bg-border/40 border-dashed border-l-[2px]'}`}>
                          </div>
                        )}

                        {/* Icon/Circle */}
                        <div className="relative z-10">
                          {isCompleted ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ${step.dot}`}>
                              <CheckCircle2 size={14} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-border/60 bg-background flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-border/40"></div>
                            </div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className={`flex-1 -mt-1 ${isActive ? `${step.bg} -mx-4 px-4 py-4 rounded-xl border border-border/10 shadow-sm` : ''}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h3 className={`text-sm font-bold ${isCompleted ? 'text-text-primary' : 'text-text-muted opacity-60'}`}>
                              {step.label}, <span className="font-semibold">{index === 0 ? orderDate : 'Today'}</span>
                            </h3>
                          </div>
                          <p className={`text-[11px] font-semibold leading-relaxed ${isCompleted ? 'text-text-muted' : 'text-text-muted/40'}`}>
                            {step.description}
                          </p>
                          {isActive && (
                            <div className="mt-4">
                              <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline group">
                                See all updates <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border/40 grid grid-cols-2">
                {order.orderStatus !== 'cancelled' && 
                 order.orderStatus !== 'delivered' && 
                 order.orderStatus !== 'out-for-delivery' && 
                 order.kitchenStatus === 'placed' ? (
                  <button 
                    className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-text-secondary hover:bg-background transition-colors border-r border-border/40"
                    onClick={handleCancelOrder}
                  >
                    <XCircle size={18} className="text-text-muted" />
                    Cancel
                  </button>
                ) : (
                   <button 
                    className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-text-muted opacity-50 cursor-not-allowed border-r border-border/40"
                    disabled
                  >
                    <XCircle size={18} />
                    {order.orderStatus === 'cancelled' ? 'Cancelled' : (order.orderStatus === 'delivered' ? 'Delivered' : 'In Progress')}
                  </button>
                )}
                <button 
                  className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-text-secondary hover:bg-background transition-colors"
                  onClick={() => navigate('/about')}
                >
                  <MessageSquare size={18} className="text-text-muted" />
                  Chat with us
                </button>
              </div>
            </div>

            {/* Support Action */}
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-1">Need help with your order?</h4>
                <p className="text-[11px] text-text-muted font-semibold">Our support team is available 24/7</p>
              </div>
              <button className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-lg shadow-primary/20">
                Contact support
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar Details */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            
            {/* Delivery Details Card */}
            <div className="bg-background-card rounded-2xl border border-border/60 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h2 className="text-sm font-bold text-text-primary mb-6 relative z-10">Delivery details</h2>
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-text-muted shrink-0 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <Home size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-text-primary">Home</span>
                      <ChevronRight size={16} className="text-text-muted/40 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-text-muted font-semibold line-clamp-2 leading-relaxed">
                      {order.customerDetails?.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group cursor-pointer border-t border-border/40 pt-6">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-text-muted shrink-0 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="text-[8px] font-bold">{order.customerDetails?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-text-primary truncate">
                        {order.customerDetails?.name}
                      </span>
                      <ChevronRight size={16} className="text-text-muted/40 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-text-muted font-semibold">
                      {order.customerDetails?.phone || order.customerDetails?.mobile}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details Card */}
            <div className="bg-background-card rounded-2xl border border-border/60 shadow-sm p-6 relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <h2 className="text-sm font-bold text-text-primary mb-6 relative z-10">Price details</h2>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-semibold text-text-muted">
                  <span>Listing price</span>
                  <span className="font-bold text-text-primary">₹{order.subtotal || (order.totalAmount - (order.deliveryFee || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-text-muted">
                  <span className="flex items-center gap-1.5">
                    Delivery fees <HelpCircle size={12} className="text-text-muted/60" />
                  </span>
                  <span className="font-bold text-text-primary">₹{order.deliveryFee || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-green-600">
                  <span>Special discount</span>
                  <span className="font-bold">-₹0</span>
                </div>
                
                <div className="pt-4 border-t border-border/40 border-dashed">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-text-primary">Total amount</span>
                    <span className="text-2xl font-bold text-text-primary tracking-tighter">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted opacity-60">
                    <span>Paid by</span>
                    <span className="text-text-primary">{order.paymentMethod === 'online' ? 'Online payment' : 'Cash on delivery'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 relative z-10 group overflow-hidden">
                <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-[0.02] transition-opacity"></div>
                <Star size={16} className="text-green-600 fill-green-600" />
                <p className="text-[10px] font-bold text-green-700">
                  You earned 5 reward points
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrderPage;
