import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, CreditCard, Banknote, MapPin, ChevronRight, CheckCircle2, ShieldCheck, Info, Clock, Wallet } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online', 'cod', 'wallet'
  const [loading, setLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const dropdownRef = React.useRef(null);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await api.get('/api/users/profile');
        if (response.data.success) {
          setWalletBalance(response.data.data.walletBalance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };
    fetchWallet();
  }, []);

  // Get delivery address and additional note from location state or fallback
  const deliveryAddress = location.state?.deliveryAddress;
  const additionalNote = location.state?.additionalNote || '';
  const deliveryFee = location.state?.deliveryFee || 0;
  const platformFee = location.state?.platformFee || 0;
  const total = subtotal + deliveryFee + platformFee;

  useEffect(() => {
    window.scrollTo(0, 0);

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // If no address or items, redirect back to cart (unless order was just successful)
    if (!isOrderSuccess && (!deliveryAddress || cartItems.length === 0)) {
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
      // Cleanup script
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [deliveryAddress, cartItems, navigate, isOrderSuccess]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderItems = cartItems.map(item => {
        const variants = item.variants || item.sizes || [];
        const sizeData = variants.find(v => v.size === item.selectedSize);
        const price = sizeData ? sizeData.price : (item.offerPrice || 0);

        return {
          menuItem: item._id,
          size: item.selectedSize,
          quantity: item.quantity,
          price: price
        };
      });

      const orderData = {
        items: orderItems,
        address: deliveryAddress,
        paymentMethod,
        totalAmount: total,
        subtotal,
        deliveryFee,
        platformFee,
        remarks: additionalNote
      };

      // 1. Always create the order in DB first (it will be 'pending' by default)
      const response = await api.post('/api/orders', orderData);
      const createdOrder = response.data.data;

      if (paymentMethod === 'online') {
        // 2. Create Razorpay Order
        const { data: { data: razorpayOrder } } = await api.post('/api/payments/create-order', {
          amount: total,
          currency: 'INR',
          receipt: `receipt_${createdOrder.orderNumber}`
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
            // 3. Verify Payment and Update Order
            try {
              const verificationData = {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: createdOrder._id
              };

              const { data: verificationResult } = await api.post('/api/payments/verify', verificationData);

              if (verificationResult.success) {
                clearCart();
                setIsOrderSuccess(true);
                showSuccessPopup(createdOrder);
              }
            } catch (err) {
              console.error('Payment Verification Failed:', err);
              handlePaymentFailure(createdOrder._id);
            }
          },
          modal: {
            ondismiss: function () {
              handlePaymentFailure(createdOrder._id, 'Payment cancelled by user');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: deliveryAddress.mobile || ''
          },
          theme: {
            color: '#B91C1C'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      } else {
        // COD Flow Success
        clearCart();
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
          <h2 class="text-2xl font-black text-text-primary tracking-tight mb-3 uppercase">Payment Failed</h2>
          <p class="text-[9px] font-black text-text-muted opacity-60 mb-10 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
            Don't worry, your order is saved! You can complete the payment from your order history.
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'View My Orders',
      confirmButtonColor: '#B91C1C',
      customClass: {
        popup: 'rounded-[3rem] border-none shadow-2xl bg-background-card',
        confirmButton: 'rounded-2xl px-10 py-4 font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all'
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
        <div class="py-4 px-2">
          <!-- Animated Success Celebration -->
          <div class="relative w-16 h-16 mx-auto mb-6">
            <div class="absolute inset-0 bg-primary/10 rounded-full animate-ping duration-[3000ms]"></div>
            <div class="absolute inset-2 bg-primary/5 rounded-full animate-pulse"></div>
            <div class="relative w-full h-full bg-background-card rounded-full border-4 border-primary flex items-center justify-center shadow-xl shadow-primary/20 z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-in zoom-in duration-500 delay-300">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>

          <div class="space-y-1.5 mb-6 text-center">
            <h2 class="text-xl font-black text-text-primary tracking-tighter leading-none uppercase">
              Order <span class="text-primary">Placed!</span>
            </h2>
            <p class="text-[8px] font-black text-text-muted opacity-50 uppercase tracking-[0.2em]">
              Your feast is being prepared
            </p>
          </div>
          
          <div class="relative mb-6">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary to-primary-light rounded-[1.5rem] blur opacity-10"></div>
            <div class="relative bg-background p-4 rounded-[1.5rem] border border-border/40 shadow-inner">
              <div class="flex flex-col items-center gap-2">
                <span class="text-[7px] font-black uppercase tracking-[0.3em] text-text-muted opacity-40">Tracking ID</span>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xl font-black text-text-primary tracking-tight">
                    ${order.orderNumber}
                  </span>
                  <div class="flex items-center gap-1.5 text-[7px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                    <span class="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                    READY TO COOK
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 py-2 px-4 bg-green-500/10 rounded-xl border border-green-500/20 max-w-[160px] mx-auto">
             <div class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
             <span class="text-[7px] font-black text-green-600 uppercase tracking-widest">ETA: 35-45 Mins</span>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: `
        <div class="flex items-center gap-2">
          <span class="text-[8px] uppercase tracking-[0.2em]">Track Order</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      `,
      confirmButtonColor: '#B91C1C',
      padding: '0',
      width: '85%',
      maxWidth: '300px',
      customClass: {
        popup: 'rounded-[2rem] border-none shadow-3xl overflow-hidden bg-background-card',
        confirmButton: 'rounded-xl px-6 py-3 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all mb-6'
      }
    }).then(() => {
      navigate('/my-orders');
    });
  };

  if (!isOrderSuccess && (!deliveryAddress || cartItems.length === 0)) return null;

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

            {/* Left Column: Delivery & Summary */}
            <div className="flex-1 space-y-8 w-full">
              {/* Delivery Overview */}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex items-center gap-4 mb-10">
                  <span className="w-6 h-1 bg-primary rounded-full"></span>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">Destination</p>
                    <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Delivery Summary</h2>
                  </div>
                </div>

                <div className="bg-background rounded-[2.5rem] p-6 md:p-8 border border-border/40 flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-background-card shadow-sm border border-border/40 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-md uppercase tracking-widest border border-primary/10">
                        {deliveryAddress.type || 'Home'}
                      </span>
                      <span className="text-xs font-bold text-text-primary">{deliveryAddress.mobile}</span>
                    </div>
                    <h4 className="text-lg font-black text-text-primary tracking-tight">
                      {deliveryAddress.recipientName && deliveryAddress.recipientName !== 'Myself' && deliveryAddress.recipientName !== 'Others'
                        ? deliveryAddress.recipientName
                        : (user?.name || 'Customer')}
                    </h4>
                    <p className="text-[13px] text-text-muted font-bold opacity-60 leading-relaxed max-w-md">
                      {deliveryAddress.address}
                    </p>
                    {deliveryAddress.landmark && (
                      <p className="text-[10px] font-black text-primary mt-2 italic flex items-center gap-1.5 uppercase tracking-widest">
                        <Info size={12} /> Landmark: {deliveryAddress.landmark}
                      </p>
                    )}
                  </div>
                  
                  <div className="w-full md:w-36 bg-background-card rounded-[2rem] border border-primary/10 shadow-sm p-6 flex flex-col items-center justify-center gap-2 group hover:border-primary/30 transition-all duration-500 flex-shrink-0">
                    <Clock size={24} className="text-primary animate-pulse" />
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Est. Arrival</p>
                    <h5 className="text-xl font-black text-primary tracking-tighter">45 mins</h5>
                  </div>
                </div>

                {additionalNote && (
                  <div className="mt-8 p-6 bg-primary/5 rounded-[2rem] border border-dashed border-primary/20 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 mt-1">
                      <Info size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 opacity-60">Chef's Note</p>
                      <p className="text-sm font-bold text-text-primary italic leading-relaxed">"{additionalNote}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Preview */}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-6 h-1 bg-primary rounded-full"></span>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">Order Items</p>
                    <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Final Check</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-5 p-4 rounded-[1.5rem] bg-background border border-border/40 group hover:bg-background-card hover:shadow-lg transition-all duration-500">
                      <div className="w-16 h-16 rounded-xl bg-background-card p-1 shadow-sm border border-border/40 shrink-0 overflow-hidden">
                        <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-black text-text-primary tracking-tight group-hover:text-primary transition-colors duration-500 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-text-muted opacity-40 uppercase tracking-widest">Qty: {item.quantity}</span>
                          {item.selectedSize && <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md uppercase">{item.selectedSize}</span>}
                        </div>
                      </div>
                      <div className="text-sm font-black text-text-primary tracking-tighter pr-2">
                        ₹{(() => {
                          const variants = item.variants || item.sizes || [];
                          const sizeData = variants.find(v => v.size === item.selectedSize);
                          const price = sizeData ? sizeData.price : (item.offerPrice || 0);
                          return price * item.quantity;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="w-full lg:w-[400px] sticky top-32">
              <div className="bg-background-card rounded-[3.5rem] shadow-[0_50px_120px_rgba(0,0,0,0.06)] border border-border/40 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-light to-primary"></div>
                
                <div className="p-8 md:p-10">
                  <h2 className="text-xl font-black text-text-primary tracking-tight mb-8 flex items-center gap-3">
                    <CreditCard size={22} className="text-primary" />
                    Payment Method
                  </h2>

                  <div className="space-y-4 mb-10">
                    {/* Online Payment Option */}
                    <div
                      onClick={() => setPaymentMethod('online')}
                      className={`cursor-pointer group p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'online' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'online' ? 'bg-primary text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <CreditCard size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-text-primary tracking-tight">Online</h4>
                          <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase opacity-60">UPI, Card, Net</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'online' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-3 h-3 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'online' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>

                    {/* Wallet Option */}
                    <div
                      onClick={() => walletBalance >= total ? setPaymentMethod('wallet') : null}
                      className={`cursor-pointer group p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : walletBalance < total ? 'opacity-40 cursor-not-allowed border-border/40 bg-background' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'wallet' ? 'bg-primary text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <Wallet size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-text-primary tracking-tight">Wallet</h4>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${walletBalance >= total ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                              ₹{walletBalance}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase opacity-60">Guesto Balance</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'wallet' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-3 h-3 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'wallet' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>

                    {/* COD Option */}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      className={`cursor-pointer group p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'bg-primary text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <Banknote size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-text-primary tracking-tight">Cash</h4>
                          <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase opacity-60">Pay on delivery</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-3 h-3 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'cod' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="bg-background rounded-[2rem] p-6 mb-8 space-y-3 relative border border-border/40 shadow-inner">
                    <div className="flex justify-between text-sm font-bold text-text-muted">
                      <span>Order Total</span>
                      <span className="text-text-primary">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-text-muted">
                      <span>Delivery Fee</span>
                      <span className="text-text-primary">₹{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-text-muted">
                      <span>Platform Fee</span>
                      <span className="text-text-primary">₹{platformFee}</span>
                    </div>
                    <div className="h-px bg-border/20 my-2"></div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-black text-text-primary tracking-widest uppercase">To Pay</span>
                      <span className="text-3xl font-black text-primary tracking-tighter">₹{total}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                  >
                    <span className="text-xs uppercase tracking-widest">{loading ? 'Processing...' : 'Place Your Order'}</span>
                    {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-500" />}
                  </button>
                  
                  <div className="flex items-center gap-2 justify-center mt-6 opacity-30">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">End-to-End Secure Payment</span>
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

export default PaymentPage;
