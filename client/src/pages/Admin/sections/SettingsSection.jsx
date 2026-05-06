import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Store, 
  Image as ImageIcon, 
  MapPin, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  Globe,
  Phone,
  Mail,
  Type,
  Truck,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { showToast, showAlert } from '../../../utils/sweetAlert';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

const SettingsSection = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('profile');

  // Image upload state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [currentLogoField, setCurrentLogoField] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [newZone, setNewZone] = useState({ name: '', fee: '' });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await axios.patch(`${API_BASE_URL}/settings`, settings);
      showToast('success', 'Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('error', 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUploadClick = (field) => {
    setCurrentLogoField(field);
    // Set aspect ratio based on logo type
    if (field === 'logoMonochrome') {
      setAspectRatio(4 / 1); // Wide for receipts
    } else {
      setAspectRatio(3 / 1); // Standard for dashboard
    }
    document.getElementById('logo-upload-input').click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    const formData = new FormData();
    formData.append('image', croppedFile);

    setIsUploading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/image`, formData);
      const imageUrl = response.data.url;
      
      setSettings({
        ...settings,
        branding: {
          ...settings.branding,
          [currentLogoField]: imageUrl
        }
      });
      showToast('success', 'Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('error', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-text-secondary font-bold animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Settings</h2>
          <p className="text-text-secondary text-sm font-medium">Configure your restaurant's identity and operations</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={isSaving}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 bg-background-card p-1.5 rounded-2xl border border-border-light w-fit">
        {[
          { id: 'profile', label: 'Store Profile', icon: Store },
          { id: 'branding', label: 'Branding', icon: ImageIcon },
          { id: 'operational', label: 'Operations', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-background-card rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden p-8">
        {activeSubTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-text-primary flex items-center space-x-2">
                  <Store className="text-primary" size={20} />
                  <span>Restaurant Details</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase ml-1">Restaurant Name</label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        value={settings.restaurantDetails.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          restaurantDetails: { ...settings.restaurantDetails, name: e.target.value }
                        })}
                        className="w-full pl-12 pr-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-bold text-text-primary"
                        placeholder="e.g. Guesto Restaurant"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase ml-1">Tagline</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        value={settings.restaurantDetails.tagline}
                        onChange={(e) => setSettings({
                          ...settings,
                          restaurantDetails: { ...settings.restaurantDetails, tagline: e.target.value }
                        })}
                        className="w-full pl-12 pr-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-medium text-text-primary"
                        placeholder="e.g. Taste of Tradition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase ml-1">Contact Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                          type="text"
                          value={settings.restaurantDetails.contactNumber}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurantDetails: { ...settings.restaurantDetails, contactNumber: e.target.value }
                          })}
                          className="w-full pl-12 pr-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-bold text-text-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase ml-1">Business Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                          type="email"
                          value={settings.restaurantDetails.email}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurantDetails: { ...settings.restaurantDetails, email: e.target.value }
                          })}
                          className="w-full pl-12 pr-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-bold text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-black text-text-primary flex items-center space-x-2">
                  <MapPin className="text-primary" size={20} />
                  <span>Location & Address</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase ml-1">Full Address (For Bills)</label>
                    <textarea
                      value={settings.restaurantDetails.address}
                      onChange={(e) => setSettings({
                        ...settings,
                        restaurantDetails: { ...settings.restaurantDetails, address: e.target.value }
                      })}
                      rows={3}
                      className="w-full p-4 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-medium resize-none text-text-primary"
                      placeholder="Enter full physical address..."
                    />
                  </div>

                  <div className="p-6 bg-background-muted/30 rounded-[2.5rem] border border-border-light space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Store GPS Location (For Delivery Calculation)</p>
                    
                    <div className="space-y-1.5">
                      <div className="relative">
                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                          type="text"
                          id="settings-location-link"
                          placeholder="Paste Restaurant Maps Link (Full or Short URL)"
                          onChange={async (e) => {
                            let url = e.target.value;
                            if (!url) return;

                            const coordRegex = /([0-9.-]+),([0-9.-]+)/;

                            // If it's a short link or no coords found, expand it first
                            if (!url.match(coordRegex) || url.includes('maps.app.goo.gl') || url.includes('share.google')) {
                              try {
                                setIsResolving(true);
                                showToast('info', 'Expanding link...');
                                const res = await axios.post(`${API_BASE_URL}/utils/expand-url`, { url });
                                url = res.data.expandedUrl;
                              } catch (err) {
                                console.error('Failed to expand URL:', err);
                              } finally {
                                setIsResolving(false);
                              }
                            }

                            const match = url.match(coordRegex);
                            if (match) {
                              const lat = parseFloat(match[1]);
                              const lng = parseFloat(match[2]);
                              if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                                setSettings({
                                  ...settings,
                                  restaurantDetails: { 
                                    ...settings.restaurantDetails, 
                                    location: { lat, lng } 
                                  }
                                });
                                showToast('success', 'GPS Coordinates Extracted!');
                                return;
                              }
                            }
                            showToast('warning', 'No coordinates found. Try a different link.');
                          }}
                          className="w-full pl-12 pr-12 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-bold text-text-primary text-xs"
                        />
                        <button 
                          onClick={() => {
                            const val = document.getElementById('settings-location-link')?.value;
                            if (val) {
                              const event = { target: { value: val } };
                              // We can't easily trigger the async onChange from here, 
                              // but since it's already in the onChange, we could just copy-paste the logic 
                              // or just tell the user it auto-syncs.
                              // For simplicity, I'll just add the spinner to the input area.
                            }
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"
                        >
                          {isResolving && <Loader2 size={18} className="animate-spin" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase ml-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={settings.restaurantDetails.location?.lat || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurantDetails: { 
                              ...settings.restaurantDetails, 
                              location: { ...settings.restaurantDetails.location, lat: parseFloat(e.target.value) } 
                            }
                          })}
                          className="w-full px-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-black text-text-primary text-xs"
                          placeholder="0.0000"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase ml-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={settings.restaurantDetails.location?.lng || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurantDetails: { 
                              ...settings.restaurantDetails, 
                              location: { ...settings.restaurantDetails.location, lng: parseFloat(e.target.value) } 
                            }
                          })}
                          className="w-full px-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white focus:text-black transition-all outline-none font-black text-text-primary text-xs"
                          placeholder="0.0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'branding' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-black text-text-primary flex items-center space-x-2 border-b border-border-light pb-4">
              <ImageIcon className="text-primary" size={20} />
              <span>Logo & Visual Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Gold Logo */}
              <div className="space-y-4">
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-black border border-white/10 space-y-4 relative group">
                  <span className="text-[10px] font-black uppercase text-white/50 absolute top-4 left-6">Gold Logo (Dark Mode)</span>
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden">
                    {settings.branding.logoGold ? (
                      <img src={settings.branding.logoGold} alt="Gold Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon size={48} className="text-white/20" />
                    )}
                  </div>
                  <button 
                    onClick={() => handleLogoUploadClick('logoGold')}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center px-4 font-medium italic">Used for the Admin Dashboard and Kitchen Panel sidebar.</p>
              </div>

              {/* Dark Logo */}
              <div className="space-y-4">
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-white border border-border-light space-y-4 relative group">
                  <span className="text-[10px] font-black uppercase text-text-muted absolute top-4 left-6">Dark Logo (Light Mode)</span>
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden">
                    {settings.branding.logoDark ? (
                      <img src={settings.branding.logoDark} alt="Dark Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon size={48} className="text-text-muted/20" />
                    )}
                  </div>
                  <button 
                    onClick={() => handleLogoUploadClick('logoDark')}
                    className="w-full py-2.5 bg-background-muted hover:bg-background-muted-dark text-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center px-4 font-medium italic">Used for Light Mode and customer-facing interfaces.</p>
              </div>

              {/* Monochrome Logo */}
              <div className="space-y-4">
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-gray-50 border border-dashed border-gray-300 space-y-4 relative group">
                  <span className="text-[10px] font-black uppercase text-gray-500 absolute top-4 left-6">Monochrome (Printing)</span>
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden grayscale contrast-125">
                    {settings.branding.logoMonochrome ? (
                      <img src={settings.branding.logoMonochrome} alt="Monochrome Logo" className="max-w-full max-h-full object-contain grayscale" />
                    ) : (
                      <ImageIcon size={48} className="text-gray-300" />
                    )}
                  </div>
                  <button 
                    onClick={() => handleLogoUploadClick('logoMonochrome')}
                    className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center px-4 font-medium italic">Optimized for thermal printers. Use solid black on transparent/white.</p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'operational' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between border-b border-border-light pb-4">
                <h3 className="text-lg font-black text-text-primary flex items-center space-x-2">
                  <Truck className="text-primary" size={20} />
                  <span>Delivery Pricing Rules</span>
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Pricing Method</label>
                  <select 
                    value={settings.deliverySettings?.pricingType || 'distance'}
                    onChange={(e) => setSettings({
                      ...settings,
                      deliverySettings: { ...settings.deliverySettings, pricingType: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 outline-none font-bold text-text-primary text-sm"
                  >
                    <option value="distance">Distance Based (KM)</option>
                    <option value="zone">Area/Zone Based</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Free Distance Limit</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.deliverySettings?.freeDistanceLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        deliverySettings: { ...settings.deliverySettings, freeDistanceLimit: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 outline-none font-bold text-text-primary text-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase">KM</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Rate Per Extra KM</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                    <input
                      type="number"
                      value={settings.deliverySettings?.chargePerExtraKm}
                      onChange={(e) => setSettings({
                        ...settings,
                        deliverySettings: { ...settings.deliverySettings, chargePerExtraKm: parseFloat(e.target.value) }
                      })}
                      className="w-full pl-8 pr-4 py-3 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/30 outline-none font-bold text-text-primary text-sm"
                    />
                  </div>
                </div>
             </div>

             {settings.deliverySettings?.pricingType === 'zone' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest">Add Delivery Area</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Area Name"
                        value={newZone.name}
                        onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white rounded-2xl border border-border-light outline-none font-bold text-text-primary text-sm"
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="Fee"
                          value={newZone.fee}
                          onChange={(e) => setNewZone({...newZone, fee: e.target.value})}
                          className="w-full pl-8 pr-4 py-3 bg-white rounded-2xl border border-border-light outline-none font-bold text-text-primary text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newZone.name || newZone.fee === '') return;
                          const zones = settings.deliverySettings?.zones || [];
                          setSettings({
                            ...settings,
                            deliverySettings: {
                              ...settings.deliverySettings,
                              zones: [...zones, { name: newZone.name, fee: parseFloat(newZone.fee) }]
                            }
                          });
                          setNewZone({ name: '', fee: '' });
                        }}
                        className="bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-light transition-all"
                      >
                        Add Zone
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(settings.deliverySettings?.zones || []).map((zone, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-background-muted/30 rounded-2xl border border-border-light">
                        <div>
                          <p className="text-sm font-black text-text-primary">{zone.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase">Charge: ₹{zone.fee}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newZones = settings.deliverySettings.zones.filter((_, i) => i !== idx);
                            setSettings({
                              ...settings,
                              deliverySettings: { ...settings.deliverySettings, zones: newZones }
                            });
                          }}
                          className="p-2 hover:bg-status-off/10 text-text-muted hover:text-status-unavailable transition-all rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        id="logo-upload-input"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspect={aspectRatio}
        />
      )}
    </div>
  );
};

export default SettingsSection;
