import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ChevronRight, MapPin, Clock, CreditCard, X, Home, Briefcase, User as UserIcon, Users } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import AddressModal from '../../components/AddressModal/AddressModal';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';

const AddressListModal = ({ isOpen, onClose, addresses, onSelect, onAddAddress }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#FAF9F6] w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#D10000]/10 flex justify-between items-center bg-[#D10000]">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Select Delivery Address</h3>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Where should we deliver your order?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 text-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Address List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {addresses.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <MapPin size={32} />
              </div>
              <p className="text-sm font-bold text-text-muted italic opacity-60">No saved addresses found yet.</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr._id || addr.id}
                onClick={() => onSelect(addr)}
                className="group cursor-pointer bg-[#FAF9F6] hover:bg-primary/5 border border-gray-100 hover:border-primary/20 p-5 rounded-[1.5rem] transition-all duration-300 flex items-start gap-4 shadow-sm hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${addr.type === 'home' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100' : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'}`}>
                  {addr.type === 'home' ? <Home size={22} /> : <Briefcase size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-text-primary capitalize tracking-tight">{addr.type}</h4>
                    {addr.isDefault && (
                      <span className="bg-green-100 text-green-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted font-bold leading-relaxed truncate-2-lines">{addr.address}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-gray-100 group-hover:border-primary flex items-center justify-center transition-all bg-[#FAF9F6]">
                  <div className={`w-3 h-3 rounded-full bg-primary transition-transform ${addr.isDefault ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onAddAddress}
            className="w-full bg-[#DA9133] text-white font-black py-4 rounded-2xl hover:bg-[#C27D29] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] shadow-lg shadow-[#DA9133]/20"
          >
            <Plus size={18} strokeWidth={3} /> Add New Address
          </button>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, clearCart, loading } = useCart();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [isAddressListModalOpen, setIsAddressListModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    location: '',
    type: 'home'
  });

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAddresses();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/api/users/addresses');
      if (response.data.success) {
        setSavedAddresses(response.data.data);
        const defaultAddr = response.data.data.find(addr => addr.isDefault) || response.data.data[0];
        if (defaultAddr) {
          setDeliveryAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const deliveryFee = 0;
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;

  const handleSaveAddress = async (newAddress) => {
    try {
      const response = await api.post('/api/users/address', newAddress);
      if (response.data.success) {
        const addresses = response.data.data;
        setSavedAddresses(addresses);
        // Use the newly added address as active
        setDeliveryAddress(addresses[addresses.length - 1]);
        setIsAddressModalOpen(false);
        setIsAddressListModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleSelectAddress = async (addr) => {
    try {
      // If it's already default, just select it and close
      if (addr.isDefault) {
        setDeliveryAddress(addr);
        setIsAddressListModalOpen(false);
        return;
      }

      const response = await api.put(`/api/users/address/${addr._id}/default`);
      if (response.data.success) {
        setSavedAddresses(response.data.data);
        setDeliveryAddress(addr);
        setIsAddressListModalOpen(false);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      // Fallback: still select it for the session
      setDeliveryAddress(addr);
      setIsAddressListModalOpen(false);
    }
  };

  // Prevent flicker by checking loading state first
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 md:p-12 text-center md:text-left relative overflow-hidden font-sans">
        {/* Immersive Organic Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-[#D10000]/10 rounded-full blur-[100px] md:blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-5%] left-[-10%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-[#DA9133]/10 rounded-full blur-[90px] md:blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center max-w-7xl w-full gap-12 md:gap-24">

          {/* Left Column: Main Visual Component */}
          <div className="relative flex-shrink-0">
            <div className="w-56 h-56 md:w-80 md:h-80 relative group">
              {/* Layered Glass Rings */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-[2.5rem] md:rounded-[4rem] shadow-[0_20px_80px_rgba(0,0,0,0.08)] rotate-6 border border-white/50 transition-all duration-700 group-hover:rotate-12 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] -rotate-3 border border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:-rotate-6">
                <div className="absolute top-0 right-0 w-24 md:w-40 h-24 md:h-40 bg-[#D10000]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 md:w-40 h-24 md:h-40 bg-[#DA9133]/5 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col items-center animate-float">
                  <div className="relative mb-4 w-40 h-40 md:w-64 md:h-64 flex items-center justify-center">
                    <ShoppingCart size={80} className="absolute text-[#D10000] opacity-5 md:size-[120px]" />
                    <img src="/icons/biriyani.png" alt="Biriyani" className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] mix-blend-multiply" />
                  </div>
                  <div className="flex gap-1.5 -mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-[#D10000]/30 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Accents */}
              <div className="absolute -top-6 -right-6 w-20 h-20 md:w-28 md:h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-2 animate-float border border-gray-50 overflow-hidden" style={{ animationDelay: '0.5s' }}>
                <img src="/icons/alfaham.png" alt="Alfaham" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="absolute -bottom-4 -left-10 w-16 h-16 md:w-24 md:h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-2 animate-float border border-gray-50 overflow-hidden" style={{ animationDelay: '1.2s' }}>
                <img src="/icons/chicken_fry.png" alt="Chicken Fry" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="absolute top-1/2 -right-12 w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 animate-float border border-gray-50 overflow-hidden" style={{ animationDelay: '0.8s' }}>
                <img src="/icons/beef_curry.png" alt="Beef Curry" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
            </div>
          </div>

          {/* Right Column: Text Content & Actions */}
          <div className="flex flex-col items-center md:items-start max-w-xl">
            <div className="inline-block px-4 py-1.5 bg-[#D10000]/5 rounded-full border border-[#D10000]/10 mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#D10000]">Empty Plate Alert</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[#2D2D2D] tracking-tighter leading-[0.9] md:leading-[0.8] mb-8 animate-in fade-in slide-in-from-left-6 duration-1000">
              YOUR CART IS <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D10000] to-[#DA9133]">CRAVING</span>
            </h1>

            <p className="text-[#6B6B6B] font-bold text-base md:text-xl leading-relaxed opacity-80 mb-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
              It looks like your cart is waiting for a feast. Let's fill it with something extraordinary today.
            </p>

            <div className="relative group animate-in fade-in slide-in-from-left-10 duration-1000 delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D10000] to-[#DA9133] rounded-[2.5rem] blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
              <button
                onClick={() => navigate('/home')}
                className="relative bg-[#D10000] text-white font-black py-5 md:py-7 px-12 md:px-20 rounded-[2.5rem] flex items-center gap-4 text-sm md:text-base uppercase tracking-[0.25em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl overflow-hidden"
              >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                <span className="relative z-10">Start Your Feast</span>
              </button>
            </div>

            {/* Subtle Brand Detail */}
            <div className="mt-16 opacity-30 flex items-center gap-4 grayscale scale-90 md:scale-100 origin-left">
              <img src="/logo-light.png" alt="" className="h-6 invert opacity-50" />
              <div className="w-1 h-1 rounded-full bg-black"></div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase">Premium Dining Experience</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          hideCart={true}
        />

        {/* Simple Back Header below Navbar */}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4 relative z-10 pb-4">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-[#D10000] transition-all shadow-xl group border border-white/30 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-black text-lg uppercase tracking-widest">My Cart</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-4 pb-16 bg-[#FAF9F6]">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Main Content Area */}
          <div className="flex-1 space-y-8 w-full">

            {/* Delivery Steps */}
            <div className="bg-white rounded-[2rem] p-8 flex flex-wrap gap-8 items-center justify-between border border-[#D10000]/5 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#D10000]/10 flex items-center justify-center text-[#D10000]">
                  <MapPin size={22} />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-black text-text-primary tracking-tight leading-none uppercase">Delivery Address</h4>
                    <button
                      onClick={() => setIsAddressListModalOpen(true)}
                      className="text-[8px] font-black text-[#D10000] uppercase tracking-widest bg-[#D10000]/5 hover:bg-[#D10000]/10 px-2 py-1 rounded-lg transition-all border border-[#D10000]/10 active:scale-95"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted font-bold opacity-60 leading-tight tracking-wide">
                    {deliveryAddress.address || 'Set your location for delivery'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <Clock size={22} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Estimated Time</h4>
                  <p className="text-[11px] text-text-muted font-bold opacity-60 leading-tight tracking-wide">25 - 35 MINUTES</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-[#D10000] rounded-full"></div>
                <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">Cart Items ({cartItems.length})</h2>
              </div>

              {cartItems.map((item) => (
                <div key={item._id} className="bg-white rounded-[2.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center gap-6 group hover:shadow-[0_25px_60px_rgb(0,0,0,0.06)] transition-all duration-700">
                  {/* Compact Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.8rem] overflow-hidden bg-gray-50 flex-shrink-0 relative">
                    <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${item.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{item.foodType}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-base md:text-lg font-black text-text-primary group-hover:text-[#D10000] transition-colors leading-tight uppercase truncate">
                        {item.name} {item.selectedSize && <span className="text-[10px] text-text-muted">({item.selectedSize})</span>}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item._id, item.selectedSize)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40 mb-4">{item.category?.name || 'Main Course'}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="font-black text-xl text-text-primary tracking-tighter">
                        <span className="text-[#D10000] text-sm mr-0.5 font-bold">₹</span>
                        {(() => {
                          const variants = item.variants || item.sizes || [];
                          const sizeData = variants.find(v => v.size === item.selectedSize);
                          const price = sizeData ? sizeData.price : (item.offerPrice || 0);
                          return price * item.quantity;
                        })()}
                      </div>

                      {/* Premium Stepper */}
                      <div className="flex items-center gap-3 bg-gray-50 px-2 py-1.5 rounded-2xl border border-gray-100">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedSize)}
                          className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-text-primary hover:bg-[#D10000] hover:text-white transition-all active:scale-90"
                        >
                          <Minus size={12} strokeWidth={4} />
                        </button>
                        <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize)}
                          className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-text-primary hover:bg-[#D10000] hover:text-white transition-all active:scale-90"
                        >
                          <Plus size={12} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[380px] sticky top-44">
            <div className="bg-white rounded-[3rem] p-8 border border-gray-100 flex flex-col shadow-sm">
              <h2 className="text-2xl font-black text-text-primary tracking-tight mb-8 uppercase">Order Details</h2>

              {/* Pricing Breakdown */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-text-muted/60">
                  <span>Item Total</span>
                  <span className="text-text-primary">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-text-muted/60">
                  <span>Delivery Partner Fee</span>
                  <span className="text-text-primary">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-text-muted/60">
                  <span>Platform Fee</span>
                  <span className="text-text-primary">₹{platformFee}</span>
                </div>
                <div className="h-px bg-dashed border-t border-dashed border-gray-200 my-2"></div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-text-primary uppercase tracking-widest">To Pay</span>
                  <span className="text-3xl font-black text-[#D10000] tracking-tighter leading-none">₹{total}</span>
                </div>
                {total < 100 && (
                  <p className="text-[10px] font-bold text-red-500 mt-2 text-center animate-pulse">
                    Add ₹{100 - total} more to reach minimum order of ₹100
                  </p>
                )}
              </div>

              {/* Offer Card */}
              <div className="bg-[#D10000]/5 rounded-[1.8rem] p-5 mb-8 border border-[#D10000]/10 flex items-center justify-between group cursor-pointer hover:bg-[#D10000]/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#D10000] shadow-sm">
                    <span className="text-xs">🎟️</span>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Apply Coupon</h5>
                    <p className="text-[8px] font-bold text-[#D10000]">Save up to ₹100 more</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#D10000] group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (total < 100) {
                    Swal.fire({
                      title: 'Minimum Order Required',
                      text: `Minimum order value is ₹100. Please add ₹${100 - total} more to proceed.`,
                      icon: 'info',
                      confirmButtonColor: '#DA9133'
                    });
                    return;
                  }
                  if (!deliveryAddress.address) {
                    Swal.fire({
                      title: 'Select Address',
                      text: 'Please select a delivery address before proceeding.',
                      icon: 'warning',
                      confirmButtonColor: '#DA9133'
                    });
                    return;
                  }
                  navigate('/payment', { state: { deliveryAddress } });
                }}
                className={`w-full font-black py-5 rounded-[2rem] transition-all shadow-[0_20px_50px_rgba(218,145,51,0.2)] flex flex-col items-center gap-0.5 group relative overflow-hidden ${total < 100 ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#DA9133] text-white hover:bg-[#C27D29]'}`}
              >
                <div className={`absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out ${total < 100 ? 'hidden' : ''}`}></div>
                <span className="relative z-10 text-sm tracking-widest mb-0.5">Proceed to Pay</span>
                <span className="relative z-10 text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">Inclusive of all taxes</span>
              </button>

              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 text-[8px] font-black text-text-muted/40 uppercase tracking-[0.3em]">
                  <CreditCard size={10} /> 100% Safe Payments
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Shared Footer Style */}
      <Footer />


      {/* Address List Modal */}
      <AddressListModal
        isOpen={isAddressListModalOpen}
        onClose={() => setIsAddressListModalOpen(false)}
        addresses={savedAddresses}
        onSelect={handleSelectAddress}
        onAddAddress={() => {
          setIsAddressListModalOpen(false);
          setIsAddressModalOpen(true);
        }}
      />

      {/* Add/Edit Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        user={user}
      />
    </div>
  );
};

export default CartPage;
