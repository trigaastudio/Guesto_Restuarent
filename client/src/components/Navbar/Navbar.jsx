import React, { useState } from 'react';
import { ShoppingCart, User as UserIcon, LayoutGrid, UtensilsCrossed, Menu, X, Home, Info, Phone, Utensils } from 'lucide-react';

const Navbar = React.memo(({ user, cartItems, showUserDropdown, setShowUserDropdown, handleLogout, navigate, dropdownRef, hideCart }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Menu', icon: Utensils, path: '/home' },
    { name: 'About', icon: Info, path: '#' },
    { name: 'Contact', icon: Phone, path: '#' },
  ];

  const handleNavClick = (e, path, name) => {
    e.preventDefault();
    if (name === 'Menu') {
      if (window.location.pathname === '/home') {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/home#menu');
        // Small delay to allow home page to load before scrolling if necessary
        setTimeout(() => {
          const menuSection = document.getElementById('menu');
          if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (path !== '#') {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="relative z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-24 flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/logo-light.png"
            alt="GuestO"
            className="h-8 md:h-10 cursor-pointer active:opacity-80 transition-opacity"
            onClick={() => navigate('/home')}
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={(e) => handleNavClick(e, link.path, link.name)}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors outline-none"
            >
              {link.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          {!hideCart && (
            <div
              className="relative cursor-pointer group p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all duration-300 active:scale-95"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart size={20} className="text-white group-hover:scale-110 transition-transform" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DA9133] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#D10000] shadow-lg animate-pulse">
                  {cartItems.length}
                </span>
              )}
            </div>
          )}

          {user && user.name ? (
            <div className="relative cursor-pointer" ref={dropdownRef}>
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 md:p-1.5 md:pr-4 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/10 transition-all duration-300"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#DA9133] flex items-center justify-center text-white font-black text-xs md:text-sm shadow-inner">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-white text-[10px] font-black tracking-widest hidden md:block uppercase">{user.name.split(' ')[0]}</span>
              </div>

              <div className={`absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden transition-all duration-500 z-50 transform ${showUserDropdown ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4'}`}>
                <div className="p-6 bg-[#D10000]/5 border-b border-[#D10000]/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#D10000] font-black mb-1.5 opacity-60">Welcome back,</p>
                  <p className="font-black text-text-primary text-lg truncate">{user.name}</p>
                </div>
                <div className="p-3">
                  <button onClick={() => { setShowUserDropdown(false); navigate('/profile'); }} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-text-primary hover:bg-[#D10000]/5 rounded-2xl transition-all group/item">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/item:bg-[#DA9133] group-hover/item:text-white transition-all"><UserIcon size={18} /></div>
                    <div className="flex flex-col items-start"><span>My Profile</span><span className="text-[9px] font-bold text-text-muted opacity-50 uppercase tracking-widest">Account Details</span></div>
                  </button>
                  <button onClick={() => { setShowUserDropdown(false); navigate('/my-orders'); }} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-text-primary hover:bg-[#D10000]/5 rounded-2xl transition-all group/item">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/item:bg-[#DA9133] group-hover/item:text-white transition-all"><LayoutGrid size={18} /></div>
                    <div className="flex flex-col items-start"><span>My Orders</span><span className="text-[9px] font-bold text-text-muted opacity-50 uppercase tracking-widest">Track History</span></div>
                  </button>
                  <div className="h-px bg-gray-100 my-2 mx-4"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all group/item">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover/item:bg-red-500 group-hover/item:text-white transition-all"><UtensilsCrossed size={18} className="rotate-45" /></div>
                    <div className="flex flex-col items-start"><span>Logout</span><span className="text-[9px] font-bold text-red-400 opacity-50 uppercase tracking-widest">See you soon</span></div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-[#DA9133] text-white px-5 md:px-7 py-2 md:py-2.5 font-black hover:bg-[#C27D29] transition-all text-[10px] md:text-[11px] rounded-full shadow-lg active:scale-95 uppercase tracking-[0.15em]"
            >
              Join Now
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar (Side Navbar) */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div className={`absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 bg-[#D10000] text-white flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

            <div className="flex items-center justify-between relative z-10">
              <img src="/logo-light.png" alt="GuestO" className="h-8" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Removed redundant header for cleaner look */}
          </div>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={(e) => handleNavClick(e, link.path, link.name)}
                className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-text-primary hover:bg-[#D10000]/5 rounded-2xl transition-all group/item"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/item:bg-[#DA9133] group-hover/item:text-white transition-all">
                  <link.icon size={18} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-black text-sm uppercase tracking-widest">{link.name}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="p-8 border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50">
              <div className="w-10 h-10 rounded-full bg-[#DA9133] flex items-center justify-center text-white font-black text-sm">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-text-primary">{user?.name || 'Guest User'}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
