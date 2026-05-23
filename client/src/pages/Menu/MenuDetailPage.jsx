import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Clock,
  Flame,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import Loader from '../../components/Loader/Loader';
import Swal from 'sweetalert2';
import socket from '../../services/socket';

const MenuDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { theme } = useTheme();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}'), []);

  useEffect(() => {
    fetchMenuDetails();
    window.scrollTo(0, 0);

    // Socket Setup
    if (!socket.connected) socket.connect();

    socket.on('stockUpdate', ({ itemId, totalStock, isBlocked }) => {
      const receivedId = (itemId?._id || itemId || '').toString();
      if (id === receivedId) {
        setMenu(prev => prev ? { 
          ...prev, 
          totalStock: totalStock !== undefined ? totalStock : prev.totalStock,
          isBlocked: isBlocked !== undefined ? isBlocked : prev.isBlocked
        } : prev);
      }
    });

    return () => {
      socket.off('stockUpdate');
    };
  }, [id]);

  const fetchMenuDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/menus/${id}`);
      setMenu(response.data);
      if (response.data.sizes && response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
    } catch (error) {
      console.error('Error fetching menu details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load dish details. Please try again later.',
        confirmButtonColor: '#B91C1C'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (type) => {
    if (type === 'inc') setQuantity(prev => prev + 1);
    else if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCart = () => {
    if (!menu) return;

    if (menu.isCombo && menu.comboItems?.length > 0) {
      const outOfStockItems = [];
      for (const ci of menu.comboItems) {
        if (ci.menuItem?.totalStock !== undefined && ci.menuItem.totalStock <= 0) {
          outOfStockItems.push(ci.menuItem.name);
        }
      }
      if (outOfStockItems.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Out of Stock',
          text: `Cannot add ${menu.name}. ${outOfStockItems.join(', ')} is currently out of stock.`,
          confirmButtonColor: '#B91C1C'
        });
        return;
      }
    } else {
      if (menu.totalStock !== undefined && menu.totalStock <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Out of Stock',
          text: `${menu.name} is currently out of stock.`,
          confirmButtonColor: '#B91C1C'
        });
        return;
      }
    }

    // Add item to cart with proper quantity and selected size
    addToCart(menu, quantity, selectedSize?.size || null);

    Swal.fire({
      icon: 'success',
      title: 'Added to Cart',
      text: `${quantity} x ${menu.name} added successfully!`,
      showConfirmButton: false,
      timer: 1500,
      toast: true,
      position: 'top-end'
    });
  };

  const handleLogout = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');
    if (currentUser.role === 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login', { replace: true });
    } else if (currentUser.role === 'kitchen' || currentUser.role === 'waiter') {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      navigate('/staff/login', { replace: true });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return <Loader fullPage={true} />;
  }

  if (!menu) {
    return (
      <div className={`min-h-screen bg-background ${theme} flex flex-col`}>
        <Navbar user={user} cartItems={cartItems} navigate={navigate} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={64} className="text-[#B91C1C] opacity-20" />
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Dish Not Found</h2>
          <p className="text-text-muted font-bold opacity-60">The dish you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/home')} className="px-8 py-3 bg-[#B91C1C] text-white rounded-full font-black uppercase tracking-widest transition-all hover:bg-[#B10000]">Back to Home</button>
        </div>
        <Footer />
      </div>
    );
  }

  const menuDiscount = menu.discountPercentage || 0;
  const categoryDiscount = menu.category?.discountPercentage || 0;
  const discountPercent = Math.max(menuDiscount, categoryDiscount);

  const basePrice = selectedSize?.price || menu.offerPrice || menu.price || 0;
  
  const currentPrice = menu.isCombo 
    ? (menu.price || basePrice)
    : Math.round(discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice);

  const hasSavings = discountPercent > 0 && !menu.isCombo;

  return (
    <div className={`min-h-screen bg-background font-sans ${theme}`}>
      <header className="relative bg-[#B91C1C] sticky top-0 z-50 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] pointer-events-none"></div>
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
        />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Breadcrumbs & Back */}
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-[#B91C1C] font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Menu
          </button>
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
              <Heart size={20} />
            </button>
            <button className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-text-muted hover:text-[#DA9133] hover:bg-orange-50 transition-all active:scale-90">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Image Hero */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#B91C1C]/5 rounded-[3rem] blur-2xl group-hover:bg-[#B91C1C]/10 transition-all duration-700"></div>
            <div className="relative bg-white rounded-[3rem] p-4 md:p-6 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.05)] overflow-hidden">
              <img
                src={menu.image || '/placeholder-food.jpg'}
                alt={menu.name}
                className="w-full h-auto max-h-[500px] object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out animate-float"
              />

              {/* Overlay Tags */}
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${menu.foodType === 'veg' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {menu.foodType === 'veg' ? '🥦 Pure Veg' : '🥩 Non-Veg'}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#DA9133] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#DA9133]/20">
                  🔥 Best Seller
                </span>
                {(menu.totalStock <= 0 || menu.isBlocked) && (
                  <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 animate-pulse">
                    🚫 {menu.isBlocked ? 'Unavailable' : 'Out of Stock'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-10 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-[#B91C1C] rounded-full"></span>
                <p className="text-[10px] font-black text-[#B91C1C] uppercase tracking-[0.2em]">{menu.category?.name || 'Main Course'}</p>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter uppercase leading-[0.95]">
                {menu.name}
              </h1>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= 4 ? "#DA9133" : "transparent"} color="#DA9133" />)}
                  <span className="text-sm font-black text-text-primary ml-2">4.8</span>
                  <span className="text-xs font-bold text-text-muted opacity-40 ml-1 uppercase tracking-widest">(120+ Reviews)</span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">15-20 Min</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-text-muted leading-relaxed font-bold opacity-70">
                {menu.description || "Experience a burst of flavors with our chef's special creation. Prepared with the freshest ingredients and authentic spices to give you a truly memorable dining experience."}
              </p>
            </div>

            {/* Sizes Selection */}
            {menu.sizes && menu.sizes.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Select Size</p>
                <div className="flex flex-wrap gap-4">
                  {menu.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`px-8 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest active:scale-95 ${selectedSize?.size === s.size ? 'border-[#B91C1C] bg-[#B91C1C]/5 text-[#B91C1C] shadow-lg shadow-[#B91C1C]/10' : 'border-gray-100 bg-gray-50 text-text-muted hover:border-[#B91C1C]/30'}`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Quantity */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Total Price</p>
                <div className="flex flex-col">
                  {hasSavings && (
                    <span className="text-sm font-black text-text-muted line-through opacity-60">
                      ₹{Math.round(basePrice * quantity)}
                    </span>
                  )}
                  <p className="text-4xl font-black text-text-primary tracking-tighter">
                    ₹{Math.round(currentPrice * quantity)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  <button
                    onClick={() => handleQuantityChange('dec')}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-text-primary hover:bg-white hover:shadow-sm transition-all active:scale-90"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center font-black text-xl">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange('inc')}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-[#B91C1C] shadow-lg shadow-[#B91C1C]/20 active:scale-90 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={menu.totalStock <= 0 || menu.isBlocked}
                className={`flex-1 flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${menu.totalStock <= 0 || menu.isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#B91C1C] text-white hover:bg-[#B10000] shadow-[#B91C1C]/30 hover:-translate-y-1'}`}
              >
                <ShoppingCart size={20} />
                {menu.isBlocked ? 'Unavailable' : (menu.totalStock <= 0 ? 'Out of Stock' : 'Add to Cart')}
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                disabled={menu.totalStock <= 0 || menu.isBlocked}
                className={`flex-1 px-10 py-5 rounded-[2rem] border-2 font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 hover:-translate-y-1 ${menu.totalStock <= 0 || menu.isBlocked ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-[#DA9133] text-[#DA9133] hover:bg-[#DA9133] hover:text-white'}`}
              >
                Buy Now
              </button>
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-2 gap-4 pt-10">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50/50 border border-green-100/50">
                <CheckCircle2 className="text-green-500" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Fresh Ingredients</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                <Flame className="text-orange-500" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Chef's Special</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Items - Placeholder for now or actual fetch if needed */}
        <div className="mt-32 space-y-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tighter uppercase">
              You Might Also <span className="text-[#B91C1C]">Love</span>
            </h2>
            <div className="w-24 h-1.5 bg-[#DA9133] rounded-full"></div>
          </div>
          {/* Reusing existing Menu card style or similar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* This could be a separate component if we had more time, but for now we'll just show a message or a few placeholder cards */}
            <p className="col-span-full text-center text-text-muted font-bold uppercase tracking-widest opacity-40">Coming Soon: Personalized Recommendations</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MenuDetailPage;
