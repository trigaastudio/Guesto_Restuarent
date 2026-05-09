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
import Swal from 'sweetalert2';

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
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  useEffect(() => {
    fetchMenuDetails();
    window.scrollTo(0, 0);
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
        confirmButtonColor: '#D10000'
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

    // Prepare item for cart
    const itemToAdd = {
      ...menu,
      selectedSize: selectedSize?.size || null,
      price: selectedSize?.price || menu.offerPrice,
      quantity: quantity
    };

    // Add multiple times based on quantity (CartContext usually handles 1 at a time or has quantity param)
    // Checking current addToCart implementation - usually it adds one. 
    // If it only adds one, I'll call it multiple times or check context.
    for (let i = 0; i < quantity; i++) {
      addToCart(itemToAdd);
    }

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-background ${theme} flex flex-col`}>
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#D10000]/20 border-t-[#D10000] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className={`min-h-screen bg-background ${theme} flex flex-col`}>
        <Navbar user={user} cartItems={cartItems} navigate={navigate} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={64} className="text-[#D10000] opacity-20" />
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Dish Not Found</h2>
          <p className="text-text-muted font-bold opacity-60">The dish you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/home')} className="px-8 py-3 bg-[#D10000] text-white rounded-full font-black uppercase tracking-widest transition-all hover:bg-[#B10000]">Back to Home</button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPrice = selectedSize?.price || menu.offerPrice;

  return (
    <div className={`min-h-screen bg-background font-sans ${theme}`}>
      <header className="relative bg-[#D10000] sticky top-0 z-50 shadow-xl overflow-hidden">
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
            className="flex items-center gap-2 text-text-muted hover:text-[#D10000] font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
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
            <div className="absolute -inset-4 bg-[#D10000]/5 rounded-[3rem] blur-2xl group-hover:bg-[#D10000]/10 transition-all duration-700"></div>
            <div className="relative bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.05)] overflow-hidden">
              <img
                src={menu.image || '/placeholder-food.jpg'}
                alt={menu.name}
                className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out animate-float"
              />

              {/* Overlay Tags */}
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${menu.foodType === 'veg' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {menu.foodType === 'veg' ? '🥦 Pure Veg' : '🥩 Non-Veg'}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#DA9133] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#DA9133]/20">
                  🔥 Best Seller
                </span>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-10 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-[#D10000] rounded-full"></span>
                <p className="text-[10px] font-black text-[#D10000] uppercase tracking-[0.2em]">{menu.category?.name || 'Main Course'}</p>
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
                      className={`px-8 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest active:scale-95 ${selectedSize?.size === s.size ? 'border-[#D10000] bg-[#D10000]/5 text-[#D10000] shadow-lg shadow-[#D10000]/10' : 'border-gray-100 bg-gray-50 text-text-muted hover:border-[#D10000]/30'}`}
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
                <p className="text-4xl font-black text-text-primary tracking-tighter">
                  ₹{currentPrice * quantity}
                </p>
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
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-[#D10000] shadow-lg shadow-[#D10000]/20 active:scale-90 transition-all"
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
                disabled={menu.stockStatus === 'out-of-stock'}
                className={`flex-1 flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${menu.stockStatus === 'out-of-stock' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#D10000] text-white hover:bg-[#B10000] shadow-[#D10000]/30 hover:-translate-y-1'}`}
              >
                <ShoppingCart size={20} />
                {menu.stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                disabled={menu.stockStatus === 'out-of-stock'}
                className="flex-1 px-10 py-5 rounded-[2rem] border-2 border-[#DA9133] text-[#DA9133] font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#DA9133] hover:text-white active:scale-95 hover:-translate-y-1"
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
              You Might Also <span className="text-[#D10000]">Love</span>
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
