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

  React.useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/home') {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
          const menuTop = menuSection.offsetTop - 200;
          if (window.scrollY >= menuTop) {
            setActiveSection('menu');
          } else {
            setActiveSection('hero');
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', icon: Home, path: '/home', isHome: true },
    { name: 'Menu', icon: Utensils, path: '/home', isMenu: true },
    { name: 'Cart', icon: ShoppingCart, path: '/cart', showBadge: true },
    { name: 'Profile', icon: User, path: '/profile', isProfile: true },
  ];

  const isActive = (path, item) => {
    if (location.pathname === '/home') {
      if (item.isHome) return activeSection === 'hero' && !showProfileOptions;
      if (item.isMenu) return activeSection === 'menu' && !showProfileOptions;
    }
    if (item?.isProfile) {
      return ['/profile', '/my-orders', '/returns-refunds'].includes(location.pathname);
    }
    return location.pathname === path;
  };

  // Paths where the bottom navbar should NOT be shown
  const excludedPaths = ['/', '/login', '/register', '/admin/login', '/admin/dashboard'];
  if (excludedPaths.includes(location.pathname) || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleItemClick = (item) => {
    setShowProfileOptions(false);
    if (item.isMenu) {
      if (location.pathname === '/home') {
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
      if (location.pathname === '/home') {
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
      <div className={`fixed bottom-[90px] right-8 z-[1001] transition-all duration-500 ${showProfileOptions ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* Address Option - Top */}
        <button
          onClick={() => { navigate('/profile'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform ${showProfileOptions ? '-translate-y-32 scale-100' : 'translate-y-0 scale-0'}`}
        >
          <MapPin size={20} strokeWidth={2.5} />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-blue-500 text-[8px] font-black px-2.5 py-1.5 rounded-xl shadow-lg border border-blue-100 uppercase tracking-widest whitespace-nowrap">Address</div>
        </button>

        {/* Orders Option - Diagonal */}
        <button
          onClick={() => { navigate('/my-orders'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 delay-75 transform ${showProfileOptions ? '-translate-y-24 -translate-x-24 scale-100' : 'translate-y-0 scale-0'}`}
        >
          <Package size={20} strokeWidth={2.5} />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-orange-500 text-[8px] font-black px-2.5 py-1.5 rounded-xl shadow-lg border border-orange-100 uppercase tracking-widest whitespace-nowrap">Orders</div>
        </button>

        {/* Wallet Option - Left */}
        <button
          onClick={() => { navigate('/returns-refunds'); setShowProfileOptions(false); }}
          className={`absolute bottom-0 right-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 delay-150 transform ${showProfileOptions ? '-translate-x-32 scale-100' : 'translate-x-0 scale-0'}`}
        >
          <Wallet size={20} strokeWidth={2.5} />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-green-500 text-[8px] font-black px-2.5 py-1.5 rounded-xl shadow-lg border border-green-100 uppercase tracking-widest whitespace-nowrap">Wallet</div>
        </button>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white/90 dark:bg-black/95 backdrop-blur-2xl border-t border-gray-100 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 py-3 pb-8 flex items-center justify-around transition-all duration-300">
        {navItems.map((item) => {
          const ActiveIcon = item.isProfile && showProfileOptions ? X : item.icon;
          const active = isActive(item.path, item) && !showProfileOptions;

          return (
            <button
              key={item.name}
              onClick={() => handleItemClick(item)}
              className="flex-1 flex flex-col items-center gap-1 relative group active:scale-95 transition-transform"
            >
              <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${active || (item.isProfile && showProfileOptions) ? 'bg-[#D10000] text-white shadow-lg shadow-[#D10000]/30 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-[#D10000]'}`}>
                <ActiveIcon size={22} strokeWidth={active || (item.isProfile && showProfileOptions) ? 3 : 2} />
                {item.showBadge && cartItems.length > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black border-2 ${active ? 'bg-white text-[#D10000] border-[#D10000]' : 'bg-[#D10000] text-white border-white'}`}>
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${active || (item.isProfile && showProfileOptions) ? 'text-[#D10000] opacity-100 mt-1' : 'text-gray-400 dark:text-gray-500 opacity-60'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default BottomNavbar;
