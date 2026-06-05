import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, User, Mail, Phone, MapPin, Plus, Trash2, Home, Briefcase, Users, CheckCircle2, Shield, Settings, LogOut, PenLine, Trash, ShieldCheck, Lock, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import { showToast } from '../../utils/sweetAlert';
import { logoutToLanding } from '../../utils/auth';
import AddressModal from '../../components/AddressModal/AddressModal';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import SideNavbar from '../../components/SideNavbar/SideNavbar';
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal';
import ChangeEmailModal from '../../components/ChangeEmailModal/ChangeEmailModal';
import ImageCropperModal from '../../components/ImageCropper/ImageCropperModal';
import { useCart } from '../../context/CartContext';
import Loader from '../../components/Loader/Loader';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  
  const [activeTab, setActiveTab] = useState('addresses');
  
  
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const { cartItems } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUserData();

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
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, addressesRes] = await Promise.all([
        api.get('/api/users/profile'),
        api.get('/api/users/addresses')
      ]);

      if (profileRes.data.success) {
        setUser(profileRes.data.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data.data));
      }

      if (addressesRes.data.success) {
        setAddresses(addressesRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutToLanding(navigate);
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: 'Delete Address?',
      text: "Are you sure you want to remove this address?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/users/address/${addressId}`);
        setAddresses(addresses.filter(a => a._id !== addressId));
        showToast('success', 'Address deleted successfully');
      } catch (error) {
        showToast('error', 'Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await api.put(`/api/users/address/${addressId}/default`);
      if (response.data.success) {
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        })));
        showToast('success', 'Primary Address Updated');
      }
    } catch (error) {
      showToast('error', 'Failed to update primary address');
    }
  };

  const handleSaveAddress = async (formData) => {
    try {
      const isEditing = !!formData._id;
      const url = isEditing ? `/api/users/address/${formData._id}` : '/api/users/address';
      const method = isEditing ? 'put' : 'post';

      const response = await api[method](url, formData);
      if (response.data.success) {
        setAddresses(response.data.data);
        setIsAddressModalOpen(false);
        setEditingAddress(null);
        showToast('success', isEditing ? 'Address Updated Successfully' : 'Address Saved Successfully');
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const response = await api.put('/api/users/profile', profileForm);
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('storage'));
        showToast('success', 'Profile Updated Successfully');
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    
    
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    setIsCropperOpen(false);
    const formData = new FormData();
    formData.append('avatar', croppedFile);

    try {
      setLoading(true);
      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('storage'));
        showToast('success', 'Profile picture updated successfully');
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setLoading(false);
      setImageToCrop(null);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 overflow-x-hidden">
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
        <div className="absolute top-0 left-0 w-full h-[120px] bg-primary z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>
        
        <main className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 relative z-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {}
            <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-24 z-20 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
              <SideNavbar
                user={user}
                handleLogout={handleLogout}
                navigate={navigate}
                onAvatarClick={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                handleAvatarUpload={handleAvatarUpload}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {}
            <div className="lg:col-span-9 xl:col-span-9 space-y-6 relative z-10">
              
              {activeTab === 'addresses' && (
                <div className="bg-background-card rounded-[3.5rem] p-6 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col relative overflow-hidden animate-in fade-in duration-500">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 md:mb-12">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-1 bg-primary rounded-full"></span>
                        <p className="text-[11px] font-black text-primary tracking-widest uppercase">Location management</p>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Address Directory</h3>
                      <p className="text-xs font-black text-text-muted tracking-widest opacity-80">Manage your frequent delivery locations</p>
                    </div>

                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="group relative w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all duration-500 shadow-[0_8px_25px_rgba(185,28,28,0.15)] hover:-translate-y-0.5 active:scale-95"
                    >
                      <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 w-full">
                      <Loader size="medium" />
                      <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">
                        Loading your directory...
                      </p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-24 px-10 border border-dashed border-border/40 rounded-[3rem] bg-background-muted/20">
                      <div className="w-20 h-20 bg-background-card rounded-[2rem] flex items-center justify-center text-text-muted/30 mb-6 shadow-sm border border-border/40">
                        <MapPin size={32} strokeWidth={1.5} />
                      </div>
                      <h4 className="text-lg font-black text-text-primary mb-2 tracking-tight">No Saved Addresses</h4>
                      <p className="text-xs font-bold text-text-muted tracking-widest opacity-80 max-w-xs mx-auto mb-10 leading-relaxed">Your delivery directory is currently empty</p>
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest transition-all duration-500"
                      >
                        Add your first address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                      {addresses.map((address, idx) => (
                        <div
                          key={address._id}
                          className="group/card bg-background hover:bg-background-card p-3 rounded-2xl border border-border/40 hover:border-primary/30 hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-700"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover/card:scale-110 duration-500 ${address.type === 'home' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                              {address.type === 'home' ? <Home size={14} strokeWidth={2.5} /> : <Briefcase size={14} strokeWidth={2.5} />}
                            </div>
                            {address.isDefault && (
                              <span className="text-[10px] font-black tracking-widest text-green-600 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 shadow-sm">Primary</span>
                            )}
                          </div>

                          <div className="flex-1 space-y-0.5 mb-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className="text-[10px] font-black text-primary tracking-widest uppercase">{address.type}</h4>
                              <span className="w-1.5 h-1.5 rounded-full bg-border/40"></span>
                              <span className="text-[10px] font-black text-text-muted tracking-widest">{address.phone || user.phone}</span>
                            </div>
                            <h5 className="text-xs font-black text-text-primary tracking-tight group-hover/card:text-primary transition-colors duration-500">{address.name || user.name}</h5>
                            <p className="text-xs font-bold text-text-muted opacity-90 leading-relaxed line-clamp-1">{address.address}</p>
                          </div>

                          <div className="pt-3 border-t border-border/40 flex items-center gap-1.5 mt-auto">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(address._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 text-[10px] font-black tracking-widest transition-all group/btn"
                                title="Set as Primary"
                              >
                                <ShieldCheck size={12} className="group-hover/btn:scale-110 transition-transform" />
                                Primary
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingAddress(address);
                                setIsAddressModalOpen(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-[10px] font-black tracking-widest transition-all group/btn"
                              title="Edit Address"
                            >
                              <PenLine size={12} className="group-hover/btn:scale-110 transition-transform" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[10px] font-black tracking-widest transition-all group/btn"
                              title="Delete Address"
                            >
                              <Trash size={12} className="group-hover/btn:scale-110 transition-transform" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-background-card rounded-[3.5rem] p-6 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col relative overflow-hidden animate-in fade-in duration-500">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 md:mb-12">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-1 bg-primary rounded-full"></span>
                        <p className="text-[11px] font-black text-primary tracking-widest uppercase">Personal Details</p>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Edit Profile</h3>
                      <p className="text-xs font-black text-text-muted tracking-widest opacity-80">Keep your contact information up to date</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10 max-w-xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
                          placeholder="Enter your phone number"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-500 shadow-[0_8px_25px_rgba(185,28,28,0.15)] active:scale-95 disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-background-card rounded-[3.5rem] p-6 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col relative overflow-hidden animate-in fade-in duration-500">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 md:mb-12">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-1 bg-primary rounded-full"></span>
                        <p className="text-[11px] font-black text-primary tracking-widest uppercase">Security Settings</p>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Account Security</h3>
                      <p className="text-xs font-black text-text-muted tracking-widest opacity-80">Update your credentials and account password</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                    {}
                    <div className="bg-background/40 border border-border/40 p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Mail size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-text-primary">Email Address</h4>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Current: {user.email}</p>
                          </div>
                        </div>
                        
                        <p className="text-xs font-bold text-text-muted leading-relaxed mb-6">
                          Change your login email address. A 6-digit verification code will be sent to the new email address to verify it.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white py-3.5 rounded-xl font-black text-[11px] tracking-widest uppercase transition-all duration-500 text-center"
                      >
                        Change Email
                      </button>
                    </div>

                    {}
                    <div className="bg-background/40 border border-border/40 p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Lock size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-text-primary">Account Password</h4>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                              {user.hasPassword ? 'Password is configured' : 'Google Auth (No password set)'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-text-muted leading-relaxed mb-6">
                          {user.hasPassword 
                            ? 'Change your current password. A verification code will be sent to your email.' 
                            : 'Set up an account password. A verification code will be sent to your email.'}
                        </p>
                      </div>

                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white py-3.5 rounded-xl font-black text-[11px] tracking-widest uppercase transition-all duration-500 text-center"
                      >
                        {user.hasPassword ? 'Change Password' : 'Setup Password'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        user={user}
        editData={editingAddress}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={user}
      />
      <ChangeEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        user={user}
      />
      <ImageCropperModal
        isOpen={isCropperOpen}
        image={imageToCrop}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setIsCropperOpen(false);
          setImageToCrop(null);
        }}
      />
      <Footer />
    </div>
  );
};

export default ProfilePage;
