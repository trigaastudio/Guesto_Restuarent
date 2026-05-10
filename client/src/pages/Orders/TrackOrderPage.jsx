import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Truck, Timer, MapPin, Phone, MessageSquare, ChevronRight, Clock, Star } from 'lucide-react';
import api from '../../api/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import socket from '../../services/socket';

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

    // Socket setup
    socket.connect();

    const onConnect = () => {
      console.log('Connected to socket server');
      socket.emit('joinOrder', orderId);
    };

    const onOrderStatusUpdate = ({ status }) => {
      console.log('Received status update:', status);
      setOrder(prev => prev ? { ...prev, orderStatus: status } : null);
    };

    socket.on('connect', onConnect);
    socket.on('orderStatusUpdated', onOrderStatusUpdate);

    if (socket.connected) {
      onConnect();
    }

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
    window.location.replace('/login');
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

  const statusSteps = [
    { id: 'placed', label: 'Order Placed', icon: <Package size={20} />, description: 'Your order has been received' },
    { id: 'processing', label: 'Preparing', icon: <Timer size={20} />, description: 'Chef is working their magic' },
    { id: 'out-for-delivery', label: 'On The Way', icon: <Truck size={20} />, description: 'Our delivery partner is nearby' },
    { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={20} />, description: 'Enjoy your meal!' }
  ];

  const getActiveStep = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.id === order.orderStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6">
          <Package size={40} />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 tracking-tight uppercase">Order Not Found</h2>
        <p className="text-[10px] font-black text-text-muted opacity-60 mb-8 uppercase tracking-[0.2em]">We couldn't find the order you're looking for.</p>
        <button onClick={() => navigate('/my-orders')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 active:scale-95 transition-all">Back to Orders</button>
      </div>
    );
  }

  const activeStepIndex = getActiveStep();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'placed': return 'Placed';
      case 'processing': return 'Preparing';
      case 'out-for-delivery': return 'On the way';
      case 'delivered':
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className={`min-h-screen bg-background font-sans selection:bg-primary/10 overflow-x-hidden ${theme}`}>
      <Navbar
        user={user}
        cartItems={cartItems}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        handleLogout={handleLogout}
        navigate={navigate}
        dropdownRef={dropdownRef}
        hideCart={true}
      />

      <div className="relative">
        {/* Themed Header Container */}
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background-card/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

        <main className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 relative z-10 pb-24">
          {/* Top Navigation & Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="space-y-4">
              <button
                onClick={() => navigate('/my-orders')}
                className="flex items-center gap-2 text-[10px] font-black text-white/80 hover:text-white tracking-[0.2em] uppercase transition-all group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                Back to Orders
              </button>
              <div className="flex flex-wrap items-center gap-6">
                <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tighter flex items-center gap-4 flex-wrap">
                  Track Order
                  <span className="font-mono bg-background-card text-primary px-6 py-1.5 rounded-2xl border border-border/40 text-xl md:text-3xl tracking-[0.1em] shadow-xl">
                    #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </span>
                </h1>
              </div>
            </div>
            
            <div className="bg-background-card px-6 py-4 rounded-3xl shadow-xl shadow-black/5 border border-border/40 flex items-center gap-4 animate-in slide-in-from-right-4 duration-700">
              <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">Current Status</p>
                <p className="text-sm font-black text-primary uppercase tracking-widest animate-pulse">{getStatusLabel(order.orderStatus)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left Column: Tracking Stepper & Driver */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-background-card rounded-[3.5rem] p-8 md:p-12 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                {/* Status Stepper */}
                <div className="relative space-y-12">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= activeStepIndex;
                    const isActive = index === activeStepIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                      <div key={step.id} className="relative flex gap-8 md:gap-12 group">
                        {/* Vertical Line */}
                        {!isLast && (
                          <div className={`absolute left-7 md:left-9 top-14 md:top-16 bottom-[-48px] md:bottom-[-60px] w-1 rounded-full transition-all duration-1000 ${index < activeStepIndex ? 'bg-primary' : 'bg-border/20'}`}>
                            {index < activeStepIndex && <div className="absolute inset-0 bg-primary-light w-full animate-progress-vertical origin-top"></div>}
                          </div>
                        )}

                        {/* Icon Node */}
                        <div className={`relative z-10 w-14 h-14 md:w-18 md:h-18 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all duration-700 ${isCompleted ? 'bg-primary text-white shadow-2xl shadow-primary/20 scale-110' : 'bg-background text-text-muted/20 border border-border/40'}`}>
                          {isActive && (
                            <div className="absolute inset-0 bg-primary rounded-[1.5rem] md:rounded-[2rem] animate-ping opacity-20"></div>
                          )}
                          {React.cloneElement(step.icon, { size: isActive ? 28 : 22, strokeWidth: isCompleted ? 2.5 : 1.5 })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2 md:pt-4">
                          <div className="flex flex-col">
                            <h3 className={`text-lg md:text-2xl font-black transition-all duration-700 tracking-tight ${isCompleted ? 'text-text-primary' : 'text-text-muted/20'}`}>
                              {step.label}
                            </h3>
                            <p className={`text-[11px] md:text-sm font-bold transition-all duration-700 leading-relaxed ${isCompleted ? 'text-text-muted opacity-60' : 'text-text-muted/10'}`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                        
                        {isCompleted && !isActive && (
                          <div className="hidden md:flex items-center justify-center text-green-500 animate-in fade-in zoom-in duration-500">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Partner Info */}
              {order.orderStatus === 'out-for-delivery' && (
                <div className="bg-primary rounded-[3.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-primary/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 p-1.5 backdrop-blur-md border border-white/30">
                      <img src="https://i.pravatar.cc/150?u=delivery" alt="Driver" className="w-full h-full object-cover rounded-[2rem]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Delivery Partner</p>
                      <h4 className="text-3xl font-black tracking-tighter mb-2">Rahul Sharma</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                          <Star size={14} fill="#DA9133" stroke="#DA9133" />
                          <span className="text-xs font-black">4.9</span>
                        </div>
                        <span className="text-[10px] font-black opacity-60 tracking-widest uppercase">1000+ Deliveries</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <button className="flex-1 md:flex-none h-16 w-16 rounded-[1.5rem] bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all border border-white/20 shadow-lg active:scale-95">
                      <MessageSquare size={24} />
                    </button>
                    <a href="tel:+919876543210" className="flex-1 md:flex-none h-16 px-10 rounded-[1.5rem] bg-white text-primary font-black flex items-center justify-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm tracking-[0.2em] uppercase">
                      <Phone size={20} fill="currentColor" /> Call
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Details */}
            <div className="space-y-8 sticky top-32">
              {/* Delivery Address */}
              <div className="bg-background-card rounded-[3rem] p-8 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <MapPin size={22} />
                  </div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight">Destination</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-6 bg-background rounded-[2rem] border border-border/40">
                    <h4 className="font-black text-text-primary text-base tracking-tight mb-2 uppercase">{order.customerDetails?.name}</h4>
                    <p className="text-[13px] text-text-muted font-bold opacity-60 leading-relaxed">{order.customerDetails?.address}</p>
                    <p className="text-sm font-black text-primary tracking-[0.1em] mt-4 flex items-center gap-2">
                      <Phone size={14} />
                      {order.customerDetails?.phone || order.customerDetails?.mobile}
                    </p>
                  </div>
                  
                  {order.customerDetails?.location && (
                    <a
                      href={order.customerDetails.location.includes('http') ? (order.customerDetails.location.split('📍 Precise Location: ')[1] || order.customerDetails.location) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-background-card border border-primary/10 rounded-2xl group hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <MapPin size={16} />
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Pin Location</span>
                      </div>
                      <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="bg-background-card rounded-[3rem] p-8 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Summary</h3>
                <div className="space-y-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background border border-border/40 p-1 flex-shrink-0">
                          <img src={item.menuItem?.image || '/placeholder-food.jpg'} alt={item.menuItem?.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black text-text-primary truncate uppercase">{item.menuItem?.name}</h4>
                          <p className="text-[10px] font-bold text-text-muted tracking-widest">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-text-primary tracking-tighter">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-border/40 space-y-3">
                    <div className="flex justify-between text-[11px] font-bold text-text-muted tracking-widest uppercase opacity-60">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal || order.totalAmount - 45}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-text-muted tracking-widest uppercase opacity-60">
                      <span>Delivery & Service</span>
                      <span>₹45</span>
                    </div>
                    <div className="pt-4 border-t border-border/40 flex justify-between items-end">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Total Amount</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">₹{order.totalAmount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TrackOrderPage;
