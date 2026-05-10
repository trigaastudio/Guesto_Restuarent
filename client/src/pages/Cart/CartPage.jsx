import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, MapPin, Clock, CreditCard, X, Home, Briefcase, User as UserIcon, Users, CheckCircle2, ChevronRight, ShieldCheck, ShoppingBag, Phone } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import AddressModal from '../../components/AddressModal/AddressModal';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useTheme } from '../../context/ThemeContext';
import Loader from '../../components/Loader/Loader';

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
      <div className="bg-background-card w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-primary">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Select Delivery Address</h3>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Where should we deliver your order?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 text-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Address List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar bg-background">
          {addresses.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-background-card rounded-full flex items-center justify-center mx-auto text-text-muted/20 border border-border/40">
                <MapPin size={32} />
              </div>
              <p className="text-sm font-bold text-text-muted italic opacity-60">No saved addresses found yet.</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr._id}
                onClick={() => {
                  onSelect(addr);
                  onClose();
                }}
                className="group p-5 bg-background-card rounded-2xl border-2 border-border/40 hover:border-primary/40 cursor-pointer transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {addr.type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-text-primary capitalize mb-1">{addr.type}</h4>
                    <p className="text-[10px] font-bold text-text-muted opacity-70 leading-relaxed">{addr.address}</p>
                    <p className="text-[9px] font-black text-primary tracking-widest mt-2 flex items-center gap-1">
                      <Phone size={10} /> {addr.mobile}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-background-card border-t border-border/40">
          <button
            onClick={() => {
              onAddAddress();
              onClose();
            }}
            className="w-full py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            Add New Address
          </button>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, subtotal, loading: cartLoading, settings, checkStoreStatus } = useCart();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [additionalNote, setAdditionalNote] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = React.useRef(null);
  const [distance, setDistance] = useState(0);
  
  useEffect(() => {
    document.title = "GuestO | Your Cart";
    window.scrollTo(0, 0);
  }, []);

  // Dynamic Fee Calculation
  const getDeliveryFee = () => {
    if (!settings || !deliveryAddress) return 0;
    const { freeDistanceLimit, chargePerExtraKm, pricingType } = settings.deliverySettings || {};
    
    if (pricingType === 'distance' && distance > freeDistanceLimit) {
      return Math.round((distance - freeDistanceLimit) * chargePerExtraKm);
    }
    return 0; // Free if within limit or settings not loaded
  };

  const deliveryFee = getDeliveryFee();
  const platformFee = settings?.operationalSettings?.platformFee || 0;
  const total = subtotal + deliveryFee + platformFee;

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      fetchAddresses();
    }
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distance calculation logic
  useEffect(() => {
    if (settings?.restaurantDetails?.location && deliveryAddress?.location) {
      const restaurantLoc = settings.restaurantDetails.location;
      const userLocMatch = deliveryAddress.location.match(/q=([\d.-]+),([\d.-]+)/);
      
      if (userLocMatch && restaurantLoc.lat && restaurantLoc.lng) {
        const userLat = parseFloat(userLocMatch[1]);
        const userLng = parseFloat(userLocMatch[2]);
        
        // Haversine Formula
        const R = 6371; // km
        const dLat = (userLat - restaurantLoc.lat) * Math.PI / 180;
        const dLon = (userLng - restaurantLoc.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(restaurantLoc.lat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = R * c;
        setDistance(dist);
      }
    }
  }, [settings, deliveryAddress]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/api/users/addresses');
      if (response.data.success) {
        const addresses = response.data.data || [];
        setSavedAddresses(addresses);
        if (addresses.length > 0 && !deliveryAddress) {
          setDeliveryAddress(addresses.find(a => a.isDefault) || addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSaveAddress = async (formData) => {
    try {
      setLoading(true);
      const isEditing = !!formData._id;
      const url = isEditing ? `/api/users/address/${formData._id}` : '/api/users/address';
      const method = isEditing ? 'put' : 'post';

      const response = await api[method](url, formData);
      if (response.data.success) {
        setIsAddressModalOpen(false);
        await fetchAddresses();
        Swal.fire({
          title: isEditing ? 'Address Updated!' : 'Address Saved!',
          text: isEditing ? 'Your location details have been updated.' : 'Your new delivery location has been added.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  const handleSelectAddress = (address) => {
    setDeliveryAddress(address);
  };

  const handleCheckout = () => {
    if (!deliveryAddress) {
      Swal.fire({
        title: 'Missing Address',
        text: 'Please add or select a delivery address before proceeding.',
        icon: 'warning',
        confirmButtonColor: '#B91C1C',
        customClass: { popup: 'rounded-[2rem] bg-background-card text-text-primary' }
      });
      return;
    }

    navigate('/payment', {
      state: {
        deliveryAddress,
        additionalNote,
        deliveryFee,
        platformFee
      }
    });
  };

  if (cartLoading && cartItems.length === 0) {
    return <Loader fullPage={true} />;
  }

  if (cartItems.length === 0) {
    return (
      <div className={`min-h-screen bg-background font-sans overflow-x-hidden ${theme}`}>
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />
        <div className="relative pt-24 md:pt-32 pb-24">
          <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-background-card/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          </div>
          
          <main className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-1000">
              <div className="relative mb-10">
                <div className="w-48 h-48 bg-background-card rounded-[4rem] flex items-center justify-center text-text-muted/10 shadow-2xl border border-border/40">
                  <ShoppingBag size={80} strokeWidth={1} className="text-primary opacity-10" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/40 animate-bounce">
                  <ShoppingCart size={32} strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4 uppercase">Your Cart is <span className="text-primary">Empty</span></h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-12 opacity-50">Hungry? Your next great meal is just a click away!</p>
              <button onClick={() => navigate('/home')} className="bg-primary hover:bg-primary-dark text-white px-12 py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all shadow-2xl shadow-primary/20 active:scale-95 flex items-center gap-3">
                <ArrowLeft size={18} strokeWidth={3} />
                Browse Our Menu
              </button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

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
      />

      <div className="relative">
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background-card/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

        <main className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 relative z-10 pb-24">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            
            {/* Left Column: Cart Items & Address */}
            <div className="flex-1 space-y-8 w-full">
              
              {/* Delivery Address Section */}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-1 bg-primary rounded-full"></span>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary tracking-widest uppercase">Delivery Details</p>
                      <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Choose Destination</h2>
                    </div>
                  </div>
                  {savedAddresses.length > 0 && (
                    <button 
                      onClick={() => setIsAddressListOpen(true)}
                      className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10 hover:bg-primary hover:text-white transition-all duration-500"
                    >
                      Change Address
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {savedAddresses.map((addr) => (
                    <div 
                      key={addr._id} 
                      onClick={() => handleSelectAddress(addr)}
                      className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden ${deliveryAddress?._id === addr._id ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-border/40 bg-background hover:border-primary/20 hover:shadow-lg'}`}
                    >
                      <div className="flex items-start gap-4 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${deliveryAddress?._id === addr._id ? 'bg-primary text-white' : 'bg-background-card text-text-muted/40 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          {addr.type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-text-primary capitalize mb-1 truncate">{addr.type}</h4>
                          <p className="text-[10px] font-bold text-text-muted opacity-70 leading-relaxed line-clamp-2">{addr.address}</p>
                        </div>
                      </div>
                      
                      {deliveryAddress?._id === addr._id && (
                        <div className="absolute bottom-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white animate-in zoom-in duration-500">
                          <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Address Card */}
                  <div
                    onClick={() => setIsAddressModalOpen(true)}
                    className="p-5 border-2 border-dashed border-border/60 rounded-[2rem] hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-500 group bg-background/30 hover:bg-background-card min-h-[120px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background-card shadow-sm flex items-center justify-center text-text-muted/40 group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-border/40">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-text-muted group-hover:text-text-primary uppercase tracking-widest transition-colors duration-500">New Address</span>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="bg-background-card rounded-[3rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-6 h-1 bg-primary rounded-full"></span>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">Menu Selection</p>
                    <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Your Feast Items</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item._id} className="group relative bg-background rounded-[2.5rem] p-4 md:p-6 border border-border/40 hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
                      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        {/* Image Container */}
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-background-card rounded-3xl p-3 border border-border/40 relative group-hover:scale-105 transition-transform duration-500 shadow-inner shrink-0">
                          <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain" />
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h3 className="text-lg md:text-xl font-black text-text-primary tracking-tight group-hover:text-primary transition-colors duration-500 truncate uppercase">{item.name}</h3>
                            <span className="text-xl font-black text-primary tracking-tighter">
                              ₹{(() => {
                                const variants = item.variants || item.sizes || [];
                                const sizeData = variants.find(v => v.size === item.selectedSize);
                                return sizeData ? sizeData.price : (item.offerPrice || 0);
                              })()}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {item.selectedSize && (
                              <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                                {item.selectedSize}
                              </span>
                            )}
                            {(() => {
                              const variants = item.variants || item.sizes || [];
                              const sizeData = variants.find(v => v.size === item.selectedSize);
                              const extras = sizeData?.includedItems || [];
                              if (extras.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-2">
                                    {extras.map((extra, i) => {
                                      const extraName = typeof extra === 'string' ? extra : (extra.name || extra.menuItem?.name);
                                      if (!extraName) return null;
                                      return (
                                        <span key={i} className="text-[9px] font-bold text-green-600 bg-green-500/5 px-2.5 py-1 rounded-xl border border-green-500/10 flex items-center gap-2 shadow-sm">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                          <span className="uppercase tracking-wider">{extraName}</span>
                                          <span className="bg-green-500/10 px-1.5 py-0.5 rounded-md text-[8px]">x{(extra.quantity || 1) * item.quantity}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <p className="text-[11px] font-bold text-text-muted opacity-60 line-clamp-1 italic">{item.description}</p>

                          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                            <div className="flex items-center bg-background-card rounded-2xl border border-border/40 p-1 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedSize)}
                                className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                              >
                                <Minus size={18} strokeWidth={3} />
                              </button>
                              <span className="w-10 text-center font-black text-text-primary text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize)}
                                className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                              >
                                <Plus size={18} strokeWidth={3} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item._id, item.selectedSize)}
                              className="text-text-muted/40 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl group/trash"
                            >
                              <Trash2 size={20} strokeWidth={2} className="group-hover/trash:animate-bounce" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-background-card rounded-[2.5rem] p-8 md:p-10 border border-border/40 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Clock size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-black text-text-primary tracking-tight">Special Instructions</h3>
                </div>
                <textarea
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  placeholder="Any specific requests? Spicy, less salt, or leave at the gate..."
                  className="w-full bg-background border-2 border-border/40 rounded-3xl p-6 text-sm font-bold text-text-primary focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none min-h-[120px] placeholder:text-text-muted/30"
                ></textarea>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="w-full lg:w-[400px] sticky top-32">
              <div className="bg-background-card rounded-[3.5rem] shadow-[0_50px_120px_rgba(0,0,0,0.06)] border border-border/40 overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-light to-primary"></div>
                
                <div className="p-8 md:p-10">
                  <h2 className="text-xl font-black text-text-primary tracking-tight mb-8 flex items-center gap-3">
                    <ShoppingCart size={22} className="text-primary" />
                    Bill Summary
                  </h2>

                  <div className="space-y-5 mb-10">
                    <div className="flex justify-between items-center group">
                      <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Item Total</span>
                      <span className="text-sm font-black text-text-primary tracking-tighter">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Delivery Fee</span>
                        {distance > 0 && (
                          <span className="text-[8px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                            {distance.toFixed(1)} km
                          </span>
                        )}
                        <div className="w-4 h-4 rounded-full bg-primary/5 flex items-center justify-center text-primary cursor-help">
                          <ShieldCheck size={10} />
                        </div>
                      </div>
                      <span className={`text-sm font-black tracking-tighter ${deliveryFee === 0 ? 'text-green-500' : 'text-text-primary'}`}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Platform Fee</span>
                      <span className="text-sm font-black text-text-primary tracking-tighter">₹{platformFee}</span>
                    </div>
                    
                    <div className="h-px bg-border/20 my-2"></div>
                    
                    <div className="flex justify-between items-center py-2">
                      <div className="space-y-1">
                        <span className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">Grand Total</span>
                        <p className="text-[9px] font-bold text-text-muted italic opacity-40 uppercase">Inc. all taxes and fees</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-primary tracking-tighter block leading-none">₹{total}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const storeStatus = checkStoreStatus();
                    if (!storeStatus.isOpen) {
                      return (
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl space-y-3 animate-pulse">
                          <div className="flex items-center gap-3 text-red-500">
                            <Clock size={20} className="shrink-0" />
                            <p className="text-xs font-black uppercase tracking-widest">Order Disabled</p>
                          </div>
                          <p className="text-[10px] font-bold text-text-muted leading-relaxed uppercase">
                            {storeStatus.message}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <button 
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                      >
                        <span className="text-xs uppercase tracking-widest">Proceed to Checkout</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-500" />
                      </button>
                    );
                  })()}
                  
                  <div className="mt-8 p-5 bg-background rounded-2xl border border-border/40 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-primary shrink-0 shadow-sm border border-border/40">
                        <CreditCard size={18} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">Payment Method</p>
                        <p className="text-[10px] font-black text-text-primary truncate uppercase">Razorpay Secure Checkout</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center mt-6 opacity-30">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Safe & Secure Transactions</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        user={user}
      />

      <AddressListModal
        isOpen={isAddressListOpen}
        onClose={() => setIsAddressListOpen(false)}
        addresses={savedAddresses}
        onSelect={handleSelectAddress}
        onAddAddress={() => setIsAddressModalOpen(true)}
      />

      <Footer />
    </div>
  );
};

export default CartPage;
