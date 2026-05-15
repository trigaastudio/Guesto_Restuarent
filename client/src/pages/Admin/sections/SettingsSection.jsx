import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axiosInstance';
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
  ExternalLink,
  Clock,
  Calendar,
  Zap,
  QrCode,
  CreditCard,
  ToggleLeft as Toggle,
  Plus,
  X,
  Shield,
  Lock,
  KeyRound,
  ChevronLeft
} from 'lucide-react';
import { showToast, showAlert } from '../../../utils/sweetAlert';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import { useTheme } from '../../../context/ThemeContext';
import Loader from '../../../components/Loader/Loader';



const SettingsSection = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Image upload state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [currentLogoField, setCurrentLogoField] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [newZone, setNewZone] = useState({ name: '', fee: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [otpStep, setOtpStep] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeSecurityFlow, setActiveSecurityFlow] = useState('none'); // 'none', 'email', 'password'

  const getLoggedInUser = () => {
    const adminUser = JSON.parse(localStorage.getItem('admin_user'));

    // For Admin Dashboard, always use the dedicated admin_user key
    if (adminUser) return { ...adminUser, isSuperAdmin: adminUser.role === 'admin' };

    return null;
  };

  const loggedInUser = getLoggedInUser();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/settings');
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
      await api.patch('/api/settings', settings);
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
    // Allow freeform cropping (aspectRatio null) to preserve original logo shape/format
    setAspectRatio(null);
    document.getElementById('logo-upload-input').click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ''; // Reset input

    // Upload directly without cropping to avoid canvas security issues
    const formData = new FormData();
    formData.append('image', file, file.name);

    setIsUploading(true);
    try {
      const response = await api.post('/api/upload/image', formData);
      const imageUrl = response.data.url;

      setSettings((prev) => ({
        ...prev,
        [currentLogoField === 'kotQRCodeImage' ? 'printingSettings' : 'branding']: {
          ...(currentLogoField === 'kotQRCodeImage' ? prev.printingSettings : prev.branding),
          [currentLogoField === 'kotQRCodeImage' ? 'kotQRCodeImage' : currentLogoField]: imageUrl
        }
      }));
      showToast('success', 'Logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('error', 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    if (!securityData.currentPassword) {
      return showToast('error', 'Current password is required');
    }
    if (!securityData.newEmail && !securityData.newPassword) {
      return showToast('error', 'Please enter a new email or new password to change');
    }
    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      return showToast('error', 'New passwords do not match');
    }

    if (activeSecurityFlow === 'email' && !securityData.newEmail) {
      return showToast('error', 'New email is required');
    }
    if (activeSecurityFlow === 'password') {
      if (!securityData.newPassword) return showToast('error', 'New password is required');
      if (securityData.newPassword !== securityData.confirmPassword) {
        return showToast('error', 'New passwords do not match');
      }
    }

    setIsRequestingOTP(true);
    try {
      const logoUrl = isDarkMode ?
        (settings?.branding?.logoGold ? (settings.branding.logoGold.startsWith('http') ? settings.branding.logoGold : `${window.location.origin}${settings.branding.logoGold}`) : `${window.location.origin}/logo-golden.png`) :
        (settings?.branding?.logoDark ? (settings.branding.logoDark.startsWith('http') ? settings.branding.logoDark : `${window.location.origin}${settings.branding.logoDark}`) : `${window.location.origin}/logo-dark.png`);

      const response = await api.post('/api/staff/request-credential-change', {
        currentPassword: securityData.currentPassword,
        logoUrl: logoUrl
      });
      showToast('success', response.data.message);
      setOtpStep(true);
    } catch (error) {
      console.error('Error requesting OTP:', error);
      showToast('error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsRequestingOTP(false);
    }
  };

  const handleVerifyAndUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!securityData.otp) return showToast('error', 'Please enter the OTP');

    setIsVerifying(true);
    try {
      const payload = {
        staffId: loggedInUser.id,
        otp: securityData.otp,
        newEmail: activeSecurityFlow === 'email' ? securityData.newEmail : undefined,
        newPassword: activeSecurityFlow === 'password' ? securityData.newPassword : undefined
      };

      const response = await api.post('/api/staff/verify-credential-change', payload);
      showToast('success', response.data.message);
      setOtpStep(false);
      setActiveSecurityFlow('none');
      setSecurityData({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '', otp: '' });

      if (activeSecurityFlow === 'email' || activeSecurityFlow === 'password') {
        showToast('info', 'Security credentials updated. Please log in again.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showToast('error', error.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <Loader size="large" />
        <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading settings...</p>
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
          { id: 'financial', label: 'Financial & Print', icon: CreditCard },
          { id: 'security', label: 'Security', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id
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
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-black border border-white/10 space-y-4 relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #000000 0% 50%)', backgroundSize: '20px 20px' }}></div>
                  <span className="text-[10px] font-black uppercase text-white/50 absolute top-4 left-6 z-10">Gold Logo (Dark Mode)</span>
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden z-10">
                    {settings.branding.logoGold ? (
                      <img src={settings.branding.logoGold} alt="Gold Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon size={48} className="text-white/20" />
                    )}
                  </div>
                  <button
                    onClick={() => handleLogoUploadClick('logoGold')}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 z-10"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center px-4 font-medium italic">Transparent PNG with gold or white content recommended for dark mode.</p>
              </div>

              {/* Dark Logo */}
              <div className="space-y-4">
                <div className="flex flex-col items-center p-6 rounded-[2rem] bg-white border border-border-light space-y-4 relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%)', backgroundSize: '20px 20px' }}></div>
                  <span className="text-[10px] font-black uppercase text-black/40 absolute top-4 left-6 z-10">Dark Logo (Light Mode)</span>
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden z-10">
                    {settings.branding.logoDark ? (
                      <img src={settings.branding.logoDark} alt="Dark Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon size={48} className="text-black/10" />
                    )}
                  </div>
                  <button
                    onClick={() => handleLogoUploadClick('logoDark')}
                    className="w-full py-2.5 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 z-10"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center px-4 font-medium italic">Transparent PNG with black or colored content for light mode.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Holiday Mode Card */}
              <div className={`group p-8 rounded-[2.5rem] border transition-all duration-500 ${settings.operationalSettings?.isHolidayMode ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10' : 'bg-background-muted/20 border-border-light hover:border-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-[1.5rem] transition-all duration-500 ${settings.operationalSettings?.isHolidayMode ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20' : 'bg-background-muted text-text-muted'}`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className={`text-base font-black uppercase tracking-tight transition-colors ${settings.operationalSettings?.isHolidayMode ? 'text-red-500' : 'text-text-primary'}`}>Holiday Mode</h4>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.1em] mt-1">Suspend All Business</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      operationalSettings: { ...settings.operationalSettings, isHolidayMode: !settings.operationalSettings?.isHolidayMode }
                    })}
                    className={`w-14 h-7 rounded-full transition-all relative ${settings.operationalSettings?.isHolidayMode ? 'bg-red-500' : 'bg-background-muted-dark'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${settings.operationalSettings?.isHolidayMode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
                {settings.operationalSettings?.isHolidayMode && (
                  <div className="mt-6 p-4 bg-red-500/10 rounded-2xl border border-red-500/10 animate-in slide-in-from-top-4 duration-300">
                    <p className="text-[10px] font-black text-red-500 uppercase leading-relaxed text-center">Store is currently CLOSED for all orders.</p>
                  </div>
                )}
              </div>

              {/* Busy Mode Card */}
              <div className={`group p-8 rounded-[2.5rem] border transition-all duration-500 ${settings.operationalSettings?.isBusyMode ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-background-muted/20 border-border-light hover:border-amber-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-[1.5rem] transition-all duration-500 ${settings.operationalSettings?.isBusyMode ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/20' : 'bg-background-muted text-text-muted'}`}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className={`text-base font-black uppercase tracking-tight transition-colors ${settings.operationalSettings?.isBusyMode ? 'text-amber-500' : 'text-text-primary'}`}>Busy Mode</h4>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.1em] mt-1">Add Buffer Prep Time</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      operationalSettings: { ...settings.operationalSettings, isBusyMode: !settings.operationalSettings?.isBusyMode }
                    })}
                    className={`w-14 h-7 rounded-full transition-all relative ${settings.operationalSettings?.isBusyMode ? 'bg-amber-500' : 'bg-background-muted-dark'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${settings.operationalSettings?.isBusyMode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
                {settings.operationalSettings?.isBusyMode && (
                  <div className="mt-6 space-y-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between bg-background-muted/30 p-4 rounded-2xl border border-amber-500/10">
                      <label className="text-[11px] font-black text-amber-500 uppercase">Extra Minutes:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={settings.operationalSettings?.busyModeExtraTime || 15}
                          onChange={(e) => setSettings({
                            ...settings,
                            operationalSettings: { ...settings.operationalSettings, busyModeExtraTime: parseInt(e.target.value) }
                          })}
                          className="w-16 px-3 py-2 bg-white rounded-xl border-none outline-none font-black text-xs text-amber-600 text-center"
                        />
                        <span className="text-[10px] font-black text-amber-500 uppercase">Min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Platform Fee Card */}
              <div className="group p-8 rounded-[2.5rem] border bg-background-muted/20 border-border-light hover:border-primary/20 transition-all duration-500 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-5">
                    <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/5">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-text-primary uppercase tracking-tight">Platform Fee</h4>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.1em] mt-1">Per Order Charge</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-background-muted/30 p-4 rounded-2xl border border-border-light">
                    <label className="text-[11px] font-black text-text-secondary uppercase">Fee Amount:</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-primary uppercase">₹</span>
                      <input
                        type="number"
                        value={settings.operationalSettings?.platformFee || 0}
                        onChange={(e) => setSettings({
                          ...settings,
                          operationalSettings: { ...settings.operationalSettings, platformFee: parseFloat(e.target.value) }
                        })}
                        className="w-20 px-3 py-2 bg-white rounded-xl border-none outline-none font-black text-xs text-primary text-center shadow-inner"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-text-muted font-bold italic text-center uppercase tracking-tight opacity-40 leading-relaxed">
                    This fee will be automatically added to every customer's bill total.
                  </p>
                </div>
              </div>
            </div>

            {/* Unified Working Hours Card */}
            <div className="bg-background-muted/30 backdrop-blur-md rounded-[3rem] border border-white/5 p-8 md:p-12 space-y-10 shadow-2xl">
              <div className="flex items-center space-x-6">
                <div className="p-5 bg-primary/10 text-primary rounded-[2rem] shadow-lg shadow-primary/10 border border-primary/20">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-[0.05em]">Business Operations</h3>
                  <p className="text-[11px] text-text-muted font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Global Working Schedule</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Time Selection */}
                <div className="flex items-center space-x-8 bg-black/20 rounded-[2.5rem] p-8 border border-white/5 shadow-inner">
                  <div className="flex-1 space-y-3">
                    <label className="text-[11px] font-black text-primary uppercase tracking-[0.1em] ml-1">Opening</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={settings.operationalSettings?.businessHours?.open || '09:00'}
                        onChange={(e) => setSettings({
                          ...settings,
                          operationalSettings: {
                            ...settings.operationalSettings,
                            businessHours: { ...settings.operationalSettings.businessHours, open: e.target.value }
                          }
                        })}
                        className="w-full px-6 py-4 bg-background-muted/50 rounded-2xl border border-border-light outline-none font-black text-xl text-text-primary transition-all focus:border-primary/50 focus:bg-white focus:text-black appearance-none"
                      />
                    </div>
                  </div>
                  <div className="w-10 h-[2px] bg-white/10 mt-8 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <label className="text-[11px] font-black text-primary uppercase tracking-[0.1em] ml-1">Closing</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={settings.operationalSettings?.businessHours?.close || '22:00'}
                        onChange={(e) => setSettings({
                          ...settings,
                          operationalSettings: {
                            ...settings.operationalSettings,
                            businessHours: { ...settings.operationalSettings.businessHours, close: e.target.value }
                          }
                        })}
                        className="w-full px-6 py-4 bg-background-muted/50 rounded-2xl border border-border-light outline-none font-black text-xl text-text-primary transition-all focus:border-primary/50 focus:bg-white focus:text-black appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Closed Days Selection */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 ml-1">
                    <Calendar size={14} className="text-primary" />
                    <label className="text-[11px] font-black text-text-primary uppercase tracking-[0.1em]">Weekly Off-Days</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isClosed = settings.operationalSettings?.businessHours?.closedDays?.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            const currentClosed = settings.operationalSettings.businessHours.closedDays || [];
                            const newClosed = isClosed
                              ? currentClosed.filter(d => d !== day)
                              : [...currentClosed, day];
                            setSettings({
                              ...settings,
                              operationalSettings: {
                                ...settings.operationalSettings,
                                businessHours: { ...settings.operationalSettings.businessHours, closedDays: newClosed }
                              }
                            });
                          }}
                          className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border
                                 ${isClosed
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-background-muted/50 border-border-light text-text-muted hover:border-primary/50 hover:text-primary'}
                               `}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-text-muted font-bold italic mt-3 uppercase tracking-tight opacity-40">Toggled days will be marked as "Closed" on all platforms.</p>
                </div>
              </div>
            </div>

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
                      onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white rounded-2xl border border-border-light outline-none font-bold text-text-primary text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="Fee"
                        value={newZone.fee}
                        onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })}
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

        {activeSubTab === 'financial' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <h3 className="text-lg font-black text-text-primary flex items-center space-x-2">
                <QrCode className="text-primary" size={20} />
                <span>KOT & Delivery QR Settings</span>
              </h3>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className={`p-10 rounded-[3rem] border transition-all duration-500 ${settings.printingSettings?.showKOTQRCode ? 'bg-primary/5 border-primary/20 shadow-xl shadow-primary/5' : 'bg-background-muted/20 border-border-light'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-5">
                    <div className={`p-5 rounded-[1.5rem] transition-all duration-500 ${settings.printingSettings?.showKOTQRCode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background-muted text-text-muted'}`}>
                      <QrCode size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">KOT QR Code</h4>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Print payment/info on tickets</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      printingSettings: { ...settings.printingSettings, showKOTQRCode: !settings.printingSettings?.showKOTQRCode }
                    })}
                    className={`w-14 h-7 rounded-full transition-all relative ${settings.printingSettings?.showKOTQRCode ? 'bg-primary' : 'bg-background-muted-dark'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${settings.printingSettings?.showKOTQRCode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {settings.printingSettings?.showKOTQRCode && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Upload QR Code Image</label>
                        <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-lg">Static Image Mode</span>
                      </div>

                      <div
                        onClick={() => {
                          setCurrentLogoField('kotQRCodeImage');
                          setAspectRatio(1);
                          document.getElementById('logo-upload-input').click();
                        }}
                        className={`w-full h-56 bg-background-muted/30 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group
                               ${settings.printingSettings?.kotQRCodeImage ? 'border-primary/30 bg-primary/5 shadow-inner' : 'border-white/10 hover:border-primary/50 hover:bg-primary/5'}
                             `}
                      >
                        {settings.printingSettings?.kotQRCodeImage ? (
                          <div className="relative w-full h-full p-6 flex items-center justify-center">
                            <img src={settings.printingSettings.kotQRCodeImage} alt="KOT QR Code" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                              <div className="bg-white p-4 rounded-full shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-300">
                                <Upload size={24} className="text-primary" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-5 bg-background-muted/50 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                              <Upload size={28} className="text-text-muted group-hover:text-primary" />
                            </div>
                            <div className="text-center mt-5">
                              <span className="block text-xs font-black text-text-primary uppercase tracking-widest">Click to Select File</span>
                              <span className="text-[10px] font-bold text-text-muted mt-1.5 uppercase opacity-60">Supports PNG, JPG (Max 2MB)</span>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted font-bold italic text-center px-8 leading-relaxed opacity-50 uppercase tracking-tight">This image will be printed at the bottom of delivery KOTs. Ensure high contrast for thermal printers.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <h3 className="text-lg font-black text-text-primary flex items-center space-x-2">
                <Shield className="text-primary" size={20} />
                <span>Security & Profile</span>
              </h3>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {/* Profile Overview Card */}
              <div className="bg-background-card p-8 rounded-[2.5rem] border border-border-light shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />

                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary-light p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary text-3xl font-black">
                    {loggedInUser?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-1">
                  <h4 className="text-2xl font-black text-text-primary tracking-tight">{loggedInUser?.name}</h4>
                  <p className="text-sm font-bold text-text-secondary flex items-center justify-center md:justify-start space-x-2">
                    <Mail size={14} className="text-primary" />
                    <span>{loggedInUser?.email}</span>
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mt-2">
                    {loggedInUser?.isSuperAdmin ? 'Super Admin' : 'Administrator'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => { setActiveSecurityFlow('email'); setOtpStep(false); }}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest hover:bg-primary-light transition-all flex items-center justify-center space-x-2"
                  >
                    <Mail size={14} />
                    <span>Change Email</span>
                  </button>
                  <button
                    onClick={() => { setActiveSecurityFlow('password'); setOtpStep(false); }}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest hover:bg-primary-light transition-all flex items-center justify-center space-x-2"
                  >
                    <Lock size={14} />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>

              {/* Security Flows */}
              {activeSecurityFlow !== 'none' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {!otpStep ? (
                    <div className="bg-background-muted/30 p-10 rounded-[3rem] border border-border-light space-y-8 relative">
                      <button
                        onClick={() => setActiveSecurityFlow('none')}
                        className="absolute top-6 right-6 p-2 hover:bg-white rounded-xl text-text-muted transition-all"
                      >
                        <X size={20} />
                      </button>

                      <div className="flex items-center space-x-5">
                        <div className="p-5 bg-white text-primary rounded-[1.5rem] shadow-xl">
                          {activeSecurityFlow === 'email' ? <Mail size={24} /> : <Lock size={24} />}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">
                            {activeSecurityFlow === 'email' ? 'Update Email Address' : 'Change Security Password'}
                          </h4>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Verify your identity to proceed</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-text-secondary uppercase ml-1 tracking-widest">Current Password</label>
                          <div className="relative">
                            <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={securityData.currentPassword}
                              onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                              className="w-full pl-14 pr-5 py-4 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white focus:text-black focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all outline-none font-bold text-text-primary"
                              placeholder="Enter your current password"
                            />
                          </div>
                        </div>

                        {activeSecurityFlow === 'email' ? (
                          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-black text-text-secondary uppercase ml-1 tracking-widest">New Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                              <input
                                type="email"
                                autoComplete="off"
                                value={securityData.newEmail}
                                onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                                className="w-full pl-14 pr-5 py-4 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white focus:text-black focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all outline-none font-bold text-text-primary"
                                placeholder="e.g. new.admin@guesto.com"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-text-secondary uppercase ml-1 tracking-widest">New Password</label>
                              <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                  type="password"
                                  autoComplete="new-password"
                                  value={securityData.newPassword}
                                  onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                  className="w-full pl-14 pr-5 py-4 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white focus:text-black focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all outline-none font-bold text-text-primary"
                                  placeholder="Min. 6 characters"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-text-secondary uppercase ml-1 tracking-widest">Confirm New Password</label>
                              <div className="relative">
                                <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                  type="password"
                                  autoComplete="new-password"
                                  value={securityData.confirmPassword}
                                  onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                  className="w-full pl-14 pr-5 py-4 bg-background-muted/50 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white focus:text-black focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all outline-none font-bold text-text-primary"
                                  placeholder="Repeat new password"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleRequestOTP}
                          disabled={isRequestingOTP}
                          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-light transition-all flex items-center justify-center space-x-3 shadow-xl shadow-primary/20"
                        >
                          {isRequestingOTP ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          <span>Request OTP Verification</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-background-card/80 backdrop-blur-xl p-10 rounded-[3rem] border border-border-light space-y-8 animate-in zoom-in-95 duration-300 text-center relative shadow-2xl">
                      <button
                        onClick={() => setOtpStep(false)}
                        className="absolute top-6 left-6 p-2 hover:bg-primary/10 rounded-xl text-primary transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        <ChevronLeft size={14} />
                        <span>Back</span>
                      </button>

                      <div className="space-y-6">
                        <div className="flex flex-col items-center">
                          <img
                            src={isDarkMode ? (settings?.branding?.logoGold || "/logo-golden.png") : (settings?.branding?.logoDark || "/logo-dark.png")}
                            alt="GuestO Logo"
                            className="h-12 w-auto mb-6 opacity-90"
                          />
                          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                            <Shield size={32} />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">Security Verification</h4>
                          <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest leading-relaxed mt-2 px-6">
                            Please enter the 6-digit code sent to <span className="text-primary">{loggedInUser.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <input
                          type="text"
                          maxLength="6"
                          autoComplete="one-time-code"
                          value={securityData.otp}
                          onChange={(e) => setSecurityData({ ...securityData, otp: e.target.value })}
                          className="w-full max-w-[220px] text-center text-4xl font-black tracking-[0.4em] bg-background-muted/30 py-5 rounded-3xl border-2 border-primary/20 focus:border-primary focus:bg-white focus:text-primary outline-none transition-all shadow-xl text-primary"
                          placeholder="000000"
                          autoFocus
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleVerifyAndUpdate}
                          disabled={isVerifying}
                          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-light transition-all flex items-center justify-center space-x-3 shadow-lg shadow-primary/20"
                        >
                          {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                          <span>Verify & Complete</span>
                        </button>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] mt-6 opacity-60">
                          Didn't receive the code? <button className="text-primary hover:underline">Resend OTP</button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!activeSecurityFlow || activeSecurityFlow === 'none' ? (
                <div className="p-6 bg-status-off/5 border border-status-off/10 rounded-[2rem] flex items-start space-x-4">
                  <div className="p-3 bg-status-off/10 text-status-unavailable rounded-2xl">
                    <AlertCircle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-text-primary uppercase tracking-tight">Security Protocol</h5>
                    <p className="text-[11px] text-text-muted font-medium leading-relaxed italic">
                      Changing sensitive credentials requires multi-factor verification. All changes are logged and will require you to log back in to your account.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
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
