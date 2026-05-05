import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, CreditCard, Banknote, MapPin, ChevronRight, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [loading, setLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = React.useRef(null);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Get delivery address from location state or fallback
  const deliveryAddress = location.state?.deliveryAddress;
  const deliveryFee = 0;
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;

  useEffect(() => {
    window.scrollTo(0, 0);
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
    };
  }, [deliveryAddress, cartItems, navigate]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => {
          const variants = item.variants || item.sizes || [];
          const sizeData = variants.find(v => v.size === item.selectedSize);
          const price = sizeData ? sizeData.price : (item.offerPrice || 0);
          
          return {
            menuItem: item._id,
            size: item.selectedSize,
            quantity: item.quantity,
            price: price
          };
        }),
        address: deliveryAddress,
        paymentMethod,
        totalAmount: total,
        subtotal,
        deliveryFee,
        platformFee
      };

      const response = await api.post('/api/orders', orderData);

      if (response.data.success) {
        setIsOrderSuccess(true);
        Swal.fire({
          html: `
            <div class="p-4">
              <div class="w-24 h-24 bg-[#D10000]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D10000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 class="text-2xl font-black text-text-primary tracking-tight mb-2">Order Feast Placed!</h2>
              <p class="text-sm font-bold text-text-muted opacity-70 mb-8">Your delicious order is being prepared with love and care.</p>
              <div class="flex flex-col gap-3">
                <div class="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span class="text-[10px] font-black uppercase tracking-widest text-text-muted">Order ID</span>
                  <span class="text-xs font-black text-[#D10000]">#${response.data.data.orderNumber}</span>
                </div>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Track My Order',
          confirmButtonColor: '#DA9133',
          customClass: {
            popup: 'rounded-[2.5rem]',
            confirmButton: 'rounded-2xl px-12 py-4 font-black uppercase tracking-widest text-sm'
          }
        }).then((result) => {
          clearCart();
          const orderId = response.data.data._id || response.data.data.id;
          if (orderId) {
            navigate(`/track-order/${orderId}`);
          } else {
            navigate('/my-orders');
          }
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Swal.fire({
        title: 'Order Failed',
        text: error.response?.data?.message || 'Something went wrong while placing your order.',
        icon: 'error',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setLoading(false);
    }
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
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Delivery Details</h3>
              </div>

              <div className="bg-white/50 rounded-2xl p-5 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black text-[#D10000] bg-[#D10000]/5 px-2 py-0.5 rounded-md">
                    {deliveryAddress.type || 'Home'}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted">{deliveryAddress.mobile}</span>
                </div>
                <h4 className="font-black text-text-primary text-sm mb-1">{deliveryAddress.recipientName || 'Myself'}</h4>
                <p className="text-xs text-text-muted font-bold opacity-70 leading-relaxed">
                  {deliveryAddress.address}
                </p>
              </div>
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
