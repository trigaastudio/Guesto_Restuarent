import React, { useEffect, useState, useRef } from 'react';
import { ChefHat, History, Heart, Star, Award, Users } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const { settings, cartItems } = useCart();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    document.title = "GuestO | Our Story";
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  };

  const stats = [
    { label: 'Years of Excellence', value: '14+', icon: History },
    { label: 'Master Chefs', value: '8', icon: ChefHat },
    { label: 'Happy Guests', value: '50k+', icon: Users },
    { label: 'Awards Won', value: '12', icon: Award },
  ];

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      {/* Header with Brand Red Theme */}
      <div className="relative w-full overflow-hidden flex flex-col bg-[#B91C1C]">
        <div className="absolute inset-0 z-0 bg-[#B91C1C]"></div>
        
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-white/50 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Est. 2010</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                  A Legacy of <br />
                  <span className="text-primary-light italic">Authentic</span> Flavor
                </h1>
              </div>
              <p className="text-lg text-white/80 leading-relaxed font-medium max-w-xl">
                Founded in the heart of Thrissur, {settings?.restaurantDetails?.name || 'GuestO'} began as a small family kitchen with a big dream: to share the rich culinary heritage of Kerala with a modern, premium touch.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-light">
                      <stat.icon size={18} />
                      <span className="text-2xl font-black tracking-tighter text-white">{stat.value}</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-black/20 aspect-[4/5] lg:aspect-square border-4 border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop" 
                  alt="Our Story" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                  <p className="text-white text-lg font-black italic">
                    "We don't just serve food; we serve memories of home, crafted with the finest ingredients and a pinch of love."
                  </p>
                </div>
              </div>
              {/* Decorative glows */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary-light/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <section className="py-20 bg-background-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tighter">Our Culinary Philosophy</h2>
            <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]">What makes us extraordinary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Authenticity',
                desc: 'Every recipe is passed down through generations, ensuring the true taste of traditional Kerala spices.',
                icon: Heart,
                color: 'bg-red-500/10 text-red-500'
              },
              {
                title: 'Innovation',
                desc: 'While we respect tradition, we love to innovate. Our chefs blend modern techniques with heritage flavors.',
                icon: Star,
                color: 'bg-amber-500/10 text-amber-500'
              },
              {
                title: 'Quality First',
                desc: 'We source only the freshest organic ingredients from local farmers, supporting our community and your health.',
                icon: Award,
                color: 'bg-emerald-500/10 text-emerald-500'
              }
            ].map((item, i) => (
              <div key={i} className="bg-background-card p-10 rounded-[2.5rem] border border-border/50 hover:border-primary/20 transition-all duration-500 group shadow-lg hover:shadow-2xl">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-text-primary mb-4 tracking-tight">{item.title}</h3>
                <p className="text-text-secondary text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Join us for an <br /><span className="text-primary-light">Experience</span> like no other</h2>
                <p className="text-white/80 text-lg font-medium leading-relaxed">
                  Whether it's a family gathering or a quiet solo dinner, we're here to make every moment delicious and memorable. Visit us in the heart of Thrissur today.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => navigate('/home')} className="px-8 py-4 bg-white text-primary rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl">
                    View Menu
                  </button>
                  <button onClick={() => navigate('/contact')} className="px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                    Contact Us
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-4 pt-8">
                    <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" className="rounded-3xl shadow-xl aspect-square object-cover" />
                    <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop" className="rounded-3xl shadow-xl aspect-video object-cover" />
                 </div>
                 <div className="space-y-4">
                    <img src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=2070&auto=format&fit=crop" className="rounded-3xl shadow-xl aspect-video object-cover" />
                    <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop" className="rounded-3xl shadow-xl aspect-square object-cover" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
