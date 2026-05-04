import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Truck, Timer, MapPin, Phone, MessageSquare, ChevronRight, Clock, Star } from 'lucide-react';
import api from '../../api/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrderDetails();
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(fetchOrderDetails, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

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
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D10000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Package size={40} />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 tracking-tight">Order Not Found</h2>
        <p className="text-sm font-bold text-text-muted opacity-60 mb-8">We couldn't find the order you're looking for.</p>
        <button onClick={() => navigate('/my-orders')} className="bg-[#D10000] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Back to Orders</button>
      </div>
    );
  }

  const activeStepIndex = getActiveStep();

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

  return (
    <div className={`min-h-screen bg-[#FAF9F6] font-sans overflow-x-hidden ${theme}`}>
      <header className="relative bg-[#D10000] z-40 transition-all duration-500 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] pointer-events-none"></div>
        <Navbar user={user} cartItems={cartItems} navigate={navigate} />
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
          <div className="w-full">
            <button
              onClick={() => navigate('/my-orders')}
              className="flex items-center gap-2 text-[10px] font-black text-[#D10000] tracking-wide mb-3 hover:gap-3 transition-all"
            >
              <ArrowLeft size={14} /> Back to my orders
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter break-words">Track Order <span className="text-[#D10000]">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span></h1>
              <div className="px-4 py-1.5 rounded-full bg-[#D10000]/5 border border-[#D10000]/10 text-[#D10000] text-[10px] font-black uppercase tracking-widest animate-pulse">
                {getStatusLabel(order.orderStatus)}
              </div>
            </div>
          </div>
          <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted tracking-wide">Estimated arrival</p>
              <p className="text-lg font-black text-text-primary">25 - 35 mins</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Tracking Stepper */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden">
              {/* Status Stepper */}
              <div className="relative space-y-10 md:y-12">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= activeStepIndex;
                  const isActive = index === activeStepIndex;
                  const isLast = index === statusSteps.length - 1;

                  return (
                    <div key={step.id} className="relative flex gap-4 md:gap-8 group">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div className={`absolute left-6 md:left-7 top-12 md:top-14 bottom-[-40px] md:bottom-[-48px] w-1 rounded-full transition-colors duration-1000 ${index < activeStepIndex ? 'bg-[#D10000]' : 'bg-gray-100'}`}></div>
                      )}

                      {/* Icon Node */}
                      <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg shrink-0 ${isCompleted ? 'bg-[#D10000] text-white shadow-[#D10000]/20' : 'bg-gray-50 text-gray-300'}`}>
                        {isActive && (
                          <div className="absolute inset-0 bg-[#D10000] rounded-xl md:rounded-2xl animate-ping opacity-20"></div>
                        )}
                        {React.cloneElement(step.icon, { size: 18 })}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`text-base md:text-lg font-black transition-colors duration-700 ${isCompleted ? 'text-text-primary' : 'text-gray-300'}`}>{step.label}</h3>
                            <p className={`text-[10px] md:text-xs font-bold transition-colors duration-700 ${isCompleted ? 'text-text-muted' : 'text-gray-200'}`}>{step.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Partner Info */}
            {activeStepIndex >= 2 && (
              <div className="bg-[#D10000] rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-[#D10000]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 p-1">
                    <img src="https://i.pravatar.cc/150?u=delivery" alt="Driver" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tight mb-1">Rahul Sharma</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#DA9133]">
                        <Star size={12} fill="#DA9133" />
                        <Star size={12} fill="#DA9133" />
                        <Star size={12} fill="#DA9133" />
                        <Star size={12} fill="#DA9133" />
                        <Star size={12} fill="#DA9133" />
                      </div>
                      <span className="text-[10px] font-black opacity-80 tracking-wide">Premium partner</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                  <button className="flex-1 md:flex-none h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                    <MessageSquare size={24} />
                  </button>
                  <a href="tel:+919876543210" className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-white text-[#D10000] font-black flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-sm tracking-widest">
                    <Phone size={18} fill="#D10000" /> Call Rahul
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-8">
            {/* Delivery Address */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <MapPin size={20} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Delivery Address</h3>
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-text-primary text-sm">{order.address?.recipientName}</h4>
                <p className="text-xs text-text-muted font-bold opacity-70 leading-relaxed">{order.address?.address}</p>
                <p className="text-[10px] font-black text-[#D10000] tracking-widest mt-2">{order.address?.mobile}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-text-primary tracking-tight mb-6">Order summary</h3>
              <div className="space-y-5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                        <img src={item.menuItem?.image || '/placeholder-food.jpg'} alt={item.menuItem?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary truncate max-w-[120px]">{item.menuItem?.name}</h4>
                        <p className="text-[10px] font-bold text-text-muted">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-text-primary tracking-tighter">₹{item.price * item.quantity}</span>
                  </div>
                ))}

                <div className="h-px bg-dashed border-t border-dashed border-gray-100 my-4"></div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-text-muted tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal || order.totalAmount - 45}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-text-muted tracking-widest">
                    <span>Delivery & fees</span>
                    <span>₹45</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-black text-text-primary tracking-widest">Total paid</span>
                    <span className="text-2xl font-black text-[#D10000] tracking-tighter">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 text-center">
              <h4 className="text-sm font-black text-text-primary mb-2 tracking-tight">Need help with your order?</h4>
              <p className="text-xs font-bold text-text-muted opacity-60 mb-6">Our support team is available 24/7</p>
              <button className="w-full py-4 rounded-2xl border-2 border-gray-200 text-xs font-black tracking-widest hover:bg-white transition-all active:scale-[0.98]">Contact support</button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrderPage;
