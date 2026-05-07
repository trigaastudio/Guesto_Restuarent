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
  }, [deliveryAddress, cartItems, navigate]);

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
            color: '#D10000'
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
        confirmButtonColor: '#f59e0b'
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
          <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 class="text-2xl font-black text-text-primary tracking-tight mb-2">Payment Failed</h2>
          <p class="text-sm font-bold text-text-muted opacity-70 mb-8 uppercase tracking-widest">
            Don't worry, your order is saved! You can complete the payment from your order history.
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'View My Orders',
      confirmButtonColor: '#DA9133',
      customClass: {
        popup: 'rounded-[2.5rem]',
        confirmButton: 'rounded-2xl px-12 py-4 font-black uppercase tracking-widest text-sm'
      },
      timer: 4000,
      timerProgressBar: true
    }).then(() => {
      navigate('/my-orders');
    });
  };

  const showSuccessPopup = (order) => {
    Swal.fire({
      html: `
        <div class="p-2 pt-6">
          <!-- Animated Checkmark Container - Positioned Higher with more gap -->
          <div class="success-checkmark mb-20">
            <div class="check-icon">
              <span class="icon-line line-tip"></span>
              <span class="icon-line line-long"></span>
              <div class="icon-circle"></div>
              <div class="icon-fix"></div>
            </div>
          </div>

          <h2 class="text-3xl font-black text-text-primary tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">Order Placed!</h2>
          <p class="text-sm font-bold text-text-muted opacity-70 mb-10 animate-in fade-in slide-in-from-bottom-3 duration-1000">Your delicious order is being prepared with love and care.</p>
          
          <div class="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 mb-4 animate-in zoom-in duration-700">
            <div class="flex flex-col items-center gap-3">
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">Your Order Reference</span>
              <div class="flex items-center gap-4 bg-white px-8 py-3 rounded-2xl border border-gray-100 shadow-sm">
                <span class="text-sm font-black text-text-primary opacity-30 tracking-widest">ORDER ID:</span>
                <span class="text-base font-black text-[#D10000] tracking-[0.15em]">${order.orderNumber}</span>
              </div>
            </div>
          </div>

          <style>
            .success-checkmark {
              width: 80px;
              height: 80px;
              margin: 0 auto;
            }
            .check-icon {
              width: 80px;
              height: 80px;
              position: relative;
              border-radius: 50%;
              box-sizing: content-box;
              border: 4px solid #D10000;
            }
            .check-icon::before {
              top: 3px;
              left: -2px;
              width: 30px;
              transform-origin: 100% 50%;
              border-radius: 100px 0 0 100px;
            }
            .check-icon::after {
              top: 0;
              left: 30px;
              width: 60px;
              transform-origin: 0 50%;
              border-radius: 0 100px 100px 0;
              animation: rotate-circle 4.25s ease-in;
            }
            .icon-line {
              height: 5px;
              background-color: #D10000;
              display: block;
              border-radius: 2px;
              position: absolute;
              z-index: 10;
            }
            .line-tip {
              top: 46px;
              left: 14px;
              width: 25px;
              transform: rotate(45deg);
              animation: icon-line-tip 0.75s;
            }
            .line-long {
              top: 38px;
              right: 8px;
              width: 47px;
              transform: rotate(-45deg);
              animation: icon-line-long 0.75s;
            }
            .icon-circle {
              top: -4px;
              left: -4px;
              z-index: 10;
              width: 80px;
              height: 80px;
              border-radius: 50%;
              border: 4px solid rgba(209, 0, 0, 0.2);
              box-sizing: content-box;
              position: absolute;
            }
            @keyframes icon-line-tip {
              0% { width: 0; left: 1px; top: 19px; }
              54% { width: 0; left: 1px; top: 19px; }
              70% { width: 50px; left: -8px; top: 37px; }
              84% { width: 17px; left: 21px; top: 48px; }
              100% { width: 25px; left: 14px; top: 46px; }
            }
            @keyframes icon-line-long {
              0% { width: 0; right: 46px; top: 54px; }
              65% { width: 0; right: 46px; top: 54px; }
              84% { width: 55px; right: 0px; top: 35px; }
              100% { width: 47px; right: 8px; top: 38px; }
            }
          </style>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Track My Order',
      confirmButtonColor: '#DA9133',
      padding: '2rem',
      customClass: {
        popup: 'rounded-[3rem] border-none shadow-2xl',
        confirmButton: 'rounded-2xl px-12 py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-[#DA9133]/20 hover:scale-105 active:scale-95 transition-all'
      }
    }).then(() => {
      navigate('/my-orders');
    });
  };

  if (!isOrderSuccess && (!deliveryAddress || cartItems.length === 0)) return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Premium Header */}
      {/* Navbar Integration */}
      <div className="bg-[#D10000]">
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

        {/* Back header removed as requested */}
      </div>

      <main className="max-w-5xl mx-auto px-6 pt-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: Summary & Address */}
          <div className="flex-1 space-y-8 w-full">

            {/* Delivery Details Card */}
            <div className="bg-[#FAF9F6] rounded-[1.5rem] p-4 border border-[#D10000]/5 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#D10000]/10 flex items-center justify-center text-[#D10000]">
                  <MapPin size={20} />
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#D10000]/10 rounded-full shadow-sm animate-pulse">
                    <Clock size={12} className="text-[#D10000]" />
                    <span className="text-[10px] font-black text-[#D10000] tracking-widest lowercase">45 mins</span>
                  </div>
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Delivery Details</h3>
              </div>

              <div className="bg-white/50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row gap-6">
                {/* Left: Address Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-[#D10000] bg-[#D10000]/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
                      {deliveryAddress.type || 'Home'}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted">{deliveryAddress.mobile}</span>
                  </div>
                  <h4 className="font-black text-text-primary text-base tracking-tight mb-1">
                    {deliveryAddress.recipientName && deliveryAddress.recipientName !== 'Myself' && deliveryAddress.recipientName !== 'Others'
                      ? deliveryAddress.recipientName
                      : (user?.name || 'Customer')}
                  </h4>
                  <p className="text-xs text-text-muted font-bold opacity-70 leading-relaxed">
                    {deliveryAddress.address}
                  </p>
                  {deliveryAddress.landmark && (
                    <p className="text-[10px] font-black text-[#D10000] mt-1 italic opacity-80">
                      Landmark: {deliveryAddress.landmark}
                    </p>
                  )}
                </div>

                {/* Right: Dedicated Time Box */}
                <div className="flex-shrink-0 w-full md:w-32 bg-white rounded-2xl border border-[#D10000]/10 shadow-sm flex flex-col items-center justify-center p-4 group hover:border-[#D10000]/30 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-[#D10000]/5 rounded-full blur-xl translate-x-1/2 -translate-y-1/2"></div>
                  <Clock size={20} className="text-[#DA9133] mb-2 animate-pulse" />
                  <p className="text-[9px] font-black text-gray-400 lowercase tracking-widest text-center">est. time</p>
                  <h5 className="text-lg font-black text-[#D10000] tracking-tighter">45 mins</h5>
                </div>
              </div>

              {additionalNote && (
                <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-[#DA9133] uppercase tracking-widest mb-1">Delivery Note</p>
                  <p className="text-[11px] font-bold text-gray-600 italic">"{additionalNote}"</p>
                </div>
              )}
            </div>

            {/* Order Items Preview */}
            <div className="bg-[#FAF9F6] rounded-[1.5rem] p-4 border border-[#D10000]/5 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#D10000]/10 flex items-center justify-center text-[#D10000]">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Order Summary</h3>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50">
                        <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-text-primary group-hover:text-[#D10000] transition-colors">
                          {item.name} {item.selectedSize && <span className="text-[10px] text-text-muted">({item.selectedSize})</span>}
                        </h4>
                        <p className="text-[10px] font-bold text-text-muted tracking-widest">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-sm font-black text-text-primary tracking-tight">
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

          {/* Right: Payment Selection */}
          <div className="w-full lg:w-[320px] sticky top-32">
            <div className="bg-[#FAF9F6] rounded-[1.5rem] p-4 border border-primary/10 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden">
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

              <h2 className="text-lg font-black text-text-primary tracking-tight mb-4 relative z-10">Payment Method</h2>

              <div className="space-y-3 mb-5 relative z-10">
                {/* Online Payment Option */}
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${paymentMethod === 'online' ? 'border-[#D10000] bg-[#D10000]/5 shadow-md' : 'border-gray-100 bg-white hover:border-[#D10000]/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'online' ? 'bg-[#D10000] text-white' : 'bg-gray-50 text-gray-400'}`}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary">Online Payment</h4>
                      <p className="text-[10px] font-bold text-text-muted tracking-widest">Cards, UPI, Netbanking</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'online' ? 'border-[#D10000]' : 'border-gray-100'}`}>
                    <div className={`w-3 h-3 rounded-full bg-[#D10000] transition-transform ${paymentMethod === 'online' ? 'scale-100' : 'scale-0'}`}></div>
                  </div>
                </div>

                {/* Wallet Option */}
                <div
                  onClick={() => walletBalance >= total ? setPaymentMethod('wallet') : null}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${paymentMethod === 'wallet' ? 'border-[#D10000] bg-[#D10000]/5 shadow-md' : walletBalance < total ? 'border-gray-50 bg-gray-50/30 opacity-60 cursor-not-allowed' : 'border-gray-100 bg-white hover:border-[#D10000]/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-[#D10000] text-white' : 'bg-gray-50 text-gray-400'}`}>
                      <Wallet size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-text-primary">Guesto Wallet</h4>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${walletBalance >= total ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          ₹{walletBalance}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-text-muted tracking-widest truncate">Use your refund balance</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'wallet' ? 'border-[#D10000]' : 'border-gray-100'}`}>
                    <div className={`w-3 h-3 rounded-full bg-[#D10000] transition-transform ${paymentMethod === 'wallet' ? 'scale-100' : 'scale-0'}`}></div>
                  </div>
                </div>

                {/* COD Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${paymentMethod === 'cod' ? 'border-[#D10000] bg-[#D10000]/5 shadow-md' : 'border-gray-100 bg-white hover:border-[#D10000]/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-[#D10000] text-white' : 'bg-gray-50 text-gray-400'}`}>
                      <Banknote size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary">Cash on Delivery</h4>
                      <p className="text-[10px] font-bold text-text-muted tracking-widest">Pay when you receive</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-[#D10000]' : 'border-gray-100'}`}>
                    <div className={`w-3 h-3 rounded-full bg-[#D10000] transition-transform ${paymentMethod === 'cod' ? 'scale-100' : 'scale-0'}`}></div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50/50 rounded-2xl p-4 mb-5 space-y-2 relative z-10 border border-gray-100">
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-text-primary tracking-widest">To Pay</span>
                  <span className="text-xl font-black text-[#D10000] tracking-tighter">₹{total}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3 justify-center mb-4 opacity-40">
                <ShieldCheck size={14} className="text-green-600" />
                <span className="text-[8px] font-black tracking-[0.2em]">Secure Checkout Guaranteed</span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="relative bg-[#DA9133] text-white font-black py-2.5 px-6 rounded-xl flex items-center justify-center gap-2.5 text-[10px] md:text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-lg overflow-hidden disabled:opacity-50 w-full hover:bg-[#C27D29]"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                <span className="relative z-10 tracking-[0.1em]">{loading ? 'Processing...' : 'Place Order'}</span>
                {!loading && <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentPage;
