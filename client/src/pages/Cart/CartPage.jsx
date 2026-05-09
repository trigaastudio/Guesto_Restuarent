import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, MapPin, Clock, CreditCard, X, Home, Briefcase, User as UserIcon, Users } from 'lucide-react';
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
            className="w-full bg-[#DA9133] text-white font-black py-3 rounded-xl hover:shadow-[0_15px_40px_rgba(218,145,51,0.2)] transition-all flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50"
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
  const [additionalNote, setAdditionalNote] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ fee: 0, distance: 0 });
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

  useEffect(() => {
    if (deliveryAddress?.location) {
      const info = calculateDeliveryInfo(deliveryAddress.location);
      setDeliveryInfo(info);
    }
  }, [deliveryAddress]);

  const calculateDeliveryInfo = (locationStr) => {
    try {
      const urlMatch = locationStr.match(/q=([-.\d]+),([-.\d]+)/);
      if (!urlMatch) return { fee: 0, distance: 0 };

      const userLat = parseFloat(urlMatch[1]);
      const userLng = parseFloat(urlMatch[2]);

      const restLat = parseFloat(import.meta.env.VITE_RESTAURANT_LAT || '10.668194');
      const restLng = parseFloat(import.meta.env.VITE_RESTAURANT_LNG || '76.025111');

      if (isNaN(userLat) || isNaN(userLng) || isNaN(restLat) || isNaN(restLng)) {
        return { fee: 0, distance: 0 };
      }

      const R = 6371;
      const dLat = (userLat - restLat) * Math.PI / 180;
      const dLng = (userLng - restLng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(restLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      let fee = 0;
      if (distance > 5) {
        fee = Math.ceil(distance - 5) * 10;
      }
      return { fee: isNaN(fee) ? 0 : fee, distance: isNaN(distance) ? 0 : distance.toFixed(1) };
    } catch (e) {
      return { fee: 0, distance: 0 };
    }
  };

  const platformFee = 0;
  const total = subtotal + deliveryInfo.fee + platformFee;

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

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-12 md:gap-24">

          {/* Left Column: Main Visual Component */}
          <div className="relative flex-shrink-0">
            <div className="w-56 h-56 md:w-80 md:h-80 relative group">
              {/* Layered Glass Rings */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.08)] rotate-6 border border-white/50 transition-all duration-700 group-hover:rotate-12 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] -rotate-3 border border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:-rotate-6">
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
              <span className="text-[10px] md:text-xs font-black tracking-[0.1em] text-[#D10000]">Empty Plate Alert</span>
            </div>

            <h1 className="text-4xl md:text-4xl lg:text-5xl font-black text-[#2D2D2D] tracking-tighter leading-[0.9] md:leading-[0.8] mb-8 animate-in fade-in slide-in-from-left-6 duration-1000">
              YOUR CART IS <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D10000] to-[#DA9133]">CRAVING</span>
            </h1>

            <p className="text-[#6B6B6B] font-bold text-sm md:text-lg leading-relaxed opacity-80 mb-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
              It looks like your cart is waiting for a feast. Let's fill it with something extraordinary today.
            </p>

            <div className="relative group animate-in fade-in slide-in-from-left-10 duration-1000 delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D10000] to-[#DA9133] rounded-[2.5rem] blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
              <button
                onClick={() => navigate('/home')}
                className="relative bg-[#D10000] text-white font-black py-2.5 px-6 rounded-xl flex items-center gap-2.5 text-[9px] md:text-[10px] tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95 shadow-lg overflow-hidden"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="relative z-10">Start Your Feast</span>
              </button>
            </div>

            {/* Subtle Brand Detail */}
            <div className="mt-16 opacity-30 flex items-center gap-4 grayscale scale-90 md:scale-100 origin-left">
              <img src="/logo-light.png" alt="" className="h-6 invert opacity-50" />
              <div className="w-1 h-1 rounded-full bg-black"></div>
              <span className="text-[10px] font-black tracking-[0.1em]">Premium Dining Experience</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column: Address Selection */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#D10000] text-white flex items-center justify-center rounded-lg shadow-lg">
                  <MapPin size={16} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Choose a delivery address</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedAddresses.map((addr) => (
                  <div key={addr._id} className={`flex flex-col h-full p-4 border-2 rounded-xl transition-all ${deliveryAddress._id === addr._id ? 'border-[#D10000] shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                    <div className="flex items-start gap-3 mb-3 flex-grow">
                      <div className="mt-1 flex-shrink-0">
                        {addr.type === 'home' ? <Home size={18} className="text-gray-500" /> : <Briefcase size={18} className="text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-gray-800 capitalize mb-0.5 truncate">{addr.type}</h4>
                        <p className="text-[10px] font-black text-[#D10000] uppercase tracking-wider mb-1">{addr.name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight line-clamp-2 mb-1">{addr.address}</p>
                        {addr.landmark && <p className="text-[10px] font-bold text-[#D10000] italic mb-1 truncate">Landmark: {addr.landmark}</p>}
                        <p className="text-[10px] font-black text-gray-900 lowercase tracking-wider">45 mins</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectAddress(addr)}
                      className={`w-full py-2.5 rounded-lg font-black text-[10px] tracking-widest uppercase transition-all mt-auto ${deliveryAddress._id === addr._id ? 'bg-[#DA9133] text-white' : 'bg-[#DA9133]/80 hover:bg-[#DA9133] text-white'}`}
                    >
                      Deliver Here
                    </button>
                  </div>
                ))}

                {/* Add New Address Card */}
                <div
                  onClick={() => setIsAddressModalOpen(true)}
                  className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all min-h-[190px] h-full group bg-gray-50/30"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-[#DA9133] group-hover:text-white transition-all border border-gray-100">
                    <Plus size={20} strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-black text-gray-400 group-hover:text-gray-700 uppercase tracking-widest">Add New Address</span>
                </div>
              </div>
            </div>

            {/* Payment (Placeholder for next step) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 text-gray-400 flex items-center justify-center rounded-lg">
                  <CreditCard size={16} />
                </div>
                <h2 className="text-xl font-black text-gray-400 tracking-tight">Payment</h2>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="w-full lg:w-[320px]">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

              {/* Items Scrollable Area */}
              <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                {cartItems.map((item) => {
                  const variants = item.variants || item.sizes || [];
                  const sizeData = variants.find(v => v.size === item.selectedSize);
                  const price = sizeData ? sizeData.price : (item.offerPrice || 0);

                  return (
                    <div key={`${item._id}-${item.selectedSize}`} className="flex justify-between items-start gap-3 relative group/item">
                      <div className="flex items-start gap-2 flex-1">
                        {/* Compact Image */}
                        <div className="w-14 h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm relative group">
                          <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                          <div className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-sm border border-white flex items-center justify-center p-0.5 ${item.foodType === 'veg' ? 'bg-white border-green-600' : 'bg-white border-red-600'}`}>
                            <div className={`w-1 h-1 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-black text-gray-800 leading-tight truncate">
                            {item.name}
                          </h4>
                          {item.selectedSize && <p className="text-[10px] font-bold text-gray-400 mt-0.5 opacity-80">({item.selectedSize})</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                        {/* Quantity Stepper & Delete */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-0.5 shadow-sm">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedSize)}
                              className="w-6 h-6 flex items-center justify-center text-[#D10000] hover:bg-[#D10000] hover:text-white rounded-md transition-all font-black text-sm"
                            >
                              -
                            </button>
                            <span className="text-[11px] font-black w-4 text-center text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize)}
                              className="w-6 h-6 flex items-center justify-center text-[#D10000] hover:bg-[#D10000] hover:text-white rounded-md transition-all font-black text-sm"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item._id, item.selectedSize)}
                            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-[#D10000] hover:bg-[#D10000]/5 rounded-full transition-all"
                            title="Remove Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {/* Accurate Price Tag */}
                        <div className="bg-gray-900 text-white px-2 py-0.5 rounded-md">
                          <span className="text-[11px] font-black tracking-tighter">₹{price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Sections removed for cleaner UI */}

                {/* Additional Note */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-3 bg-[#DA9133] rounded-full"></div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Additional Note</label>
                  </div>
                  <textarea
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="E.g. Ring the bell, deliver to gate..."
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-3 text-[11px] font-bold text-gray-700 focus:ring-1 focus:ring-[#DA9133] focus:border-[#DA9133] outline-none transition-all resize-none h-20 placeholder:text-gray-300 shadow-inner"
                  />
                </div>
              </div>

              {/* Bill Details */}
              <div className="p-6 bg-white border-t border-gray-50">
                <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Bill Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Item Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-1.5">Delivery Fee | {deliveryInfo.distance} kms <Clock size={12} className="opacity-40" /></span>
                      <span className={deliveryInfo.fee === 0 ? 'text-green-600' : ''}>
                        {deliveryInfo.fee === 0 ? 'FREE' : `₹${deliveryInfo.fee}`}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-[#D10000] italic opacity-70">
                      * delivery is free around 5 kilometers
                    </p>
                  </div>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">GST and Other Charges <Clock size={12} className="opacity-40" /></span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="h-[2px] bg-gray-900 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-gray-900 uppercase tracking-widest">To Pay</span>
                    <span className="text-xl font-black text-gray-900">₹{total}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!deliveryAddress.address) {
                      Swal.fire({ title: 'Select Address', text: 'Please select a delivery address.', icon: 'warning' });
                      return;
                    }
                    navigate('/payment', { state: { deliveryAddress, additionalNote, deliveryFee: deliveryInfo.fee, platformFee } });
                  }}
                  className="w-full mt-8 bg-[#DA9133] text-white font-black py-4 rounded-xl hover:bg-[#C27D29] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                >
                  Proceed to Pay ₹{total}
                </button>
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
