import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, User as UserIcon, Users, MapPin, Home, Briefcase, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { showAlert } from '../../utils/sweetAlert';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon asset paths broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const DEFAULT_LAT = 10.668194;
const DEFAULT_LNG = 76.025111;

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

  // Map state
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapInitCoords, setMapInitCoords] = useState(null); // null = use default
  const [mapGpsStatus, setMapGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'located' | 'error'
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Form state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState({});

  // Leaflet refs
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const lMap = useRef(null);
  const gpsWatchId = useRef(null);

  // ─── Reset on close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', phone: '', address: '', landmark: '', location: '', type: 'home' });
      setRecipientType('myself');
      setErrors({});
      setMapInitCoords(null);
      setMapGpsStatus('idle');
      setGpsErrorMsg('');
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
        setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
      } else {
        setFormData(prev => ({ ...prev, name: '', phone: '' }));
      }
    }
  }, [recipientType, user, isOpen, editData]);

  // ─── Body scroll lock ─────────────────────────────────────────────────────
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

  // ─── Leaflet map initialisation (runs when map opens) ────────────────────
  useEffect(() => {
    if (!isMapOpen) {
      if (lMap.current) {
        lMap.current.remove();
        lMap.current = null;
        markerRef.current = null;
      }
      return;
    }

    const initLat = mapInitCoords?.lat ?? DEFAULT_LAT;
    const initLng = mapInitCoords?.lng ?? DEFAULT_LNG;

    const initMap = () => {
      if (lMap.current || !mapRef.current) return;

      lMap.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([initLat, initLng], mapInitCoords ? 17 : 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(lMap.current);

      // Custom pulsing pin icon
      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="width:44px;height:44px;border-radius:50% 50% 50% 0;background:var(--color-primary,#e53935);transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.3);"></div>
          <div style="position:absolute;width:12px;height:12px;background:#fff;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-58%);"></div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      markerRef.current = L.marker([initLat, initLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(lMap.current);

      // Click on map → move pin
      lMap.current.on('click', (e) => {
        markerRef.current.setLatLng(e.latlng);
        lMap.current.panTo(e.latlng, { animate: true, duration: 0.3 });
      });

      // Show ripple effect on drag end
      markerRef.current.on('dragend', () => {
        lMap.current.panTo(markerRef.current.getLatLng(), { animate: true, duration: 0.3 });
      });
    };

    // Small delay so the modal DOM is fully painted
    const t = setTimeout(initMap, 120);
    return () => clearTimeout(t);
  }, [isMapOpen, mapInitCoords]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  // ─── Save map pin ─────────────────────────────────────────────────────────
  const handleSaveMapLocation = () => {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    if (!validateDistance(lat, lng)) {
      setIsMapOpen(false);
      return;
    }
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    setFormData(prev => ({ ...prev, location: `📍 Precise Location: ${mapsUrl}` }));
    if (errors.location) setErrors(prev => ({ ...prev, location: null }));
    setIsMapOpen(false);
    setMapGpsStatus('idle');
  };

  // ─── GPS → Map (Option 1 flow) ────────────────────────────────────────────
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert({
        icon: 'warning',
        title: 'Not Supported',
        html: `<p class="text-sm text-center">Your browser doesn't support location. Please use Chrome or Safari, or paste a Google Maps link manually.</p>`,
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsGettingLocation(true);
    setMapGpsStatus('locating');
    setGpsErrorMsg('');

    // Open the map immediately at default while GPS resolves
    setMapInitCoords(null);   // start at default, will pan when GPS arrives
    setIsMapOpen(true);

    let resolved = false;

    const onSuccess = (position) => {
      if (resolved) return;
      resolved = true;
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      setIsGettingLocation(false);
      setMapGpsStatus('located');

      // If map is already mounted, pan to GPS coords
      if (lMap.current && markerRef.current) {
        const latlng = L.latLng(lat, lng);
        markerRef.current.setLatLng(latlng);
        lMap.current.flyTo(latlng, 17, { animate: true, duration: 1.2 });
      } else {
        // Map not mounted yet — set init coords so it opens centred on GPS
        setMapInitCoords({ lat, lng });
      }
    };

    const onError = (error) => {
      if (resolved) return;
      resolved = true;
      setIsGettingLocation(false);
      setMapGpsStatus('error');

      let msg = 'Could not detect your location.';
      if (error.code === 1) {
        msg = 'Location permission denied. Drag the pin to your location manually.';
      } else if (error.code === 2) {
        msg = 'GPS is off on your device. Drag the pin to your location manually.';
      } else if (error.code === 3) {
        msg = 'Location timed out. Drag the pin to your location manually.';
      }
      setGpsErrorMsg(msg);
      // Map is already open — user can drag pin manually
    };

    // Try high accuracy first (GPS chip), generous timeout for mobile
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });

    // Fallback: also try low-accuracy after 5s in case high-accuracy is slow
    const fallbackTimer = setTimeout(() => {
      if (resolved) return;
      navigator.geolocation.getCurrentPosition(onSuccess, () => {}, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30000,
      });
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.address.trim()) newErrors.address = true;
    if (recipientType === 'others' && !formData.landmark.trim()) newErrors.landmark = true;

    if (!formData.location || !formData.location.trim()) {
      newErrors.location = 'Location is required — tap "Use My Location" or open the map to pin your spot.';
    } else {
      const locText = formData.location.toLowerCase();
      if (!locText.includes('google.com/maps') && !locText.includes('maps.app.goo.gl') && !locText.includes('maps.google.com') && !locText.includes('goo.gl/maps')) {
        newErrors.location = 'Please use "Use My Location" button or paste a valid Google Maps link.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSave = () => {
    if (validate()) onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-primary p-6 md:p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-xl font-black tracking-tight mb-1">Add Delivery Address</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Where should we drop the magic?</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

          {/* Recipient toggle */}
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

          {/* Name + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: null })); }}
                disabled={recipientType === 'myself'}
                className={`w-full px-5 py-3.5 bg-background-muted border ${errors.name ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 text-text-primary`}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); if (errors.phone) setErrors(prev => ({ ...prev, phone: null })); }}
                className={`w-full px-5 py-3.5 bg-background-muted border ${errors.phone ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary`}
                placeholder="Enter mobile number"
                maxLength={10}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Detailed Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => { setFormData({ ...formData, address: e.target.value }); if (errors.address) setErrors(prev => ({ ...prev, address: null })); }}
              className={`w-full px-5 py-3.5 bg-background-muted border ${errors.address ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none text-text-primary`}
              placeholder="Flat/House No., Building, Apartment"
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Landmark {recipientType === 'others' ? '(Required)' : '(Optional)'}</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => { setFormData({ ...formData, landmark: e.target.value }); if (errors.landmark) setErrors(prev => ({ ...prev, landmark: null })); }}
              className={`w-full px-5 py-3.5 bg-background-muted border ${errors.landmark ? 'border-primary' : 'border-border/40'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary`}
              placeholder="E.g. Near City Hospital, Beside Park"
            />
          </div>

          {/* ── Delivery Location (the key section) ── */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Delivery Location</label>

            {/* Location status card — shown when location is set */}
            {formData.location ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/8 border border-green-500/25 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-0.5">Location Pinned ✓</p>
                  <p className="text-[10px] font-bold text-text-muted truncate">{formData.location.replace('📍 Precise Location: ', '')}</p>
                </div>
                <button
                  onClick={() => { setFormData(prev => ({ ...prev, location: '' })); setIsMapOpen(true); setMapInitCoords(null); setMapGpsStatus('idle'); }}
                  className="text-[9px] font-black text-primary uppercase tracking-widest shrink-0 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              /* Primary CTA — Use My Location */
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] ${
                  isGettingLocation
                    ? 'border-primary/30 bg-primary/5 text-primary/60 cursor-wait'
                    : 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60'
                }`}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Detecting your location…</span>
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
            )}

            {/* Secondary — manual paste or open map manually */}
            {!formData.location && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            )}

            {!formData.location && (
              <div className="space-y-2">
                {/* Paste Maps link */}
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => { setFormData({ ...formData, location: e.target.value }); if (errors.location) setErrors(prev => ({ ...prev, location: null })); }}
                    className={`w-full pl-10 pr-4 py-3 bg-background-muted border ${errors.location ? 'border-primary' : 'border-border/40'} rounded-2xl text-[11px] font-bold text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
                    placeholder="Paste a Google Maps link…"
                  />
                </div>

                {/* Open map manually button */}
                <button
                  type="button"
                  onClick={() => { setIsMapOpen(true); setMapInitCoords(null); setMapGpsStatus('idle'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/40 text-[11px] font-black text-text-muted uppercase tracking-widest hover:bg-background-muted transition-all"
                >
                  <MapPin size={13} />
                  <span>Pin on Map Manually</span>
                </button>
              </div>
            )}

            {typeof errors.location === 'string' && (
              <p className="flex items-start gap-1.5 text-[10px] font-bold text-primary mt-1 ml-1 leading-snug">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Save As */}
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

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-border/40 bg-background-muted/50 pb-10 md:pb-8">
          <button
            onClick={handleFinalSave}
            className="w-full bg-primary-light text-white font-black py-4 rounded-2xl hover:bg-primary-dark transition-all shadow-[0_15px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Save Address &amp; Continue
          </button>
        </div>

        {/* ── Full-screen Leaflet map ── */}
        {isMapOpen && (
          <div className="fixed inset-0 z-[3000] flex flex-col bg-background-card animate-in fade-in duration-200">

            {/* Map header */}
            <div className="p-4 bg-primary text-white flex justify-between items-center shrink-0 safe-area-top">
              <div>
                <h3 className="font-black tracking-tight text-base">Pin Your Location</h3>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">
                  {mapGpsStatus === 'locating' ? '📡 Detecting GPS…' :
                    mapGpsStatus === 'located' ? '✅ GPS located — drag pin to fine-tune' :
                    mapGpsStatus === 'error' ? '⚠️ GPS unavailable — drag pin manually' :
                    'Drag or tap the map to move the pin'}
                </p>
              </div>
              <button onClick={() => { setIsMapOpen(false); setMapGpsStatus('idle'); setIsGettingLocation(false); }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* GPS error banner */}
            {mapGpsStatus === 'error' && gpsErrorMsg && (
              <div className="shrink-0 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <p className="text-[11px] font-bold text-amber-700 leading-snug">{gpsErrorMsg}</p>
              </div>
            )}

            {/* GPS locating overlay spinner */}
            {mapGpsStatus === 'locating' && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3100] bg-background-card/95 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-xl border border-border/40 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-primary" />
                <p className="text-xs font-black text-text-primary">Finding your exact location…</p>
              </div>
            )}

            {/* Map container */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="absolute inset-0 z-10" />

              {/* Instruction chip */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] bg-background-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border/40 pointer-events-none">
                <p className="text-[10px] font-black text-text-primary whitespace-nowrap">Drag the pin or tap to place it</p>
              </div>
            </div>

            {/* Confirm button */}
            <div className="p-5 bg-background-card border-t border-border/40 shrink-0 pb-8 md:pb-5">
              <button
                onClick={handleSaveMapLocation}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-sm active:scale-[0.98]"
              >
                ✓ Confirm This Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
