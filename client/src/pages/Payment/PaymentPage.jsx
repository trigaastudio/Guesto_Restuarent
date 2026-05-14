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
  const { cartItems, subtotal, clearCart, settings } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'cod', 'wallet'
  const [loading, setLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const dropdownRef = React.useRef(null);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }, [navigate]);

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
        const price = sizeData ? sizeData.price : (item.offerPrice || item.price || 0);

        return {
          menuItem: item.menuItemId || item._id, // Use menuItemId if available, fallback to _id
          name: item.name,
          image: item.image || '',
          size: item.selectedSize,
          quantity: item.quantity,
          price: price,
          bogoItem: item.bogoItem || null
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

      if (paymentMethod === 'card') {
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
          name: settings?.restaurantDetails?.name || 'Guest-O Restaurant',
          description: 'Payment for your delicious meal',
          image: `${window.location.origin}${settings?.branding?.logoGold || '/logo-golden.png'}`,
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
            <h2 class="text-xl font-black text-text-primary tracking-tighter leading-none lowercase">
              order <span class="text-primary">placed!</span>
            </h2>
            <p class="text-[8px] font-black text-text-muted opacity-50 lowercase tracking-[0.2em]">
              your feast is being prepared
            </p>
          </div>
          
          <div class="relative mb-6">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary to-primary-light rounded-[1.5rem] blur opacity-10"></div>
            <div class="relative bg-background p-4 rounded-[1.5rem] border border-border/40 shadow-inner">
              <div class="flex flex-col items-center gap-2">
                <span class="text-[7px] font-black lowercase tracking-[0.3em] text-text-muted opacity-40">tracking id</span>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xl font-black text-text-primary tracking-tight">
                    ${order.orderNumber}
                  </span>
                  <div class="flex items-center gap-1.5 text-[7px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                    <span class="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                    ready to cook
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 py-2 px-4 bg-green-500/10 rounded-xl border border-green-500/20 max-w-[160px] mx-auto">
             <div class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
             <span class="text-[7px] font-black text-green-600 lowercase tracking-widest">eta: 35-45 mins</span>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: `
        <div class="flex items-center gap-2">
          <span class="text-[8px] lowercase tracking-[0.2em]">track order</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      `,
      confirmButtonColor: '#B91C1C',
      padding: '0',
      width: '380px',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-3xl overflow-hidden bg-background-card',
        confirmButton: 'rounded-xl px-10 py-3.5 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all mb-8'
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
            <div className="flex-1 space-y-6 w-full">
              {/* Delivery Overview */}
              <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-[0_20px_80px_rgba(0,0,0,0.03)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex items-center gap-3 mb-6">
                  <span className="w-4 h-1 bg-primary rounded-full"></span>
                  <p className="text-[10px] font-black text-primary tracking-[0.2em] lowercase opacity-80">destination</p>
                </div>

                <div className="bg-background rounded-[2rem] p-5 md:p-6 border border-border/40 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-background-card shadow-sm border border-border/40 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-md lowercase tracking-widest border border-primary/10">
                        {deliveryAddress.type || 'home'}
                      </span>
                      <span className="text-xs font-bold text-text-primary">{deliveryAddress.mobile}</span>
                    </div>
                    <h4 className="text-base font-black text-text-primary tracking-tight">
                      {deliveryAddress.recipientName && deliveryAddress.recipientName !== 'Myself' && deliveryAddress.recipientName !== 'Others'
                        ? deliveryAddress.recipientName?.toLowerCase()
                        : (user?.name?.toLowerCase() || 'customer')}
                    </h4>
                    <p className="text-[12px] text-text-muted font-bold opacity-60 leading-relaxed max-w-md lowercase">
                      {deliveryAddress.address}
                    </p>
                    {deliveryAddress.landmark && (
                      <p className="text-[10px] font-black text-primary mt-2 italic flex items-center gap-1.5 lowercase tracking-widest">
                        <Info size={12} /> landmark: {deliveryAddress.landmark}
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-32 bg-background-card rounded-[1.5rem] border border-primary/10 shadow-sm p-4 flex flex-col items-center justify-center gap-1.5 group hover:border-primary/30 transition-all duration-500 flex-shrink-0">
                    <Clock size={20} className="text-primary animate-pulse" />
                    <p className="text-[8px] font-black text-text-muted lowercase tracking-widest">est. arrival</p>
                    <h5 className="text-lg font-black text-primary tracking-tighter">45 mins</h5>
                  </div>
                </div>

                {additionalNote && (
                  <div className="mt-8 p-6 bg-primary/5 rounded-[2rem] border border-dashed border-primary/20 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 mt-1">
                      <Info size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary lowercase tracking-widest mb-1 opacity-60">chef's note</p>
                      <p className="text-sm font-bold text-text-primary italic leading-relaxed">"{additionalNote?.toLowerCase()}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Preview */}
              <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-[0_20px_80px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-4 h-1 bg-primary rounded-full"></span>
                  <p className="text-[10px] font-black text-primary tracking-[0.2em] lowercase opacity-80">order items</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-4 p-3 rounded-[1.25rem] bg-background border border-border/40 group hover:bg-background-card hover:shadow-md transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-background-card p-1 shadow-sm border border-border/40 shrink-0 overflow-hidden">
                        <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[12px] font-black text-text-primary tracking-tight group-hover:text-primary transition-colors duration-500 truncate lowercase">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black text-text-muted opacity-40 lowercase tracking-widest">qty: {item.quantity}</span>
                          {item.selectedSize && <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md lowercase">{item.selectedSize}</span>}
                        </div>

                      </div>
                      <div className="text-sm font-black text-text-primary tracking-tighter pr-2">
                        ₹{(() => {
                          const variants = item.variants || item.sizes || [];
                          const sizeData = variants.find(v => v.size === item.selectedSize);
                          const price = sizeData ? sizeData.price : (item.offerPrice || item.price || 0);
                          return price * item.quantity;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="w-full lg:w-[380px] sticky top-32">
              <div className="bg-background-card rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-border/40 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-light to-primary"></div>

                <div className="p-6 md:p-8">
                  <h2 className="text-lg font-black text-text-primary tracking-tight mb-6 flex items-center gap-3 lowercase">
                    <CreditCard size={20} className="text-primary" />
                    payment method
                  </h2>

                  <div className="space-y-3 mb-8">
                    {/* Online Payment Option */}
                    <div
                      onClick={() => setPaymentMethod('card')}
                      className={`cursor-pointer group p-4 rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'card' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                          <CreditCard size={22} strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary tracking-tight lowercase">card</h4>
                          <p className="text-[9px] font-bold text-text-muted tracking-widest lowercase opacity-60">secure payment</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'card' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'card' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>

                    {/* Wallet Option */}
                    <div
                      onClick={() => walletBalance >= total ? setPaymentMethod('wallet') : null}
                      className={`cursor-pointer group p-4 rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : walletBalance < total ? 'opacity-40 cursor-not-allowed border-border/40 bg-background' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'wallet' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'}`}>
                          <Wallet size={22} strokeWidth={2} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-text-primary tracking-tight">wallet</h4>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border ${walletBalance >= total ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                              ₹{walletBalance}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-text-muted tracking-widest lowercase opacity-60">guesto balance</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'wallet' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'wallet' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>

                    {/* COD Option */}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      className={`cursor-pointer group p-4 rounded-[1.5rem] border-2 transition-all duration-500 flex items-center justify-between ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border/40 bg-background hover:border-primary/20 hover:bg-background-card'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg' : 'bg-background-card text-text-muted/40 group-hover:bg-amber-500/10 group-hover:text-amber-500'}`}>
                          <Banknote size={22} strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary tracking-tight lowercase">cash</h4>
                          <p className="text-[9px] font-bold text-text-muted tracking-widest lowercase opacity-60">pay on delivery</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'cod' ? 'border-primary' : 'border-border/40'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-500 ${paymentMethod === 'cod' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="bg-background rounded-[1.5rem] p-5 mb-6 space-y-2.5 relative border border-border/40 shadow-inner">
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
                      <span className="text-base font-black text-text-primary tracking-widest lowercase">to pay</span>
                      <span className="text-3xl font-black text-primary tracking-tighter">₹{total}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-xl transition-all duration-500 shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                  >
                    <span className="text-xs lowercase tracking-widest">{loading ? 'processing...' : 'place your order'}</span>
                    {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-500" />}
                  </button>

                  <div className="flex items-center gap-2 justify-center mt-6 opacity-30">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span className="text-[9px] font-black lowercase tracking-widest text-text-muted">end-to-end secure payment</span>
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
