import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, CreditCard, Banknote, MapPin, ChevronRight, CheckCircle2, ShieldCheck, Info, Clock, UtensilsCrossed } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, subtotal, clearCart, settings, checkStoreStatus } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('online'); 
  const [loading, setLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

    const handleLogout = useCallback(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');
    if (currentUser.role === 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login', { replace: true });
    } else if (currentUser.role === 'kitchen' || currentUser.role === 'waiter') {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      navigate('/staff/login', { replace: true });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || 'null');

  
  const deliveryAddress = location.state?.deliveryAddress;
  const additionalNote = location.state?.additionalNote || '';
  const deliveryFee = location.state?.deliveryFee || 0;
  const platformFee = location.state?.platformFee || 0;
  const discount = location.state?.discount || 0;
  const dineInTableId = location.state?.dineInTableId;
  const dineInTableNumber = location.state?.dineInTableNumber;
  const total = subtotal + deliveryFee + platformFee;

  useEffect(() => {
    window.scrollTo(0, 0);

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    
    const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
    if (!isOrderSuccess && !storeStatus.isOpen) {
      let message = 'Store is currently closed.';
      if (storeStatus.reason === 'holiday') {
        message = 'We are closed for holidays. Please order again when we reopen.';
      } else if (storeStatus.reason === 'closed_day') {
        message = 'We are closed today. Please order again tomorrow.';
      } else if (storeStatus.reason === 'manual_close') {
        message = 'The store is currently closed. Please check back later.';
      } else if (storeStatus.reason) {
        message = `The store is currently closed (${storeStatus.reason}).`;
      }
      
      Swal.fire({
        title: 'Store Closed',
        text: message,
        icon: 'warning',
        confirmButtonColor: '#B91C1C',
        customClass: { popup: 'rounded-[2rem] bg-background text-text-primary' }
      }).then(() => {
        navigate('/cart');
      });
      return;
    }

    
    if (!isOrderSuccess && (!(deliveryAddress || dineInTableId) || cartItems.length === 0 || total < 140)) {
      navigate('/cart');
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [deliveryAddress, dineInTableId, cartItems, navigate, isOrderSuccess, subtotal]);

  const handlePlaceOrder = async () => {
    const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
    if (!storeStatus.isOpen) {
      let message = 'Store is currently closed.';
      if (storeStatus.reason === 'holiday') {
        message = 'We are closed for holidays. Please order again when we reopen.';
      } else if (storeStatus.reason === 'closed_day') {
        message = 'We are closed today. Please order again tomorrow.';
      } else if (storeStatus.reason === 'manual_close') {
        message = 'The store is currently closed. Please check back later.';
      } else if (storeStatus.reason) {
        message = `The store is currently closed (${storeStatus.reason}).`;
      }
      Swal.fire({
        title: 'Store Closed',
        text: message,
        icon: 'warning',
        confirmButtonColor: '#B91C1C',
        customClass: { popup: 'rounded-[2rem] bg-background text-text-primary' }
      }).then(() => {
        navigate('/cart');
      });
      return;
    }

    setLoading(true);
    try {
      const orderItems = cartItems.map(item => {
        const variants = item.variants || item.sizes || [];
        const sizeData = variants.find(v => v.size === item.selectedSize);
        const basePrice = sizeData ? sizeData.price : (item.offerPrice || item.price || 0);

        
        const menuDiscount = item.discountPercentage || 0;
        const categoryDiscount = item.category?.discountPercentage || 0;
        const maxDiscount = Math.max(menuDiscount, categoryDiscount);
        const discountedPrice = item.isCombo
          ? Math.round(basePrice)
          : Math.round(maxDiscount > 0 ? basePrice * (1 - maxDiscount / 100) : basePrice);

        return {
          menuItem: item.menuItemId || item._id, 
          name: item.name,
          image: item.image || '',
          size: item.selectedSize,
          quantity: item.quantity,
          price: discountedPrice,
          bogoItem: item.bogoItem || null
        };
      });

      const orderData = {
        items: orderItems,
        address: deliveryAddress,
        paymentMethod,
        totalAmount: total,
        subtotal,
        discount,
        deliveryFee,
        platformFee,
        remarks: additionalNote,
        ...(dineInTableId && {
          orderType: 'dine-in',
          table: dineInTableId,
          orderSource: 'waiter'
        })
      };

      if (paymentMethod === 'online') {
        
        const { data: { data: razorpayOrder } } = await api.post('/api/payments/create-order', {
          amount: total,
          currency: 'INR',
          receipt: `receipt_temp_${Date.now()}`
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
              const orderDataWithPayment = {
                ...orderData,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              };

              const response = await api.post('/api/orders', orderDataWithPayment);
              const createdOrder = response.data.data;

              clearCart();
              localStorage.removeItem('dineInTableId');
              localStorage.removeItem('dineInTableNumber');
              setIsOrderSuccess(true);
              showSuccessPopup(createdOrder);
            } catch (err) {
              console.error('Order Placement or Payment Verification Failed:', err);
              setLoading(false);
              Swal.fire({
                title: 'Order Placement Failed',
                text: err.response?.data?.message || 'Payment verification or order placement failed. Please contact support.',
                icon: 'error',
                confirmButtonColor: '#B91C1C',
                customClass: { popup: 'rounded-[2rem] bg-background text-text-primary' }
              });
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              Swal.fire({
                title: 'Payment Cancelled',
                text: 'Your payment was cancelled. You can choose Cash on Delivery or try paying again.',
                icon: 'info',
                confirmButtonColor: '#B91C1C',
                customClass: { popup: 'rounded-[2rem] bg-background text-text-primary' }
              });
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: deliveryAddress?.mobile || ''
          },
          theme: {
            color: '#B91C1C'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        
        const response = await api.post('/api/orders', orderData);
        const createdOrder = response.data.data;

        clearCart();
        localStorage.removeItem('dineInTableId');
        localStorage.removeItem('dineInTableNumber');
        setIsOrderSuccess(true);
        showSuccessPopup(createdOrder);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Swal.fire({
        title: 'Order Failed',
        text: error.response?.data?.message || 'Something went wrong while placing your order.',
        icon: 'error',
        confirmButtonColor: '#B91C1C',
        customClass: { popup: 'rounded-[2rem] bg-background text-text-primary' }
      });
      setLoading(false);
    }
  };

  const handlePaymentFailure = (orderId) => {
    setLoading(false);
    clearCart();

    Swal.fire({
      html: `
        <div class="p-4">
          <div class="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 class="text-2xl font-black text-text-primary tracking-tight mb-3 lowercase">payment failed</h2>
          <p class="text-[9px] font-black text-text-muted opacity-60 mb-10 lowercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
            don't worry, your order is saved! you can complete the payment from your order history.
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'View My Orders',
      confirmButtonColor: '#B91C1C',
      customClass: {
        popup: 'rounded-[3rem] border-none shadow-2xl bg-background-card',
        confirmButton: 'rounded-2xl px-10 py-4 font-black lowercase tracking-widest text-[9px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all'
      },
      timer: 5000,
      timerProgressBar: true
    }).then(() => {
      navigate('/my-orders');
    });
  };

  const showSuccessPopup = (order) => {
    Swal.fire({
      html: `
        <div class="overflow-hidden">
          <!-- Premium Header with Celebration -->
          <div class="bg-primary/5 py-12 relative overflow-hidden">
            <div class="absolute inset-0 opacity-20">
              <div class="absolute top-0 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping"></div>
              <div class="absolute top-1/2 right-1/4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <div class="absolute bottom-1/4 left-1/2 w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
            
            <div class="relative z-10">
              <div class="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl border-8 border-primary/10 relative">
                <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin duration-1000"></div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-in zoom-in duration-500 delay-200">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="mt-6 space-y-1">
                <h2 class="text-3xl font-black text-text-primary tracking-tighter uppercase">Order <span class="text-primary">Success!</span></h2>
                <p class="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">We've received your feast</p>
              </div>
            </div>
          </div>

            <div class="p-6 sm:p-8 space-y-6 sm:space-y-8">
              <div class="flex items-center justify-center gap-4 sm:gap-8">
                <div class="text-center">
                  <p class="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-50">Order ID</p>
                  <p class="text-lg sm:text-xl font-black text-text-primary tracking-tight">${order.orderNumber}</p>
                </div>
                <div class="w-px h-10 bg-border/40"></div>
                <div class="text-center">
                  <p class="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-50">Delivery ETA</p>
                  <p class="text-lg sm:text-xl font-black text-primary tracking-tight">35-45 mins</p>
                </div>
              </div>

              <div class="bg-background-muted/50 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 border border-border/40 relative group overflow-hidden">
                <div class="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div class="relative z-10 flex items-center gap-4 sm:gap-5">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sm:w-6 sm:h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div class="text-left">
                    <h4 class="text-[11px] sm:text-xs font-black text-text-primary uppercase tracking-wider mb-0.5">Secure Preparation</h4>
                    <p class="text-[9px] sm:text-[10px] font-bold text-text-muted opacity-60">Your kitchen is maintaining top hygiene standards.</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4">
                <button id="track-order-btn" class="flex-1 w-full bg-primary hover:bg-primary-dark text-white font-black py-3.5 sm:py-4 px-2 rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 active:scale-95 text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group">
                  Track Order
                  <svg class="group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
                <button id="home-btn" class="flex-1 w-full bg-background-card hover:bg-background border border-border/60 text-text-primary font-black py-3.5 sm:py-4 px-2 rounded-2xl transition-all duration-300 active:scale-95 text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center">
                  Go Shopping
                </button>
              </div>
            </div>
        </div>
      `,
      showConfirmButton: false,
      padding: '0',
      width: 'min(92%, 520px)',
      customClass: {
        popup: 'rounded-[3.5rem] border-none shadow-[0_60px_120px_rgba(0,0,0,0.18)] overflow-hidden bg-background-card',
      },
      didOpen: () => {
        document.getElementById('track-order-btn').addEventListener('click', () => {
          Swal.close();
          navigate('/my-orders');
        });
        document.getElementById('home-btn').addEventListener('click', () => {
          Swal.close();
          navigate('/');
        });
      }
    });
  };

  if (!isOrderSuccess && (!(deliveryAddress || dineInTableId) || cartItems.length === 0)) return null;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 overflow-x-hidden">
      <Navbar
        user={user}
        cartItems={cartItems}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        handleLogout={handleLogout}
        navigate={navigate}
        dropdownRef={dropdownRef}
        hideCart={false}
      />

      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background-card/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

        <main className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 relative z-10 pb-24">
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {}
            <div className="flex-1 space-y-6 w-full">
              {}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex items-center gap-4 mb-8">
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                  <p className="text-[11px] font-black text-primary tracking-[0.3em] uppercase opacity-90">delivery destination</p>
                </div>

                {dineInTableId ? (
                  <div className="relative bg-primary/10 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-primary/20 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-16 h-16 rounded-3xl bg-primary shadow-[0_15px_35px_rgba(185,28,28,0.2)] flex items-center justify-center text-white flex-shrink-0 animate-bounce-slow">
                      <Banknote size={32} strokeWidth={2} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-white bg-primary px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                          Dine-in Order
                        </span>
                      </div>
                      <h4 className="text-2xl font-black text-text-primary tracking-tighter capitalize leading-none">
                        Table {dineInTableNumber}
                      </h4>
                      <p className="text-sm text-text-muted font-bold opacity-70 leading-relaxed max-w-lg">
                        Order will be sent directly to the kitchen for preparation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-background/50 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-16 h-16 rounded-3xl bg-primary shadow-[0_15px_35px_rgba(185,28,28,0.2)] flex items-center justify-center text-white flex-shrink-0 animate-bounce-slow">
                      <MapPin size={32} strokeWidth={2} />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-white bg-primary px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                          {deliveryAddress.type || 'home'}
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-border/40"></div>
                        <span className="text-sm font-black text-text-primary tracking-tight">{deliveryAddress.mobile}</span>
                      </div>

                      <h4 className="text-2xl font-black text-text-primary tracking-tighter capitalize leading-none">
                        {deliveryAddress.recipientName && deliveryAddress.recipientName !== 'Myself' && deliveryAddress.recipientName !== 'Others'
                          ? deliveryAddress.recipientName
                          : (user?.name || 'customer')}
                      </h4>

                      <p className="text-sm text-text-muted font-bold opacity-70 leading-relaxed max-w-lg">
                        {deliveryAddress.address}
                      </p>

                      {deliveryAddress.landmark && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background-muted/50 rounded-xl border border-border/40">
                          <Info size={14} className="text-primary" />
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-wider opacity-80">landmark: {deliveryAddress.landmark}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-36 bg-background rounded-3xl border border-primary/20 shadow-lg p-5 flex flex-col items-center justify-center gap-2 group/arrival hover:border-primary transition-all duration-500 flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/arrival:translate-y-0 transition-transform duration-500"></div>
                      <Clock size={24} className="text-primary relative z-10" />
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest relative z-10">arrival</p>
                      <h5 className="text-xl font-black text-text-primary tracking-tighter relative z-10">45 mins</h5>
                    </div>
                  </div>
                )}

                {additionalNote && (
                  <div className="mt-8 p-6 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/10 flex items-start gap-5 group/note">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary shrink-0 transition-transform group-hover/note:rotate-12">
                      <UtensilsCrossed size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">special instructions</p>
                      <p className="text-base font-bold text-text-primary italic leading-relaxed">"{additionalNote}"</p>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                  <p className="text-[11px] font-black text-primary tracking-[0.3em] uppercase opacity-90">your selection</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-2 sm:gap-5 p-2 sm:p-4 rounded-[1.25rem] sm:rounded-[2rem] bg-background border border-border/40 group hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[0.75rem] sm:rounded-2xl shrink-0 overflow-hidden group-hover:rotate-3 transition-transform duration-500">
                        <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-text-primary tracking-tight group-hover:text-primary transition-colors duration-500 truncate capitalize">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-wider opacity-60">qty: {item.quantity}</span>
                          {item.selectedSize && (
                            <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg uppercase border border-primary/10">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>

                        {}
                        {item.isCombo && item.comboItems?.length > 0 && (
                          <div className="mt-2 space-y-1 pl-2 border-l border-primary/30">
                            <span className="text-[8px] font-black text-primary uppercase tracking-wider block">Combo includes:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.comboItems.map((ci, idx) => (
                                <span key={idx} className="inline-flex items-center bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-primary/10">
                                  {ci.quantity || 1}x {ci.menuItem?.name || ci.name || 'Item'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {}
                        {!item.isCombo && item.variants?.find(v => v.size === item.selectedSize)?.includedItems?.length > 0 && (
                          <div className="mt-2 space-y-1 pl-2 border-l border-primary/30">
                            <span className="text-[8px] font-black text-primary uppercase tracking-wider block">Includes Add-ons:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.variants.find(v => v.size === item.selectedSize).includedItems.map((ii, idx) => (
                                <span key={idx} className="inline-flex items-center bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-primary/10">
                                  {ii.quantity || 1}x {ii.menuItem?.name || ii.name || 'Item'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {}
                        {item.bogoItem && item.variants?.find(v => v.size === item.selectedSize)?.isBOGO && (
                          <div className="mt-2 space-y-1 pl-2 border-l border-emerald-500/30">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Buy 1 Get 1 Free Add-on:</span>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                              🎁 Free {item.bogoItem.name} {item.bogoItem.size ? `(${item.bogoItem.size})` : ''} x {item.bogoItem.quantity || item.quantity}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-[13px] sm:text-lg font-black text-text-primary tracking-tighter pr-1 sm:pr-2 shrink-0">
                        ₹{(() => {
                          const variants = item.variants || item.sizes || [];
                          const sizeData = variants.find(v => v.size === item.selectedSize);
                          const basePrice = sizeData ? sizeData.price : (item.offerPrice || item.price || 0);
                          // Apply item/category discount to match cart page calculation
                          const menuDiscount = item.discountPercentage || 0;
                          const categoryDiscount = item.category?.discountPercentage || 0;
                          const maxDiscount = Math.max(menuDiscount, categoryDiscount);
                          const discountedPrice = item.isCombo
                            ? Math.round(basePrice)
                            : Math.round(maxDiscount > 0 ? basePrice * (1 - maxDiscount / 100) : basePrice);
                          return discountedPrice * item.quantity;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="w-full lg:w-[420px] sticky top-32">
              <div className="bg-background-card rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.06)] border border-border/40 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-primary-light to-primary"></div>

                <div className="p-6 md:p-8 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-text-primary tracking-tighter uppercase flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <CreditCard size={20} strokeWidth={2.5} />
                      </div>
                      Payment
                    </h2>
                    <div className="flex items-center gap-2 px-2.5 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                      <ShieldCheck size={10} className="text-green-500" />
                      <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">secured</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {/* Online Payment Option */}
                    <div
                      onClick={() => setPaymentMethod('online')}
                      className={`cursor-pointer group/pay p-4 rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'online' ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 -translate-y-0.5' : 'border-border/20 bg-background hover:border-primary/30 hover:bg-background-card hover:-translate-y-0.5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${paymentMethod === 'online' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'bg-background-card text-text-muted/40 group-hover/pay:text-indigo-500'}`}>
                          <CreditCard size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary tracking-tight">Online</h4>
                          <p className="text-[9px] font-bold text-text-muted tracking-widest uppercase opacity-50">secure checkout</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'online' ? 'border-primary bg-primary/10' : 'border-border/40 group-hover/pay:border-primary/40'}`}>
                        <div className={`w-2 h-2 rounded-full bg-primary transition-all duration-500 ${paymentMethod === 'online' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                      </div>
                    </div>


                    {}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      className={`cursor-pointer group/pay p-4 rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'cod' ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 -translate-y-0.5' : 'border-border/20 bg-background hover:border-primary/30 hover:bg-background-card hover:-translate-y-0.5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-lg shadow-amber-500/20 scale-105' : 'bg-background-card text-text-muted/40 group-hover/pay:text-amber-500'}`}>
                          <Banknote size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary tracking-tight">COD</h4>
                          <p className="text-[9px] font-bold text-text-muted tracking-widest uppercase opacity-50">cash on delivery</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'border-primary bg-primary/10' : 'border-border/40 group-hover/pay:border-primary/40'}`}>
                        <div className={`w-2 h-2 rounded-full bg-primary transition-all duration-500 ${paymentMethod === 'cod' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="bg-background rounded-[2rem] p-6 mb-8 space-y-3 relative border border-border/40 shadow-inner overflow-hidden group/summary">
                    <div className="absolute inset-0 bg-primary/5 -translate-x-full group-hover/summary:translate-x-0 transition-transform duration-700"></div>
                    <div className="relative z-10 flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-text-primary">₹{subtotal}</span>
                    </div>
                    <div className="relative z-10 flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                      <span>Delivery</span>
                      <span className="text-text-primary">₹{deliveryFee}</span>
                    </div>
                    <div className="relative z-10 flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                      <span>Platform</span>
                      <span className="text-text-primary">₹{platformFee}</span>
                    </div>
                    <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent my-3"></div>
                    <div className="relative z-10 flex justify-between items-end pt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">grand total</span>
                        <span className="text-3xl font-black text-text-primary tracking-tighter">₹{total}</span>
                      </div>
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary animate-pulse">
                        <ShieldCheck size={20} />
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 mt-3">
                      <Info size={14} className="text-primary flex-shrink-0" />
                      <p className="text-[10px] font-bold text-text-muted leading-snug">
                        Delivery is free within 5 km. Beyond 5 km, a delivery charge of ₹10 per km applies.
                      </p>
                    </div>
                  </div>

                  {}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[1.75rem] transition-all duration-700 shadow-[0_15px_40px_rgba(185,28,28,0.2)] active:scale-95 flex items-center justify-center gap-4 group/btn disabled:opacity-50 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] relative z-10">{loading ? 'Processing...' : 'Place Your Order'}</span>
                    {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover/btn:translate-x-2 transition-transform duration-500 relative z-10" />}
                  </button>

                  <p className="text-center mt-6 text-[8px] font-black uppercase tracking-[0.3em] text-text-muted opacity-30">
                    secure encrypted transaction
                  </p>
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

export default PaymentPage;
