import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();

  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Orders', icon: Package, path: '/my-orders' },
    { name: 'Cart', icon: ShoppingCart, path: '/cart', showBadge: true },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  // Paths where the bottom navbar should NOT be shown
  const excludedPaths = ['/', '/login', '/register', '/admin/login', '/admin/dashboard'];
  if (excludedPaths.includes(location.pathname) || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white/80 dark:bg-black/90 backdrop-blur-2xl border-t border-gray-100 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 py-3 pb-6 flex items-center justify-around translate-y-0 transition-all duration-300">
      {navItems.map((item) => {
        const ActiveIcon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className="flex-1 flex flex-col items-center gap-1 relative group"
          >
            <div className={`relative p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-[#D10000] text-white shadow-lg shadow-[#D10000]/20 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-[#D10000]'}`}>
              <ActiveIcon size={20} strokeWidth={active ? 2.5 : 2} />
              {item.showBadge && cartItems.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-black border-2 ${active ? 'bg-white text-[#D10000] border-[#D10000]' : 'bg-[#D10000] text-white border-white'}`}>
                  {cartItems.length}
                </span>
              )}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${active ? 'text-[#D10000] opacity-100 mt-0.5' : 'text-gray-400 dark:text-gray-500 opacity-60'}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavbar;
