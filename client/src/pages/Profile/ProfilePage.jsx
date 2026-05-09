import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, User, Mail, Phone, MapPin, Plus, Trash2, Home, Briefcase, Users, CheckCircle2, Shield, Settings, LogOut, PenLine, Trash, ShieldCheck, Lock, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import AddressModal from '../../components/AddressModal/AddressModal';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import SideNavbar from '../../components/SideNavbar/SideNavbar';
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal';
import { useCart } from '../../context/CartContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
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
        Swal.fire({
          title: 'Deleted!',
          text: 'Address has been removed.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500
        });
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
          showConfirmButton: false,
          timer: 1500
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
    <div className="min-h-screen bg-[#FAF9F6] font-sans selection:bg-primary/10 overflow-x-hidden">
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

      <main className="max-w-7xl mx-auto px-6 py-4 md:py-6 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Side Navbar */}
          <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-24 z-20 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
            <SideNavbar
              user={user}
              handleLogout={handleLogout}
              navigate={navigate}
              onAvatarClick={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              handleAvatarUpload={handleAvatarUpload}
              onChangePassword={() => setIsPasswordModalOpen(true)}
            />
          </div>

          {/* Right Column: Address Management */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-6 relative z-10">
            <div className="bg-white rounded-[3.5rem] p-6 md:p-10 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 md:mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-1 bg-primary rounded-full"></span>
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">Location management</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Address Directory</h3>
                  <p className="text-[10px] font-black text-text-muted tracking-widest opacity-40">Manage your frequent delivery locations</p>
                </div>

                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="group relative w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all duration-500 shadow-[0_8px_25px_rgba(201,106,10,0.15)] hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
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
                  <p className="text-[10px] font-bold text-text-muted tracking-widest opacity-40 max-w-xs mx-auto mb-10 leading-relaxed">Your delivery directory is currently empty</p>
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
                      className="group/card bg-[#FAF9F6] hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-700"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover/card:scale-110 duration-500 ${address.type === 'home' ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                          {address.type === 'home' ? <Home size={14} strokeWidth={2.5} /> : <Briefcase size={14} strokeWidth={2.5} />}
                        </div>
                        {address.isDefault && (
                          <span className="text-[7px] font-black tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 shadow-sm">Primary</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-0.5 mb-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-[6px] font-black text-primary tracking-widest uppercase">{address.type}</h4>
                          <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                          <span className="text-[6px] font-black text-text-muted tracking-widest">{address.phone || user.phone}</span>
                        </div>
                        <h5 className="text-xs font-black text-text-primary tracking-tight group-hover/card:text-primary transition-colors duration-500">{address.name || user.name}</h5>
                        <p className="text-[9px] font-bold text-text-muted opacity-70 leading-relaxed line-clamp-1">{address.address}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-100/50 flex items-center gap-1.5">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-[6px] font-black tracking-widest transition-all group/btn"
                            title="Set as Primary"
                          >
                            <ShieldCheck size={10} className="group-hover/btn:scale-110 transition-transform" />
                            Primary
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingAddress(address);
                            setIsAddressModalOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[6px] font-black tracking-widest transition-all group/btn"
                          title="Edit Address"
                        >
                          <PenLine size={10} className="group-hover/btn:scale-110 transition-transform" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[6px] font-black tracking-widest transition-all group/btn"
                          title="Delete Address"
                        >
                          <Trash size={10} className="group-hover/btn:scale-110 transition-transform" />
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
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user.email}
      />
      <Footer />
    </div>
  );
};

export default ProfilePage;
