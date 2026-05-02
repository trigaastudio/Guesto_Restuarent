import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, User, Mail, Phone, MapPin, Plus, Trash2, Home, Briefcase, Users, CheckCircle2, Shield, Settings, LogOut, PenLine, Trash, ShieldCheck, Lock, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import AddressModal from '../../components/AddressModal/AddressModal';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useCart } from '../../context/CartContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const { cartItems } = useCart();

  useEffect(() => {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
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
        // Assume endpoint exists based on usual patterns
        await api.delete(`/api/users/address/${addressId}`);
        setAddresses(addresses.filter(a => a._id !== addressId));
        Swal.fire('Deleted!', 'Address has been removed.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete address.', 'error');
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
        Swal.fire({
          title: 'Primary Updated',
          text: 'Default delivery address has been changed.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update primary address', 'error');
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
        Swal.fire({
          title: isEditing ? 'Address Updated!' : 'Address Saved!',
          text: isEditing ? 'Your location details have been updated.' : 'Your new delivery location has been added.',
          icon: 'success',
          confirmButtonColor: '#f59e0b'
        });
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save address', 'error');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

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
        Swal.fire({
          title: 'Success!',
          text: 'Profile picture updated successfully.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans selection:bg-primary/10">
      <header className="relative bg-[#D10000] sticky top-0 z-40 transition-all duration-500 shadow-xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] pointer-events-none"></div>

        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-30 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Premium Identity Card */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group">
              {/* Abstract Backdrop Decor */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-8 group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-44 h-44 rounded-[4rem] bg-gradient-to-br from-primary/40 via-white to-primary/10 p-1.5 flex items-center justify-center shadow-[0_25px_60px_rgba(217,145,51,0.25)] group-hover/avatar:rotate-2 transition-all duration-700">
                    <div className="w-full h-full bg-white rounded-[3.5rem] flex items-center justify-center text-primary border-[6px] border-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden relative">
                      <img
                        src={user.avatar ? `http://localhost:5000${user.avatar}` : '/user-avatar.png'}
                        alt={user.name}
                        className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform duration-1000"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center bg-white text-primary text-6xl font-black italic">
                        {user.name?.[0]?.toUpperCase()}
                      </div>

                      {/* Professional Upload Overlay */}
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl transform translate-y-4 group-hover/avatar:translate-y-0 transition-transform duration-500">
                          <Camera className="text-white" size={20} strokeWidth={2.5} />
                        </div>
                        <span className="mt-2 text-[8px] font-black text-white uppercase tracking-[0.2em] transform translate-y-4 group-hover/avatar:translate-y-0 transition-all duration-500 delay-75">Update Photo</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-14 h-14 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-green-500 border-4 border-[#FAF9F6] animate-bounce-slow z-20">
                    <CheckCircle2 size={28} strokeWidth={3} />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                <h2 className="text-2xl font-black text-text-primary tracking-tight mb-1">{user.name}</h2>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">Member since Apr 2024</p>
                </div>

                <div className="w-full space-y-2">
                  <div className="group/item flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all duration-500">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5 opacity-50">Private Email</p>
                      <p className="text-[11px] font-black text-text-primary truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="group/item flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all duration-500">
                      <Phone size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5 opacity-50">Mobile Number</p>
                      <p className="text-[11px] font-black text-text-primary truncate">{user.phone || user.mobile || 'Link your mobile'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 w-full pt-6 border-t border-gray-100 space-y-3">
                  <button
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 hover:bg-[#D10000] text-text-primary hover:text-white rounded-2xl transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group/action shadow-sm border border-gray-100"
                  >
                    <Mail size={16} className="group-hover/action:scale-110 transition-transform" />
                    Update Email
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 hover:bg-[#D10000] text-text-primary hover:text-white rounded-2xl transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group/action shadow-sm border border-gray-100"
                  >
                    <Lock size={16} className="group-hover/action:scale-110 transition-transform" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Address Management */}
          <div className="lg:col-span-8 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
            <div className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] min-h-[600px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 flex items-center justify-between mb-16">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-1 bg-primary rounded-full"></span>
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Location Management</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Address Directory</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Manage your frequent delivery locations</p>
                </div>

                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="group relative w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all duration-500 shadow-[0_10px_30px_rgba(201,106,10,0.2)] hover:-translate-y-1 active:scale-95"
                >
                  <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2].map(n => (
                    <div key={n} className="h-56 bg-gray-50/50 rounded-[2.5rem] animate-pulse border border-gray-100"></div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-24 px-10 border border-dashed border-gray-200 rounded-[3rem] bg-gray-50/20">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-gray-200 mb-6 shadow-sm border border-gray-50">
                    <MapPin size={32} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-lg font-black text-text-primary mb-2 tracking-tight">No Saved Addresses</h4>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40 max-w-xs mx-auto mb-10 leading-relaxed">Your delivery directory is currently empty</p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {addresses.map((address, idx) => (
                    <div
                      key={address._id}
                      className="group/card bg-[#FAF9F6] hover:bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-primary/30 hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-700"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover/card:scale-110 duration-500 ${address.type === 'home' ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                          {address.type === 'home' ? <Home size={20} strokeWidth={2.5} /> : <Briefcase size={20} strokeWidth={2.5} />}
                        </div>
                        {address.isDefault && (
                          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shadow-sm">Primary</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-1 mb-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{address.type}</h4>
                          <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{address.phone || user.phone}</span>
                        </div>
                        <h5 className="text-base font-black text-text-primary tracking-tight group-hover/card:text-primary transition-colors duration-500">{address.name || user.name}</h5>
                        <p className="text-[11px] font-bold text-text-muted opacity-70 leading-relaxed line-clamp-2">{address.address}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-100/50 flex items-center gap-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 text-[8px] font-black uppercase tracking-widest transition-all group/btn shadow-sm"
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
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-widest transition-all group/btn shadow-sm"
                          title="Edit Address"
                        >
                          <PenLine size={12} className="group-hover/btn:scale-110 transition-transform" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest transition-all group/btn shadow-sm"
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
          </div>

        </div>
      </main>

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
      <Footer />
    </div>
  );
};

export default ProfilePage;
