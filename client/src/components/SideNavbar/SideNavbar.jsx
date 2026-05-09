import React from 'react';
import { Mail, Phone, LogOut, Camera, ShieldCheck, Lock, RefreshCcw, Wallet } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const SideNavbar = ({ user, handleLogout, navigate, onAvatarClick, fileInputRef, handleAvatarUpload, onChangePassword }) => {
  const location = useLocation();
  const currentPath = location.pathname;



  return (
    <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-8 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group w-full">
      {/* Abstract Backdrop Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-[#D10000]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D10000]/10 transition-colors duration-700"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="relative mb-4 md:mb-6 group/avatar cursor-pointer" onClick={onAvatarClick}>
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden group-hover/avatar:shadow-[0_30px_70px_rgba(209,0,0,0.15)] transition-all duration-700">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-inner bg-gray-50">
              <img
                src={user.avatar ? `http://localhost:5000${user.avatar}` : '/user-avatar.png'}
                alt={user.name}
                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-1000"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-[#D10000]/5 text-[#D10000] text-4xl font-black">
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500">
              <Camera className="text-white mb-1" size={20} />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Update</span>
            </div>
          </div>

          <div className="absolute bottom-1 right-1 w-8 h-8 md:w-9 md:h-9 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white border-4 border-white z-20 group-hover/avatar:scale-110 transition-transform duration-500">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D10000] animate-pulse"></span>
            <p className="text-[8px] font-black text-text-muted tracking-widest uppercase">Member since Apr 2024</p>
          </div>
        </div>

        {/* Contact Info (Compact) */}
        <div className="w-full space-y-2 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-[#D10000]">
              <Mail size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] font-black text-text-muted tracking-widest uppercase opacity-40">Email</p>
              <p className="text-[10px] font-bold text-text-primary truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-[#D10000]">
              <Phone size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] font-black text-text-muted tracking-widest uppercase opacity-40">Phone</p>
              <p className="text-[10px] font-bold text-text-primary">{user.phone || user.mobile || 'Not linked'}</p>
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="w-full mt-6 space-y-2">
          {!user.googleId && (
            <button
              onClick={onChangePassword}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-text-primary rounded-2xl transition-all duration-500 font-black text-[10px] tracking-widest uppercase border border-gray-100 group/pass"
            >
              <Lock size={16} className="group-hover/pass:rotate-12 transition-transform" />
              Change password
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideNavbar;
