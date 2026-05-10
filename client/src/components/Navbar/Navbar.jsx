import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, User as UserIcon, LayoutGrid, UtensilsCrossed, Menu, X, Home, Info, Phone, Utensils, Wallet, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Navbar = React.memo(({ user = null, showUserDropdown, setShowUserDropdown, handleLogout, navigate, dropdownRef, hideCart }) => {
  const { cartItems, settings, checkStoreStatus } = useCart();
  const storeStatus = checkStoreStatus();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Menu', icon: Utensils, path: '/home' },
    { name: 'About', icon: Info, path: '/about' },
    { name: 'Contact', icon: Phone, path: '/contact' },
  ];

  const handleNavClick = (e, path, name) => {
    e.preventDefault();
    if (name === 'Home') {
      const targetPath = user ? '/home' : '/';
      if (window.location.pathname === targetPath) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(targetPath);
      }
    } else if (name === 'Menu') {
      const targetPath = user ? '/home' : '/';
      if (window.location.pathname === targetPath) {
        const menuSection = document.getElementById('menu');
        if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`${targetPath}#menu`);
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
    <header 
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        isScrolled ? 'py-1.5 md:py-3' : 'py-2 md:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        <div 
          className={`flex items-center justify-between px-3 md:px-6 py-2 rounded-[2rem] transition-all duration-500 ${
            isScrolled 
            ? 'bg-background-card/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)]' 
            : 'bg-transparent border border-transparent'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img
              src={isDarkMode 
                ? (settings?.branding?.logoGold || "/logo-light.png") 
                : (settings?.branding?.logoDark || "/logo-dark.png")
              }
              alt={settings?.restaurantDetails?.name || "GuestO"}
              className={`h-7 md:h-10 cursor-pointer transition-all duration-500 ${isScrolled ? '' : (isDarkMode ? '' : 'brightness-0 invert')}`}
              onClick={() => navigate('/home')}
            />
            {!storeStatus.isOpen && (
              <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                Closed
              </span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={(e) => handleNavClick(e, link.path, link.name)}
                className={`relative px-6 py-2 text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300 group ${
                  isScrolled ? 'text-text-primary' : 'text-white'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-1 rounded-full transition-all duration-300 group-hover:w-4 ${
                  isScrolled ? 'bg-[#B91C1C]' : 'bg-white'
                }`}></span>
              </button>
            ))}
          </nav>

          {/* Theme Toggle & Right Actions */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-500 active:scale-90 group ${
                isScrolled 
                ? 'bg-background-muted/50 border-border text-text-primary hover:border-primary/30' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {isDarkMode ? <Sun size={18} className="md:size-5 group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="md:size-5 group-hover:-rotate-12 transition-transform" />}
            </button>
            {!hideCart && (
              <div
                className={`relative p-2.5 rounded-full border transition-all duration-500 cursor-pointer group active:scale-90 hidden lg:flex ${
                  isScrolled 
                ? 'bg-[#B91C1C]/5 border-[#B91C1C]/10 text-[#B91C1C]' 
                : 'bg-white/10 border-white/20 text-white'
              }`}
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart size={18} className="md:size-5 group-hover:scale-110 transition-transform" />
                {cartItems.length > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black border-2 animate-pulse ${
                    isScrolled ? 'bg-[#DA9133] border-white text-white' : 'bg-white border-[#B91C1C] text-[#B91C1C]'
                  }`}>
                    {cartItems.length}
                  </span>
                )}
              </div>
            )}

            {user && user.name ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 p-1 md:pr-4 rounded-full border transition-all duration-500 cursor-pointer ${
                    isScrolled 
                    ? 'bg-background-muted border-border hover:border-primary/30' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="w-7 h-7 md:w-8 h-8 rounded-full bg-[#DA9133] flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className={`text-[10px] font-black tracking-widest hidden md:block ${
                    isScrolled ? 'text-text-primary' : 'text-white'
                  }`}>
                    {user.name.split(' ')[0]}
                  </span>
                </div>

                {/* Dropdown */}
                <div className={`absolute top-full right-0 mt-4 w-72 bg-background-card rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-border transition-all duration-500 ${
                  showUserDropdown ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4'
                }`}>
                  <div className="p-8 bg-primary/5 border-b border-border relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#B91C1C]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <p className="text-[10px] font-black text-[#B91C1C] opacity-60 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-xl font-black text-text-primary truncate">{user.name}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <button onClick={() => { setShowUserDropdown(false); navigate('/profile'); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-background-muted transition-all group text-text-primary">
                      <div className="w-10 h-10 rounded-xl bg-background-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <UserIcon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-wider">My Profile</p>
                        <p className="text-[9px] font-bold text-text-muted opacity-60">Account Settings</p>
                      </div>
                    </button>
                    <button onClick={() => { setShowUserDropdown(false); navigate('/my-orders'); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-background-muted transition-all group text-text-primary">
                      <div className="w-10 h-10 rounded-xl bg-background-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <LayoutGrid size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-wider">My Orders</p>
                        <p className="text-[9px] font-bold text-text-muted opacity-60">Track History</p>
                      </div>
                    </button>
                    <div className="h-px bg-border my-2 mx-4"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all text-red-500">
                        <LogOut size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-red-500 uppercase tracking-wider">Sign Out</p>
                        <p className="text-[9px] font-bold text-red-400 opacity-60">See you again</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`px-4 md:px-8 py-2 md:py-3 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 shadow-xl ${
                  isScrolled 
                  ? 'bg-[#B91C1C] text-white shadow-[#B91C1C]/20 hover:bg-[#991b1b]' 
                  : 'bg-white text-[#B91C1C] shadow-white/10 hover:bg-gray-50'
                }`}
              >
                Sign In
              </button>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isScrolled ? 'text-text-primary bg-background-muted' : 'text-white bg-white/10'
              }`}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute inset-y-0 left-0 w-[280px] sm:w-80 bg-background shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 md:p-8 bg-[#B91C1C] text-white flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="flex items-center justify-between relative z-10">
              <img src="/logo-light.png" alt="GuestO" className="h-8" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Guesto Experience</p>
              <p className="text-2xl font-black tracking-tighter">Premium Dining</p>
            </div>
          </div>
          <nav className="flex-1 p-4 md:p-6 space-y-2 bg-background">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={(e) => handleNavClick(e, link.path, link.name)}
                className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl hover:bg-background-muted transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-background-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <link.icon size={20} />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.2em] text-text-primary">{link.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
