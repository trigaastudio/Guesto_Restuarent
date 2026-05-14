import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import Loader from '../../components/Loader/Loader';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import AddressModal from '../../components/AddressModal/AddressModal';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  MapPin,
  PlusCircle,
  Home,
  Briefcase,
  Check,
  X,
  Clock,
  Zap,
  Info
} from 'lucide-react';


const AddressListModal = ({ isOpen, onClose, addresses, onSelect, onAddAddress }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-border/10 max-h-[80vh] flex flex-col">
        <div className="p-8 border-b border-border/10 flex justify-between items-center bg-primary/5">
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Your Addresses</h3>
          <button onClick={onClose} className="p-2 hover:bg-background-muted rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              onClick={() => { onSelect(addr); onClose(); }}
              className="p-5 bg-background rounded-3xl border-2 border-border/40 hover:border-primary cursor-pointer transition-all flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-background-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                {addr.type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-text-primary capitalize mb-1">{addr.type}</h4>
                <p className="text-[10px] font-bold text-text-muted opacity-70">{addr.address}, {addr.city} {addr.zipCode}</p>
              </div>
            </div>
          ))}
          <button onClick={onAddAddress} className="w-full py-5 border-2 border-dashed border-border/40 rounded-3xl text-[10px] font-black text-text-muted uppercase hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
            <Plus size={18} /> Add New Address
          </button>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { cartItems, updateQuantity, removeFromCart, subtotal, offers, settings, loading: cartLoading } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [additionalNote, setAdditionalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const platformFee = settings?.operationalSettings?.platformFee || 0;
  const total = subtotal + deliveryFee + platformFee;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateDeliveryFee = async (address) => {
    if (!address || !settings) {
      setDeliveryFee(settings?.operationalSettings?.deliveryFee || 0);
      setCalculatedDistance(null);
      return;
    }

    const pricingType = settings.deliverySettings?.pricingType || 'distance';

    if (pricingType === 'zone') {
      const zones = settings.deliverySettings?.zones || [];
      const match = zones.find(z =>
        address.address?.toLowerCase().includes(z.name.toLowerCase()) ||
        address.city?.toLowerCase().includes(z.name.toLowerCase()) ||
        address.landmark?.toLowerCase().includes(z.name.toLowerCase())
      );
      setDeliveryFee(match ? match.fee : (settings.operationalSettings?.deliveryFee || 0));
      setCalculatedDistance(null);
      return;
    }

    // Distance based
    if (pricingType === 'distance' && settings.restaurantDetails?.location?.lat) {
      try {
        setIsCalculatingFee(true);
        const url = address.location;
        if (!url) {
          setDeliveryFee(settings.operationalSettings?.deliveryFee || 0);
          return;
        }

        let targetUrl = url;
        const extractCoords = (text) => {
          if (!text) return null;
          const coordRegex = /([-.\d]+),([-.\d]+)/g;
          let match;
          while ((match = coordRegex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && Math.abs(lat) > 0.01) return { lat, lng };
          }
          return null;
        };

        if (url.includes('maps.app.goo.gl') || url.includes('share.google') || !extractCoords(url)) {
          try {
            const res = await api.post('/api/utils/expand-url', { url });
            targetUrl = res.data.expandedUrl;
          } catch (err) {
            console.error('Link expansion failed', err);
          }
        }

        const coords = extractCoords(targetUrl);
        if (coords) {
          const { lat: destLat, lng: destLng } = coords;
          const { lat: restLat, lng: restLng } = settings.restaurantDetails.location;
          let distance = calculateDistance(restLat, restLng, destLat, destLng);

          try {
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${restLng},${restLat};${destLng},${destLat}?overview=false`);
            const osrmData = await osrmRes.json();
            if (osrmData.routes?.[0]?.distance) {
              distance = osrmData.routes[0].distance / 1000;
            }
          } catch (e) { console.error('OSRM failed', e); }

          const freeLimit = settings.deliverySettings?.freeDistanceLimit || 0;
          const rate = settings.deliverySettings?.chargePerExtraKm || 0;
          const fee = distance <= freeLimit ? 0 : Math.ceil((distance - freeLimit) * rate);
          setDeliveryFee(fee);
          setCalculatedDistance(distance.toFixed(1));
        } else {
          setDeliveryFee(settings.operationalSettings?.deliveryFee || 0);
          setCalculatedDistance(null);
        }
      } catch (error) {
        console.error('Fee calculation error', error);
        setDeliveryFee(settings.operationalSettings?.deliveryFee || 0);
      } finally {
        setIsCalculatingFee(false);
      }
    } else {
      setDeliveryFee(settings.operationalSettings?.deliveryFee || 0);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) fetchAddresses();
  }, []);

  useEffect(() => {
    updateDeliveryFee(deliveryAddress);
  }, [deliveryAddress, settings]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/api/users/addresses');
      if (response.data.success) {
        const addresses = response.data.data;
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          setDeliveryAddress(defaultAddr);
        }
      }
    } catch (error) { console.error('Error fetching addresses:', error); }
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
        Swal.fire({ title: isEditing ? 'Address Updated!' : 'Address Saved!', icon: 'success', showConfirmButton: false, timer: 1500 });
      }
    } catch (error) { Swal.fire('Error', error.response?.data?.message || 'Failed to save address', 'error'); } finally { setLoading(false); }
  };

  const handleLogout = React.useCallback(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login', { replace: true }); }, [navigate]);
  const handleSelectAddress = (address) => { setDeliveryAddress(address); };
  const handleCheckout = () => {
    if (!deliveryAddress) { Swal.fire({ title: 'Missing Address', text: 'Please select a delivery address.', icon: 'warning', confirmButtonColor: '#B91C1C' }); return; }
    navigate('/payment', { state: { deliveryAddress, additionalNote, deliveryFee, platformFee } });
  };

  if (cartLoading && cartItems.length === 0) return <Loader fullPage={true} />;

  if (cartItems.length === 0) {
    return (
      <div className={`min-h-screen bg-background ${theme}`}>
        <Navbar user={user} cartItems={cartItems} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown} handleLogout={handleLogout} navigate={navigate} dropdownRef={dropdownRef} />
        <div className="relative pt-24 md:pt-32 pb-24">
          <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0"></div>
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
                <ArrowLeft size={18} strokeWidth={3} /> Browse Our Menu
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
      <Navbar user={user} cartItems={cartItems} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown} handleLogout={handleLogout} navigate={navigate} dropdownRef={dropdownRef} />
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0"></div>
        <main className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 relative z-10 pb-24">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 space-y-8 w-full">
              <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight lowercase">choose destination</h2>
                  {savedAddresses.length > 0 && (
                    <button onClick={() => setIsAddressListOpen(true)} className="text-[9px] font-black text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10 lowercase">change address</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {savedAddresses.map((addr) => (
                    <div key={addr._id} onClick={() => handleSelectAddress(addr)} className={`group relative p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${deliveryAddress?._id === addr._id ? 'border-primary bg-primary/5' : 'border-border/40 bg-background'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deliveryAddress?._id === addr._id ? 'bg-primary text-white' : 'bg-background-card text-text-muted/40'}`}>
                          {addr.type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-text-primary capitalize mb-1 truncate">{addr.type}</h4>
                          <p className="text-[10px] font-bold text-text-muted opacity-90 line-clamp-2">{addr.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => setIsAddressModalOpen(true)} className="p-5 border-2 border-dashed border-border/60 rounded-[2rem] hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-3 transition-all"><Plus size={20} strokeWidth={3} className="text-text-muted/40" /><span className="text-[10px] font-black text-text-muted lowercase">new address</span></div>
                </div>
              </div>
              <div className="bg-background-card rounded-[2.5rem] p-6 md:p-8 border border-border/40 shadow-sm">
                <h2 className="text-lg md:text-xl font-black text-text-primary tracking-tight mb-6 lowercase">your feast items</h2>
                <div className="space-y-6">
                  {cartItems.map((item) => {
                    const activeOffer = offers?.find(o => {
                      if (!o.isActive) return false;
                      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      if (o.isWeekendOnly && !['Saturday', 'Sunday'].includes(day)) return false;
                      if (o.specificDays?.length > 0 && !o.specificDays.includes(day)) return false;

                      const itemId = (item.menuItemId || item._id || '').toString();
                      const isItemMatch = o.applicableItems?.some(bundleItem => (bundleItem.menuItem?._id || bundleItem.menuItem || '').toString() === itemId);
                      const isCategoryMatch = o.applicableCategories?.some(id => (id._id || id || '').toString() === (item.category?._id || item.category || '').toString());
                      return isItemMatch || isCategoryMatch;
                    });
                    const bogoSize = parseInt(activeOffer?.offerValue) || 2;
                    const isTriggered = activeOffer && (() => {
                      if (activeOffer.offerType === 'bogo') return item.quantity >= 1;
                      if (activeOffer.offerType === 'combo') {
                        const validBundleItems = activeOffer.applicableItems?.filter(bi => bi.menuItem) || [];
                        if (validBundleItems.length === 0) return false;
                        return validBundleItems.every(bundleItem => {
                          const bId = (bundleItem.menuItem?._id || bundleItem.menuItem || '').toString().toLowerCase();
                          const bSize = (bundleItem.selectedSize || '').toString().toLowerCase();
                          return cartItems.some(ci => {
                            const cId = (ci.menuItemId || ci.menuItem?._id || ci._id || '').toString().toLowerCase();
                            const cSize = (ci.selectedSize || '').toString().toLowerCase();
                            return cId === bId && (bSize === '' || cSize === bSize) && ci.quantity >= (bundleItem.quantity || 1);
                          });
                        });
                      }
                      return item.quantity >= (activeOffer.minQuantity || 1);
                    })();

                    return (
                      <div key={`${item._id}-${item.selectedSize}`} className="group bg-background rounded-3xl p-2 md:p-3 border border-border/40 hover:border-primary/20 transition-all">
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-background-card rounded-2xl p-2 border border-border/40 shrink-0">
                            <img src={item.image || '/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                              <div>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                  <h3 className="text-base md:text-lg font-black text-text-primary truncate lowercase">{item.name}</h3>
                                  {item.selectedSize && (
                                    <span className="px-2 py-0.5 bg-background-muted text-[10px] font-black text-text-muted rounded-lg border border-border/10 tracking-widest shrink-0 lowercase">
                                      {item.selectedSize}
                                    </span>
                                  )}
                                </div>
                                {item.isCombo && item.comboItems?.length > 0 && (
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 justify-center md:justify-start opacity-60">
                                    {item.comboItems.map((ci, idx) => (
                                      <span key={idx} className="text-[9px] font-bold text-text-muted tracking-tight lowercase">
                                        • {ci.menuItem?.name?.toLowerCase() || ci.name?.toLowerCase() || 'item'}
                                      </span>
                                    ))}
                                  </div>
                                )}


                              </div>
                              <div className="flex flex-col items-center md:items-end">
                                {(() => {
                                  const variants = item.variants || item.sizes || [];
                                  const sizeData = variants.find(v => v.size === item.selectedSize);

                                  let basePrice = 0;
                                  let finalPrice = 0;

                                  if (item.isCombo) {
                                    // For combo menu items, basePrice is the sum of individual items, finalPrice is the combo's own price
                                    basePrice = item.comboItems?.reduce((sum, ci) => sum + (ci.price || 0), 0) || item.price || 0;
                                    finalPrice = item.price || 0;
                                  } else {
                                    basePrice = sizeData ? sizeData.price : (item.offerPrice || item.price || 0);
                                    finalPrice = (isTriggered && activeOffer.offerType === 'discount')
                                      ? Math.round(basePrice * (1 - activeOffer.offerValue / 100))
                                      : basePrice;
                                  }

                                  const hasOffer = basePrice > finalPrice;

                                  return (
                                    <>
                                      {hasOffer && (
                                        <span className="text-[10px] font-bold text-text-muted line-through opacity-60">
                                          ₹{Math.round(basePrice)}
                                        </span>
                                      )}
                                      <span className="text-xl font-black text-primary tracking-tighter">
                                        ₹{Math.round(finalPrice)}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                              <div className="flex items-center bg-background-card rounded-xl border border-border/40 p-0.5">
                                <button 
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)} 
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-black text-text-primary text-xs">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary transition-all active:scale-90"><Plus size={14} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item._id)} className="text-text-muted/40 hover:text-red-500 transition-colors p-1.5"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-background-card rounded-[2.5rem] p-8 border border-border/40">
                <div className="flex items-center gap-3 mb-6"><h3 className="text-lg font-black text-text-primary uppercase">Special Instructions</h3></div>
                <textarea value={additionalNote} onChange={(e) => setAdditionalNote(e.target.value)} placeholder="Any specific requests?" className="w-full bg-background border-2 border-border/40 rounded-3xl p-6 text-sm font-bold text-text-primary focus:border-primary/40 outline-none min-h-[120px]"></textarea>
              </div>
            </div>
            <div className="w-full lg:w-[400px] sticky top-32">
              <div className="bg-background-card rounded-[3.5rem] shadow-xl border border-border/40 p-8 md:p-10 space-y-8">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3"><ShoppingCart size={22} className="text-primary" /> Bill Summary</h2>
                <div className="space-y-5">
                  {(() => {
                    const originalTotal = cartItems.reduce((sum, item) => {
                      let basePrice = 0;
                      if (item.isCombo) {
                        basePrice = item.comboItems?.reduce((s, ci) => s + (ci.price || 0), 0) || item.price || 0;
                      } else {
                        const variants = item.variants || item.sizes || [];
                        basePrice = variants.find(v => v.size === item.selectedSize)?.price || item.offerPrice || item.price || 0;
                      }
                      return sum + (basePrice * item.quantity);
                    }, 0);
                    const totalSavings = Math.round(originalTotal - subtotal);

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-text-muted uppercase">Actual Price</span>
                          <span className="text-sm font-black text-text-primary">₹{Math.round(originalTotal)}</span>
                        </div>

                        <div className="flex justify-between items-center text-green-500">
                          <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Total Savings</span>
                          <span className="text-sm font-black">-₹{totalSavings > 0 ? totalSavings : 0}</span>
                        </div>

                        <div className="flex justify-between items-center bg-primary/5 -mx-4 px-4 py-2 rounded-xl">
                          <span className="text-[11px] font-black text-primary uppercase">Final Price (Items)</span>
                          <span className="text-sm font-black text-primary">₹{subtotal}</span>
                        </div>
                      </>
                    );
                  })()}

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-text-muted uppercase">Delivery Fee</span>
                      {calculatedDistance && (
                        <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tight flex items-center gap-1">
                          <MapPin size={8} /> {calculatedDistance} KM away
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-black ${deliveryFee === 0 ? 'text-green-500' : 'text-text-primary'} flex items-center gap-2`}>
                      {isCalculatingFee ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : (deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-text-muted uppercase">Platform Fee</span>
                    <span className="text-sm font-black text-text-primary">₹{platformFee}</span>
                  </div>

                  <div className="h-px bg-border/20 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-text-primary uppercase">Grand Total</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">₹{total}</span>
                  </div>
                </div>
                <button onClick={handleCheckout} disabled={loading} className="w-full bg-primary text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:bg-primary-dark disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-4">Proceed to Checkout <ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onSave={handleSaveAddress} user={user} />
      <AddressListModal isOpen={isAddressListOpen} onClose={() => setIsAddressListOpen(false)} addresses={savedAddresses} onSelect={handleSelectAddress} onAddAddress={() => setIsAddressModalOpen(true)} />
      <Footer />
    </div>
  );
};

export default CartPage;
