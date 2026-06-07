import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Star, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { logoutToLanding } from '../../utils/auth';

const AboutPage = () => {
  const { settings, cartItems } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || 'null');

  useEffect(() => {
    document.title = "GuestO | About Us";
    window.scrollTo(0, 0);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutToLanding(navigate);
  };

  const restaurantName = settings?.restaurantDetails?.name || 'GuestO';

  return (
    <div className={`min-h-screen bg-background ${theme} font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden`}>
      <div className="relative w-full flex flex-col bg-background">

        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
          isLightTop={true}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-40 pb-20 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row gap-10 md:gap-16 items-center">

            { }
            <div className="w-full lg:w-1/2 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 order-2 lg:order-1 text-center lg:text-left mt-8 lg:mt-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mx-auto lg:mx-0">
                <Star size={14} className="text-primary fill-primary" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-primary">Our Story</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary leading-tight">
                Welcome to <br className="hidden sm:block lg:hidden" />
                <span className="text-primary italic">{restaurantName}</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed font-medium">
                We are passionate about delivering the finest culinary experience right to your table.
                Using fresh, locally sourced ingredients and time-honored recipes, we create dishes that tell a story of tradition, flavor, and love.
                Whether you're here for a quick bite or a grand family dinner, we promise an unforgettable dining experience.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-4 bg-background-card p-4 rounded-2xl border border-border/50 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Location</p>
                    <p className="text-xs sm:text-sm font-bold text-text-primary">Thrissur, Kerala</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-background-card p-4 rounded-2xl border border-border/50 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Opening Hours</p>
                    <p className="text-xs sm:text-sm font-bold text-text-primary">11:00 AM - 12:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            { }
            <div className="w-full lg:w-1/2 relative animate-in fade-in slide-in-from-right-10 duration-1000 order-1 lg:order-2">
              <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl aspect-square sm:aspect-[4/3] lg:aspect-square border-4 border-background-card group">
                <img
                  src="/table_pic.png"
                  alt="Restaurant Interior"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shrink-0">
                    <Star size={18} className="text-white fill-white md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base sm:text-lg md:text-xl tracking-tight leading-tight">Authentic Taste</p>
                    <p className="text-white/80 text-[10px] sm:text-xs md:text-sm font-bold">Crafted with passion</p>
                  </div>
                </div>
              </div>

              { }
              <div className="absolute -top-10 -right-10 w-32 h-32 md:w-48 md:h-48 bg-primary/20 rounded-full blur-[40px] -z-10 pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 md:w-56 md:h-56 bg-orange-500/10 rounded-full blur-[40px] -z-10 pointer-events-none"></div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
