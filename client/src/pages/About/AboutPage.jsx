import React, { useEffect, useState, useRef } from 'react';
import { ChefHat, History, Heart, Star, Award, Users, MapPin, Clock } from 'lucide-react';
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
    logoutToLanding(navigate);
  };

  const stats = [
    { label: 'Years of Excellence', value: '14+', icon: History },
    { label: 'Master Chefs', value: '8', icon: ChefHat },
    { label: 'Happy Guests', value: '50k+', icon: Users },
    { label: 'Awards Won', value: '12', icon: Award },
  ];

  return (
    <div className={`min-h-screen bg-background ${theme} font-sans selection:bg-primary/30 selection:text-primary`}>
      {}
      <div className="relative w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#B91C1C] via-[#991b1b] to-[#7f1d1d]">
        <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />

        <div className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-10 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000 ease-out">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Est. 2010</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] drop-shadow-2xl">
                  A Legacy of <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic drop-shadow-none">Authentic</span> <br />
                  Flavor
                </h1>
              </div>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium max-w-xl border-l-4 border-amber-500/50 pl-6">
                Founded in the heart of Thrissur, {settings?.restaurantDetails?.name || 'GuestO'} began as a small family kitchen with a big dream: to share the rich culinary heritage of Kerala with a modern, premium touch.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                {stats.map((stat, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex items-center gap-3 text-amber-400 mb-1">
                      <stat.icon size={20} className="group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500" />
                      <span className="text-3xl font-black tracking-tighter text-white drop-shadow-md">{stat.value}</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 ease-out delay-200">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40 aspect-[4/5] lg:aspect-[3/4] border border-white/20 group">
                <img 
                  src="/restaurant%20day.jpeg" 
                  alt="Restaurant Exterior Day" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/20 shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Heart size={20} className="text-amber-400 fill-amber-400" />
                    </div>
                    <p className="text-white/90 text-sm md:text-base font-bold italic leading-relaxed">
                      "We don't just serve food; we serve memories of home, crafted with the finest ingredients and a pinch of love."
                    </p>
                  </div>
                </div>
              </div>
              {}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-[50px]"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-[60px]"></div>
            </div>
          </div>
        </div>
      </div>

      {}
      <section className="py-24 relative overflow-hidden bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border-main to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-primary tracking-tighter">Culinary Philosophy</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
            <p className="text-text-muted font-bold uppercase tracking-[0.3em] text-[10px] pt-4">What makes us extraordinary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Authenticity',
                desc: 'Every recipe is passed down through generations, ensuring the true taste of traditional Kerala spices.',
                icon: Heart,
                color: 'from-red-500/20 to-red-500/5',
                textColor: 'text-red-500',
                borderColor: 'group-hover:border-red-500/30'
              },
              {
                title: 'Innovation',
                desc: 'While we respect tradition, we love to innovate. Our chefs blend modern techniques with heritage flavors.',
                icon: Star,
                color: 'from-amber-500/20 to-amber-500/5',
                textColor: 'text-amber-500',
                borderColor: 'group-hover:border-amber-500/30'
              },
              {
                title: 'Quality First',
                desc: 'We source only the freshest organic ingredients from local farmers, supporting our community and your health.',
                icon: Award,
                color: 'from-emerald-500/20 to-emerald-500/5',
                textColor: 'text-emerald-500',
                borderColor: 'group-hover:border-emerald-500/30'
              }
            ].map((item, i) => (
              <div key={i} className={`bg-background-card p-10 rounded-[2.5rem] border border-border-light hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden ${item.borderColor} hover:-translate-y-2`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10 border border-white/10 shadow-sm`}>
                  <item.icon size={28} className={item.textColor} />
                </div>
                <h3 className="text-2xl font-black text-text-primary mb-4 tracking-tight relative z-10">{item.title}</h3>
                <p className="text-text-secondary text-sm font-medium leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-24 bg-background-muted/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="bg-background-card rounded-[3rem] border border-border-light shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {}
            <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center space-y-8 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-3xl rounded-full"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary border border-primary/20">
                  <Star size={12} className="fill-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">The Experience</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-text-primary leading-[1.1]">
                  Dine in <br />
                  <span className="text-primary italic">Elegance</span>
                </h2>
                
                <p className="text-text-secondary text-lg font-medium leading-relaxed">
                  Whether it's a family gathering or a quiet solo dinner, our meticulously designed spaces provide the perfect ambiance. 
                  Experience the warmth of our hospitality at our beautifully crafted dining tables.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => navigate('/home')} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95 shadow-lg shadow-primary/30 flex justify-center items-center">
                    Order Now
                  </button>
                  <button onClick={() => navigate('/contact')} className="px-8 py-4 bg-background border border-border-main text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-background-muted transition-all active:scale-95 flex justify-center items-center">
                    Find Us
                  </button>
                </div>
              </div>
            </div>

            {}
            <div className="w-full lg:w-1/2 bg-black relative min-h-[400px] lg:min-h-full">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                <div className="row-span-2 col-span-1 relative group overflow-hidden">
                  <img 
                    src="/restaurant%20night.jpeg" 
                    alt="Restaurant Night View" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] text-white/80 font-black uppercase tracking-widest backdrop-blur-md bg-black/30 px-3 py-1 rounded-full">Evening Vibe</span>
                  </div>
                </div>
                
                <div className="col-span-1 row-span-1 relative group overflow-hidden">
                  <img 
                    src="/table_pic.png" 
                    alt="Dining Table setup" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] text-white/80 font-black uppercase tracking-widest backdrop-blur-md bg-black/30 px-3 py-1 rounded-full">Dine-In</span>
                  </div>
                </div>
                
                <div className="col-span-1 row-span-1 relative group overflow-hidden bg-primary/20 flex flex-col items-center justify-center text-center p-6">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')] opacity-40 object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="relative z-10 space-y-2">
                    <MapPin size={24} className="text-white mx-auto mb-2" />
                    <p className="text-white font-black text-sm uppercase tracking-widest">Visit Us</p>
                    <p className="text-white/70 text-xs font-bold">Thrissur, Kerala</p>
                  </div>
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
