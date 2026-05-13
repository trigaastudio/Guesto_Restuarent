import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ShoppingBag, RotateCcw, AlertCircle, Camera } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import SideNavbar from '../../components/SideNavbar/SideNavbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';

const ReturnsRefundsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/profile');
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
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
    navigate('/login', { replace: true });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const response = await api.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <header className="relative bg-primary sticky top-0 z-40 transition-all duration-500 shadow-xl">
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
          
          {/* Left Column: Side Navbar - Hidden on Mobile for Wallet Page */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3 lg:sticky lg:top-24 z-20 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
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

          {/* Right Column: Wallet Content */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-6 relative z-10">
            {/* Wallet Balance Card */}
            <div className="bg-background-card rounded-[3.5rem] p-8 md:p-12 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 group-hover:bg-primary/8"></div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-1 bg-primary rounded-full"></span>
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">Refunds & Returns</p>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight leading-tight">Your Digital <br/><span className="text-primary">Wallet Balance</span></h3>
                  <p className="text-xs font-bold text-text-muted tracking-wide max-w-sm opacity-60 leading-relaxed">
                    Automatically get refunds for cancelled orders and use your balance for future delicious feasts.
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-background-muted rounded-[2.5rem] p-8 md:p-10 border border-border/40 shadow-inner flex flex-col items-center justify-center text-center group/balance transition-all duration-500 hover:shadow-xl hover:bg-background-card">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover/balance:scale-110 transition-transform">
                      <Wallet size={32} />
                    </div>
                    <span className="text-[10px] font-black text-text-muted tracking-[0.3em] uppercase mb-1 opacity-40">Available Balance</span>
                    <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter">
                      ₹{user.walletBalance?.toLocaleString('en-IN') || 0}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-background-card rounded-[3.5rem] p-8 md:p-10 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.03)] min-h-[400px] flex flex-col relative overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                 <div className="space-y-1">
                   <h4 className="text-xl font-black text-text-primary tracking-tight">Recent Activity</h4>
                   <p className="text-[10px] font-black text-text-muted tracking-widest opacity-40 uppercase">Your wallet transaction history</p>
                 </div>
                 <div className="w-10 h-10 bg-background-muted rounded-xl flex items-center justify-center text-text-muted">
                   <Clock size={18} />
                 </div>
               </div>

               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 w-full">
                   <Loader size="medium" />
                   <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
                     Loading transaction history...
                   </p>
                 </div>
               ) : !user.walletTransactions || user.walletTransactions.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                   <div className="w-20 h-20 bg-background-muted rounded-[2rem] flex items-center justify-center text-text-muted/30 mb-6 border border-border/40">
                     <ShoppingBag size={32} strokeWidth={1.5} />
                   </div>
                   <h5 className="text-lg font-black text-text-primary mb-2">No Transactions Yet</h5>
                   <p className="text-[10px] font-bold text-text-muted tracking-widest opacity-40 uppercase max-w-xs mx-auto">Your transaction history will appear here once you receive a refund or make a payment using wallet.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {user.walletTransactions.slice().reverse().map((tx, idx) => (
                     <div key={idx} className="bg-background hover:bg-background-card p-5 rounded-[2rem] border border-border/40 hover:border-primary/20 hover:shadow-xl transition-all duration-500 flex items-center justify-between group/tx animate-in fade-in slide-in-from-bottom-5" style={{ animationDelay: `${idx * 50}ms` }}>
                       <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover/tx:scale-110 duration-500 ${tx.type === 'credit' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                           {tx.type === 'credit' ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                         </div>
                         <div className="space-y-0.5">
                           <h5 className="text-[11px] font-black text-text-primary tracking-tight uppercase group-hover/tx:text-primary transition-colors">{tx.description}</h5>
                           <p className="text-[9px] font-bold text-text-muted opacity-60 flex items-center gap-1.5 uppercase tracking-widest">
                             <Clock size={10} />
                             {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className={`text-lg font-black tracking-tighter ${tx.type === 'credit' ? 'text-green-600' : 'text-text-primary'}`}>
                           {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                         </p>
                         <span className={`text-[8px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-lg border ${tx.type === 'credit' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                           {tx.type === 'credit' ? 'Received' : 'Paid'}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user.email}
      />
      <Footer />
    </div>
  );
};

export default ReturnsRefundsPage;
