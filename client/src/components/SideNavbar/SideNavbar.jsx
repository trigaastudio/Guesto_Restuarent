import React from 'react';
import { Mail, Phone, LogOut, Camera, ShieldCheck, Lock, MapPin, User, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const SideNavbar = ({ 
  user, 
  handleLogout, 
  navigate, 
  onAvatarClick, 
  fileInputRef, 
  handleAvatarUpload, 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <div className="bg-background-card rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-8 border border-border/40 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group w-full">
      {/* Abstract Backdrop Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="relative mb-4 md:mb-6 group/avatar cursor-pointer" onClick={onAvatarClick}>
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-background-card p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border/40 relative overflow-hidden group-hover/avatar:shadow-[0_30px_70px_rgba(185,28,28,0.15)] transition-all duration-700">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-background shadow-inner bg-background-muted flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={`http://localhost:5000${user.avatar}`}
                  alt={user.name}
                  className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-1000"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${user.avatar ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-primary/5 text-primary text-4xl font-black`}>
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500">
              <Camera className="text-white mb-1" size={20} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span>
            </div>
          </div>

          <div className="absolute bottom-1 right-1 w-8 h-8 md:w-9 md:h-9 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white border-4 border-background z-20 group-hover/avatar:scale-110 transition-transform duration-500">
            <ShieldCheck size={16} strokeWidth={3} />
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight mb-1">{user.name}</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-background-muted rounded-full border border-border/40">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <p className="text-[10px] font-black text-text-muted tracking-widest uppercase">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full space-y-2 pt-6 border-t border-border/40">
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 font-black text-xs tracking-widest uppercase border ${
              activeTab === 'addresses'
                ? 'bg-primary text-white border-primary shadow-[0_8px_25px_rgba(185,28,28,0.2)]'
                : 'bg-background-muted hover:bg-background text-text-primary border-border/40'
            }`}
          >
            <MapPin size={15} />
            Addresses
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 font-black text-xs tracking-widest uppercase border ${
              activeTab === 'profile'
                ? 'bg-primary text-white border-primary shadow-[0_8px_25px_rgba(185,28,28,0.2)]'
                : 'bg-background-muted hover:bg-background text-text-primary border-border/40'
            }`}
          >
            <User size={15} />
            Edit Profile
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 font-black text-xs tracking-widest uppercase border ${
              activeTab === 'security'
                ? 'bg-primary text-white border-primary shadow-[0_8px_25px_rgba(185,28,28,0.2)]'
                : 'bg-background-muted hover:bg-background text-text-primary border-border/40'
            }`}
          >
            <Shield size={15} />
            Security
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 mt-4 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl transition-all duration-500 font-black text-xs tracking-widest uppercase border border-red-500/20 group/logout"
          >
            <LogOut size={15} className="group-hover/logout:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNavbar;
