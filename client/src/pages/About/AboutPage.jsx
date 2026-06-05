import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Clock, Phone, ChefHat, Heart } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { logoutToLanding } from '../../utils/auth';

const AboutPage = () => {
  const { settings, cartItems } = useCart();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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
    <div className={`min-h-screen bg-background ${theme} font-sans selection:bg-primary/30 selection:text-primary flex flex-col`}>
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

      <main className="flex-grow pt-28 pb-20 relative overflow-hidden flex flex-col items-center justify-center">
        {}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 w-full relative z-10">
          
          {}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter mb-4">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover italic">Story</span>
            </h1>
            <p className="text-text-secondary font-medium text-lg max-w-2xl mx-auto">
              A brief glimpse into the passion and tradition behind every dish we serve.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-background-card p-6 md:p-10 rounded-[2.5rem] border border-border-light shadow-2xl hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] transition-all duration-700">
            
            {}
            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl aspect-square md:aspect-[4/3] animate-in fade-in slide-in-from-left-12 duration-1000">
              <img 
                src="/restaurant_pic.jpeg" 
                alt={`${restaurantName} Restaurant`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-700"></div>
              
              {}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Heart size={20} className="text-white fill-white" />
                  </div>
                  <p className="text-white text-sm font-bold leading-tight">
                    Crafting culinary memories since 2010.
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-1000 delay-150">
              
              <div>
                <h2 className="text-3xl font-black text-text-primary mb-4 tracking-tight">
                  Welcome to {restaurantName}
                </h2>
                <p className="text-text-secondary leading-relaxed font-medium">
                  At {restaurantName}, we believe that food is more than just sustenance—it's an experience meant to be shared. 
                  Our journey began with a simple desire: to bring authentic flavors to your table in a modern, elegant setting.
                  Every ingredient is handpicked, and every dish is crafted with dedication by our master chefs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {}
                <div className="p-5 rounded-2xl bg-background border border-border-light flex gap-4 items-start hover:border-primary/50 transition-colors group">
                  <MapPin size={24} className="text-primary mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-1">Location</h3>
                    <p className="text-text-secondary text-sm font-medium">
                      {settings?.restaurantDetails?.address || '123 Culinary Street, Food City'}
                    </p>
                  </div>
                </div>

                {}
                <div className="p-5 rounded-2xl bg-background border border-border-light flex gap-4 items-start hover:border-primary/50 transition-colors group">
                  <Clock size={24} className="text-primary mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-1">Hours</h3>
                    <p className="text-text-secondary text-sm font-medium">
                      Mon-Sun: 10:00 AM - 11:00 PM
                    </p>
                  </div>
                </div>

                {}
                <div className="p-5 rounded-2xl bg-background border border-border-light flex gap-4 items-start hover:border-primary/50 transition-colors group">
                  <Phone size={24} className="text-primary mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-1">Contact</h3>
                    <p className="text-text-secondary text-sm font-medium">
                      {settings?.restaurantDetails?.phone || '+1 234 567 8900'}
                    </p>
                  </div>
                </div>

                {}
                <div className="p-5 rounded-2xl bg-background border border-border-light flex gap-4 items-start hover:border-primary/50 transition-colors group">
                  <ChefHat size={24} className="text-primary mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-1">Philosophy</h3>
                    <p className="text-text-secondary text-sm font-medium">
                      Fresh ingredients, traditional roots.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
