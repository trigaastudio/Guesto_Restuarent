import React, { useState, useEffect, useRef } from 'react';
import { X, User as UserIcon, Users, MapPin, Home, Briefcase } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { showAlert } from '../../utils/sweetAlert';

const AddressModal = ({ isOpen, onClose, onSave, user, editData }) => {
  const { settings } = useCart();
  const [recipientType, setRecipientType] = useState('myself'); 
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    location: '',
    type: 'home'
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const lMap = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        phone: '',
        address: '',
        landmark: '',
        location: '',
        type: 'home'
      });
      setRecipientType('myself');
      setErrors({});
      return;
    }

    if (editData) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        address: editData.address || '',
        landmark: editData.landmark || '',
        location: editData.location || '',
        type: editData.type || 'home',
        _id: editData._id
      });
      setRecipientType(editData.name === user?.name ? 'myself' : 'others');
    } else if (user) {
      if (recipientType === 'myself') {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.phone || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          name: '',
          phone: ''
        }));
      }
    }
  }, [recipientType, user, isOpen, editData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  
  useEffect(() => {
    if (isMapOpen && !lMap.current) {
      setTimeout(() => {
        if (!window.L) return;
        const initialLat = 10.668194;
        const initialLng = 76.025111;

        lMap.current = window.L.map(mapRef.current).setView([initialLat, initialLng], 15);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(lMap.current);

        markerRef.current = window.L.marker([initialLat, initialLng], {
          draggable: true
        }).addTo(lMap.current);

        lMap.current.on('click', function (e) {
          markerRef.current.setLatLng(e.latlng);
        });
      }, 100);
    }

    return () => {
      if (lMap.current) {
        lMap.current.remove();
        lMap.current = null;
      }
    };
  }, [isMapOpen]);

  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  const validateDistance = (lat, lng) => {
    const storeLat = settings?.restaurantDetails?.location?.lat;
    const storeLng = settings?.restaurantDetails?.location?.lng;
    const maxDist = settings?.deliverySettings?.maxDeliveryDistance || 12;
    
    if (storeLat && storeLng) {
      const distance = calculateDistance(storeLat, storeLng, lat, lng);
      if (distance > maxDist) {
        setErrors(prev => ({ 
          ...prev, 
          location: `Delivery Not Available: This location is ${distance.toFixed(1)} km away. We deliver within ${maxDist} km.` 
        }));
        return false;
      }
    }
    return true;
  };

  const handleSaveMapLocation = () => {
    if (markerRef.current) {
      const { lat, lng } = markerRef.current.getLatLng();
      
      if (!validateDistance(lat, lng)) {
        setIsMapOpen(false);
        return;
      }

      const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      setFormData({
        ...formData,
        location: `📍 Precise Location: ${mapsUrl}`
      });
      if (errors.location) setErrors(prev => ({ ...prev, location: null }));
      setIsMapOpen(false);
    }
  };

  const showLocationHelpModal = (title, message) => {
    showAlert({
      icon: 'warning',
      title: title || 'Location Access Disabled',
      html: `
        <div class="text-left space-y-3 text-xs leading-relaxed">
          <p class="font-bold text-text-primary">${message}</p>
          <div class="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-1 text-[11px]">
            <p class="font-black uppercase tracking-wider text-primary mb-1">How to enable Location:</p>
            <p>1. Tap the 🔒 <b>Lock / Settings</b> icon in your browser URL bar at top.</p>
            <p>2. Select <b>Permissions</b> or <b>Site Settings</b>.</p>
            <p>3. Set <b>Location</b> to <span class="text-green-600 font-bold">Allow</span>.</p>
            <p>4. Refresh the page and click "Current Location" again!</p>
          </div>
        </div>
      `,
      confirmButtonText: 'Understood'
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showLocationHelpModal(
        'Not Supported',
        'Geolocation is not supported by your current browser. Please try using Google Chrome or Safari.'
      );
      return;
    }

    const getLocation = () => {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          const mapsUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          
          setFormData(prev => ({
            ...prev,
            location: `📍 Precise Location: ${mapsUrl}`
          }));

          if (!validateDistance(latitude, longitude)) {
            setIsGettingLocation(false);
            return;
          }

          if (errors.location) setErrors(prev => ({ ...prev, location: null }));
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location", error);
          let errorMessage = "Unable to retrieve your location.";
          if (error.code === 1) {
            errorMessage = "Location permission was denied in your browser settings.";
          } else if (error.code === 2) {
            errorMessage = "Your device's GPS / Location service is turned off. Please turn on Location in your device settings.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please check your signal and try again.";
          }
          showLocationHelpModal('Enable Location', errorMessage);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };

    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
          if (result.state === 'denied') {
            showLocationHelpModal(
              'Location Access Denied',
              'Location access is currently blocked for this website in your browser.'
            );
          } else {
            getLocation();
          }
        }).catch(() => {
          getLocation();
        });
      } else {
        getLocation();
      }
    } catch (e) {
      getLocation();
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.address.trim()) newErrors.address = true;
    if (recipientType === 'others' && !formData.landmark.trim()) newErrors.landmark = true;
    
    if (!formData.location || !formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else {
      const locText = formData.location.toLowerCase();
      if (!locText.includes('google.com/maps') && !locText.includes('maps.app.goo.gl') && !locText.includes('maps.google.com') && !locText.includes('goo.gl/maps')) {
        newErrors.location = 'Please paste a valid Google Maps link or click Current Location';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">

        {}
        <div className="bg-primary p-6 md:p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-xl font-black tracking-tight mb-1">Add Delivery Address</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Where should we drop the magic?</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {}
          <div className="flex bg-background-muted p-1.5 rounded-2xl border border-border/40">
            <button
              onClick={() => setRecipientType('myself')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${recipientType === 'myself' ? 'bg-background-card shadow-md text-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <UserIcon size={14} /> Myself
            </button>
            <button
              onClick={() => setRecipientType('others')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${recipientType === 'others' ? 'bg-background-card shadow-md text-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Users size={14} /> Others
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                disabled={recipientType === 'myself'}
                className={`w-full px-5 py-3.5 bg-background-muted border ${errors.name ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 text-text-primary`}
                placeholder="Enter name"
              />
            </div>
            {}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                }}
                className={`w-full px-5 py-3.5 bg-background-muted border ${errors.phone ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary`}
                placeholder="Enter mobile number"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Detailed Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (errors.address) setErrors(prev => ({ ...prev, address: null }));
              }}
              className={`w-full px-5 py-3.5 bg-background-muted border ${errors.address ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none text-text-primary`}
              placeholder="Flat/House No., Building, Apartment"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Landmark {recipientType === 'others' ? '(Required)' : '(Optional)'}</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => {
                setFormData({ ...formData, landmark: e.target.value });
                if (errors.landmark) setErrors(prev => ({ ...prev, landmark: null }));
              }}
              className={`w-full px-5 py-3.5 bg-background-muted border ${errors.landmark ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary`}
              placeholder="E.g. Near City Hospital, Beside Park"
            />
          </div>

          {}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1 pr-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Delivery Location</label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="text-[10px] font-black text-primary hover:text-primary-dark transition-colors flex items-center gap-1 uppercase tracking-wider"
              >
                {isGettingLocation ? (
                  <span className="flex items-center gap-1 opacity-70">
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Locating...
                  </span>
                ) : (
                  <>
                    <MapPin size={12} /> Current Location
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <MapPin size={16} className={`absolute left-5 top-1/2 -translate-y-1/2 ${formData.location ? 'text-green-500' : 'text-gray-300'}`} />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                }}
                className={`w-full pl-12 pr-5 py-3.5 bg-background-muted/50 border ${errors.location ? 'border-primary' : 'border-border/40'} rounded-2xl text-[10px] font-bold text-text-muted focus:outline-none transition-all`}
                placeholder="Paste the Google Maps link or click on the current location link"
              />
            </div>
            {typeof errors.location === 'string' ? (
              <p className="text-[10px] font-bold text-primary mt-1.5 ml-1 leading-snug">{errors.location}</p>
            ) : (
              <p className="text-[8px] font-bold text-text-muted mt-1 ml-1 italic opacity-80">
                Tip: Click "Current location" to locate, or paste a Google Maps link directly here if you have one.
              </p>
            )}
          </div>

          {}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Save As</label>
            <div className="flex gap-3">
              {[
                { id: 'home', label: 'Home', icon: <Home size={14} /> },
                { id: 'office', label: 'Office', icon: <Briefcase size={14} /> }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${formData.type === type.id ? 'bg-primary/5 border-primary text-primary' : 'bg-background-muted border-border/40 text-text-muted'}`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="p-6 md:p-8 border-t border-border/40 bg-background-muted/50 pb-10 md:pb-8">
          <button
            onClick={handleFinalSave}
            className="w-full bg-primary-light text-white font-black py-4 rounded-2xl hover:bg-primary-dark transition-all shadow-[0_15px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Save Address & Continue
          </button>
        </div>

        {}
        {isMapOpen && (
          <div className="fixed inset-0 z-[3000] flex flex-col bg-background-card">
            <div className="p-4 bg-primary-light text-white flex justify-between items-center">
              <div>
                <h3 className="font-black tracking-tight">Pick Delivery Location</h3>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Move the pin to your exact spot</p>
              </div>
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-white/20 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative">
              <div ref={mapRef} className="absolute inset-0 z-10" />
              <div className="absolute top-4 left-4 z-[20] bg-background-card/90 backdrop-blur p-3 rounded-xl shadow-lg border border-border/40 max-w-[200px]">
                <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1">Tip</p>
                <p className="text-[10px] font-bold text-text-secondary">You can drag the red marker or click anywhere on the map to set the pin.</p>
              </div>
            </div>
            <div className="p-6 bg-background-card border-t border-border/40">
              <button
                onClick={handleSaveMapLocation}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-primary-dark transition-all shadow-xl uppercase tracking-widest text-sm"
              >
                Confirm Location & Save Pin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
