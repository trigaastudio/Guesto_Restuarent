import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Utensils, ShoppingCart, User, MapPin, Wallet, Package, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();
  const [showProfileOptions, setShowProfileOptions] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('hero'); // 'hero' or 'menu'

  const [isVisible, setIsVisible] = React.useState(true); // Always visible by default

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (['/home', '/'].includes(location.pathname)) {
            const menuSection = document.getElementById('menu');
            if (menuSection) {
              const menuTop = menuSection.offsetTop - 200;
              const inMenu = window.scrollY >= menuTop;
              if (activeSection !== (inMenu ? 'menu' : 'hero')) {
                setActiveSection(inMenu ? 'menu' : 'hero');
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, activeSection]);

  const navItems = [
    { name: 'Home', icon: Home, path: '/home', isHome: true },
    { name: 'Menu', icon: Utensils, path: '/home', isMenu: true },
    { name: 'Cart', icon: ShoppingCart, path: '/cart', showBadge: true },
    { name: 'Profile', icon: User, path: '/profile', isProfile: true },
  ];

  const isActive = (path, item) => {
    const isHomePage = ['/home', '/'].includes(location.pathname);
    if (isHomePage) {
      if (item.isHome) return activeSection === 'hero' && !showProfileOptions;
      if (item.isMenu) return activeSection === 'menu' && !showProfileOptions;
    }
    if (item?.isProfile) {
      return ['/profile', '/my-orders', '/returns-refunds'].includes(location.pathname);
    }
    return location.pathname === path;
  };

  // Paths where the bottom navbar should NOT be shown
  const excludedPaths = ['/login', '/register', '/admin/login', '/admin/dashboard', '/digital-menu'];
  if (excludedPaths.includes(location.pathname) || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleItemClick = (item) => {
    setShowProfileOptions(false);
    if (item.isMenu) {
      if (['/home', '/'].includes(location.pathname)) {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/home');
        setTimeout(() => {
          const menuSection = document.getElementById('menu');
          if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (item.isHome) {
      if (['/home', '/'].includes(location.pathname)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/home');
      }
    } else if (item.isProfile) {
      setShowProfileOptions(!showProfileOptions);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Radial Profile Menu */}
      <div className={`fixed bottom-[100px] md:bottom-[120px] right-6 md:right-10 z-[1001] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${showProfileOptions ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* Address Option - Top */}
        <button
          onClick={() => { navigate('/profile'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-14 h-14 md:w-16 md:h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-500 transform hover:scale-110 active:scale-90 ${showProfileOptions ? '-translate-y-36 md:-translate-y-44 scale-100 rotate-0' : 'translate-y-0 scale-0 rotate-45'}`}
        >
          <MapPin size={24} className="md:size-7" strokeWidth={2.5} />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background-card/90 backdrop-blur-sm text-blue-500 text-[9px] font-black px-3 py-2 rounded-xl shadow-xl border border-blue-500/20 uppercase tracking-widest whitespace-nowrap">Address</div>
        </button>

        {/* Orders Option - Diagonal */}
        <button
          onClick={() => { navigate('/my-orders'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-14 h-14 md:w-16 md:h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.3)] transition-all duration-500 delay-75 transform hover:scale-110 active:scale-90 ${showProfileOptions ? '-translate-y-24 -translate-x-24 md:-translate-y-32 md:-translate-x-32 scale-100 rotate-0' : 'translate-y-0 scale-0 rotate-45'}`}
        >
          <Package size={24} className="md:size-7" strokeWidth={2.5} />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background-card/90 backdrop-blur-sm text-orange-500 text-[9px] font-black px-3 py-2 rounded-xl shadow-xl border border-orange-500/20 uppercase tracking-widest whitespace-nowrap">Orders</div>
        </button>

        {/* Wallet Option - Left */}
        <button
          onClick={() => { navigate('/returns-refunds'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-14 h-14 md:w-16 md:h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all duration-500 delay-150 transform hover:scale-110 active:scale-90 ${showProfileOptions ? '-translate-x-36 md:-translate-x-44 scale-100 rotate-0' : 'translate-x-0 scale-0 rotate-45'}`}
        >
          <Wallet size={24} className="md:size-7" strokeWidth={2.5} />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background-card/90 backdrop-blur-sm text-green-500 text-[9px] font-black px-3 py-2 rounded-xl shadow-xl border border-green-500/20 uppercase tracking-widest whitespace-nowrap">Wallet</div>
        </button>
      </div>

      {/* Main Floating Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] sm:w-[85%] md:w-[70%] max-w-[500px] transition-all duration-500 translate-y-0 opacity-100 visible">
        <div className="bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.5)] rounded-[2rem] px-2 py-2 flex items-center justify-around transition-all duration-500">
          
          {navItems.map((item) => {
            const ActiveIcon = item.isProfile && showProfileOptions ? X : item.icon;
            const active = isActive(item.path, item) && !showProfileOptions;

            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                className="relative flex-1 flex flex-col items-center justify-center py-2 z-20 cursor-pointer outline-none group"
              >
                <div className={`relative transition-all duration-300 flex flex-col items-center ${active ? 'scale-110' : 'opacity-60 group-hover:opacity-100'}`}>
                  <div className={`p-1.5 rounded-xl transition-all duration-500 ${active ? 'bg-primary/10 text-primary' : 'text-white'}`}>
                    <ActiveIcon size={20} strokeWidth={active ? 3 : 2} />
                  </div>
                  
                  {/* Badge for Cart */}
                  {item.showBadge && cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-primary text-white text-[8px] font-black border-2 border-[#1A1A1A]">
                      {cartItems.length}
                    </span>
                  )}

                  <span className={`mt-1 text-[8px] font-black uppercase tracking-wider transition-all duration-300 ${active ? 'text-primary' : 'text-white'}`}>
                    {item.name}
                  </span>
                </div>

                {/* Active Indicator Dot */}
                {active && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#B91C1C]"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNavbar;
