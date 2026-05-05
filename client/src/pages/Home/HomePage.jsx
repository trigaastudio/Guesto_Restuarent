import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LayoutGrid, ShoppingCart, User as UserIcon, Package, LogOut, Search, ArrowRight, Plus, X, Check } from 'lucide-react';
import './HomePage.css';
import api from '../../api/axiosInstance';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';

const heroImages = ['/heroSection/hero1.png', '/heroSection/hero2.png', '/heroSection/hero3.png', '/heroSection/hero4.png'];

const HeroSection = React.memo(({ searchQuery, setSearchQuery, heroImages }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [heroIndex, setHeroIndex] = useState(0);
  const directionRef = useRef(1);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    // Hero Carousel Timer (Ping-Pong logic: 1-2-3-4-3-2-1)
    const heroTimer = setInterval(() => {
      setHeroIndex((prev) => {
        let next = prev + directionRef.current;
        if (next >= heroImages.length) {
          directionRef.current = -1;
          return prev - 1;
        }
        if (next < 0) {
          directionRef.current = 1;
          return prev + 1;
        }
        return next;
      });
    }, 4000);

    // Initial change after 2 seconds
    const initialHeroChange = setTimeout(() => {
      setHeroIndex(1);
    }, 2000);

    return () => {
      clearInterval(heroTimer);
      clearTimeout(initialHeroChange);
    };
  }, [heroImages.length]);

  return (
    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 md:px-12 max-w-6xl mx-auto w-full gap-8 lg:gap-16 pt-0 pb-8 md:pt-2 md:pb-16">
      {/* Left Side: Content */}
      <div className="flex-1 text-center lg:text-left space-y-3 md:space-y-4 hero-fade-in order-2 lg:order-1">
        <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          Fastest food delivery 🛵
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-[1.05] text-white tracking-tighter drop-shadow-2xl">
            Hungry? <br />
            <span className="text-white opacity-90">We’ve got you covered.</span>
          </h1>
          <p className="text-white/80 text-xs md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 pt-1 tracking-wide opacity-80">
            Guesto brings <span className="text-white border-b-2 border-white/20 pb-0.5 font-black">premium quality</span> meals directly to your dining table.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-lg pt-2 mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl p-1 flex items-center shadow-2xl overflow-hidden group focus-within:ring-4 focus-within:ring-white/20 transition-all border-2 border-[#D10000]/30 hover:border-[#D10000] transition-colors">
            <div className="flex-1 flex items-center gap-2 pl-4 relative group/input">
              <Search size={20} className="text-[#D10000] opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(localQuery);
                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                placeholder="What are you craving today?"
                className="w-full py-3 pr-10 text-xs md:text-sm font-bold outline-none placeholder:text-gray-400 bg-transparent text-text-primary"
              />
              {localQuery && (
                <button
                  onClick={() => {
                    setLocalQuery('');
                    setSearchQuery('');
                  }}
                  className="absolute right-2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#D10000] transition-all active:scale-90"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery(localQuery);
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#DA9133] hover:bg-[#C27D29] active:bg-[#C27D29] text-white px-5 py-1.5 rounded-xl font-black text-[10px] md:text-xs transition-all transform active:scale-95 shrink-0 tracking-wider flex items-center gap-2 shadow-lg shadow-[#DA9133]/20"
            >
              Search <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Featured Image */}
      <div className="flex-1 flex justify-center lg:justify-end order-1 lg:order-2 hero-fade-in mt-4 lg:mt-0" style={{ animationDelay: '0.3s' }}>
        <div className="relative w-full max-w-[320px] md:max-w-lg aspect-square min-h-[300px] md:min-h-[420px]">
          {heroImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full flex justify-center items-center transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1) ${idx === heroIndex ? 'opacity-100 translate-x-0 scale-110 z-10' : 'opacity-0 translate-x-8 scale-95 z-0'}`}
            >
              <img
                src={img}
                alt={`Hero ${idx + 1}`}
                className="relative w-full h-full object-contain animate-float border-0 outline-none shadow-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});


const MenuModal = ({ isOpen, onClose, menu, addToCart }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    const variants = menu?.variants || menu?.sizes || [];
    if (variants.length > 0) {
      // Find the variant with the lowest price
      const lowestVariant = [...variants].sort((a, b) => a.price - b.price)[0];
      setSelectedSize(lowestVariant.size);
    } else {
      setSelectedSize(null);
    }
  }, [menu]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !menu) return null;

  const variants = menu.variants || menu.sizes || [];
  const selectedVariant = variants.find(v => v.size === selectedSize);
  const currentPrice = selectedVariant ? selectedVariant.price : menu.offerPrice;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-[#FAF9F6] w-full max-w-[400px] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modal Header/Image */}
        <div className="relative h-44 md:h-48 bg-gray-50/50 flex items-center justify-center p-4">
          <img
            src={menu.image || '/placeholder-food.jpg'}
            alt={menu.name}
            className="w-full h-full object-contain drop-shadow-2xl animate-float"
          />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/80 backdrop-blur-md rounded-full text-text-primary hover:bg-[#D10000] hover:text-white transition-all shadow-lg border border-white/50 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${menu.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[9px] font-black tracking-[0.1em] text-text-muted opacity-60">{menu.foodType}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary tracking-tighter leading-none">{menu.name}</h2>
            <p className="text-[10px] md:text-xs text-text-muted font-bold leading-relaxed opacity-60 tracking-wide line-clamp-2">
              {menu.description}
            </p>
          </div>

          {variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#D10000] rounded-full"></div>
                <h4 className="text-[9px] font-black tracking-wider text-text-primary">Choose portion</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.size}
                    onClick={() => setSelectedSize(v.size)}
                    className={`relative p-2.5 rounded-xl flex flex-col items-start transition-all duration-300 border-2 overflow-hidden group ${selectedSize === v.size ? 'bg-white border-[#D10000] shadow-xl' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}
                  >
                    {selectedSize === v.size && (
                      <div className="absolute top-0 right-0 p-1.5 bg-[#D10000] text-white rounded-bl-xl">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                    <span className={`text-[9px] font-black tracking-wider mb-0.5 ${selectedSize === v.size ? 'text-[#D10000]' : 'text-text-muted opacity-40'}`}>{v.size}</span>
                    <span className="text-base font-black text-text-primary tracking-tighter">₹{v.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-black/5">
            <div className="flex flex-col">
              <span className="text-[8px] font-black tracking-widest text-text-muted opacity-40 mb-1">To pay</span>
              <span className="text-2xl font-black text-text-primary tracking-tighter leading-none">₹{currentPrice}</span>
            </div>
            <button
              onClick={() => { addToCart(menu, selectedSize); onClose(); }}
              className="bg-[#DA9133] hover:bg-[#C27D29] text-white px-4 py-2 rounded-xl font-black text-[9px] tracking-wider transition-all shadow-xl shadow-[#DA9133]/20 active:scale-95 flex items-center gap-2"
            >
              Add to cart <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const CategorySection = React.memo(({ categories, selectedCategory, handleCategoryChange }) => {
  return (
    <section className="w-full pt-6 md:pt-10 pb-4 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-text-primary tracking-tighter">
              Thinking of <span className="text-[#D10000]">something delicious?</span>
            </h2>
            <p className="text-xs md:text-sm text-text-muted font-bold tracking-widest opacity-60">Explore our curated categories for every craving</p>
          </div>
          <div className="flex gap-3 pb-1">
            <button
              onClick={() => { const c = document.getElementById('category-scroll'); c.scrollBy({ left: -300, behavior: 'smooth' }); }}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-text-primary hover:bg-[#DA9133] hover:text-white active:bg-[#DA9133] active:text-white transition-all border border-border/60 active:scale-90"
            >
              <ArrowRight className="rotate-180" size={18} />
            </button>
            <button
              onClick={() => { const c = document.getElementById('category-scroll'); c.scrollBy({ left: 300, behavior: 'smooth' }); }}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-text-primary hover:bg-[#DA9133] hover:text-white active:bg-[#DA9133] active:text-white transition-all border border-border/60 active:scale-90"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div
          id="category-scroll"
          className="flex overflow-x-auto gap-8 md:gap-12 pb-4 md:pb-6 hide-scroll snap-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div
            className="flex-shrink-0 cursor-pointer group snap-center active:scale-95 transition-transform"
            onClick={() => handleCategoryChange('all')}
          >
            <div className={`w-24 h-24 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-500 border-0 outline-none ${selectedCategory === 'all' ? 'bg-[#D10000]/5 shadow-inner' : 'bg-gray-100/50 hover:bg-white hover:shadow-xl active:bg-white active:shadow-xl'}`}>
              <UtensilsCrossed size={28} className={`transition-all duration-500 ${selectedCategory === 'all' ? 'text-[#D10000] scale-110' : 'text-text-muted opacity-40 group-hover:opacity-100 group-hover:text-[#D10000] group-hover:scale-110 group-active:opacity-100 group-active:text-[#D10000] group-active:scale-110'}`} />
            </div>
            <p className={`mt-4 text-center text-[10px] font-black tracking-widest transition-all duration-500 ${selectedCategory === 'all' ? 'text-[#D10000] opacity-100 translate-y-0' : 'text-text-muted opacity-40 group-hover:opacity-80 group-active:opacity-80'}`}>All dishes</p>
          </div>

          {categories.map((category) => (
            <div
              key={category._id}
              className="flex-shrink-0 cursor-pointer group snap-center active:scale-95 transition-transform"
              onClick={() => handleCategoryChange(category._id)}
            >
              <div className={`w-24 h-24 md:w-24 md:h-24 rounded-full overflow-hidden transition-all duration-500 border-0 outline-none ${selectedCategory === category._id ? 'scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg active:scale-105 active:shadow-lg'}`}>
                <img
                  src={category.image || '/heroSection/hero1.png'}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-active:scale-110"
                />
              </div>
              <p className={`mt-4 text-center text-[10px] font-black tracking-widest transition-all duration-500 ${selectedCategory === category._id ? 'text-[#D10000] opacity-100 translate-y-0' : 'text-text-muted opacity-40 group-hover:opacity-80 group-active:opacity-80'}`}>{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const MenuSection = React.memo(({ loading, filteredMenus, addToCart, navigate, sortBy, setSortBy, dietaryFilter, setDietaryFilter, setSearchQuery, observerTarget, hasMore, loadingMore, onAddClick }) => {
  return (
    <section id="menu" className="bg-background pt-2 md:pt-8 pb-6 w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter flex items-center gap-4">
              Popular <span className="text-[#D10000]">menu</span>
            </h2>
            <p className="text-text-muted font-bold text-sm md:text-base opacity-60 tracking-widest">Discover the most loved dishes by our customers</p>
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-border/60 text-text-primary text-[10px] md:text-xs font-black tracking-widest rounded-xl px-5 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 hover:border-[#D10000]/40 transition-all cursor-pointer shadow-sm"
              >
                <option value="default">Relevance</option>
                <option value="name-az">Name (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="rating">Top Rated</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D10000]">
                <LayoutGrid size={14} />
              </div>
            </div>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              className={`flex items-center gap-2 px-5 py-3 border text-[10px] md:text-xs font-black tracking-widest rounded-xl transition-all shadow-sm group ${dietaryFilter === 'veg' ? 'bg-[#D10000] text-white border-[#D10000]' : 'bg-gray-50 border-border/60 text-text-primary hover:bg-white hover:border-[#D10000]/40'}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)] ${dietaryFilter === 'veg' ? 'brightness-150' : ''}`}></span>
              Vegetarian
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
              className={`flex items-center gap-2 px-5 py-3 border text-[10px] md:text-xs font-black tracking-widest rounded-xl transition-all shadow-sm ${dietaryFilter === 'non-veg' ? 'bg-[#D10000] text-white border-[#D10000]' : 'bg-gray-50 border-border/60 text-text-primary hover:bg-white hover:border-[#D10000]/40'}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)] ${dietaryFilter === 'non-veg' ? 'brightness-150' : ''}`}></span>
              Non-veg
            </button>

            {(sortBy !== 'default' || dietaryFilter !== 'all' || (typeof searchQuery === 'string' && searchQuery.length > 0)) && (
              <button
                onClick={() => { setSortBy('default'); setDietaryFilter('all'); setSearchQuery(''); }}
                className="text-[10px] md:text-xs font-black tracking-widest text-[#D10000] hover:underline underline-offset-4 px-2"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#D10000]/20 border-t-[#D10000] rounded-full animate-spin"></div>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="py-20 text-center space-y-6 animate-fade-in bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
              <UtensilsCrossed size={40} className="text-[#D10000] opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-text-primary tracking-tighter">No dishes found</h3>
              <p className="text-sm text-text-muted font-bold tracking-widest opacity-60">We couldn't find any items matching your current filters.</p>
            </div>
            <button
              onClick={() => { setDietaryFilter('all'); setSortBy('default'); setSearchQuery(''); }}
              className="px-8 py-3 bg-[#D10000] text-white font-black text-[10px] tracking-widest rounded-full hover:bg-[#B10000] transition-all active:scale-95 shadow-lg shadow-[#D10000]/20"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 animate-fade-in">
            {filteredMenus.map((menu, index) => (
              <div
                key={`${menu._id}-${index}`}
                className="bg-[#FFF5F5] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden p-3.5 md:p-5 transition-all duration-500 group flex flex-col h-full hover:bg-[#D10000] active:bg-[#D10000] shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(209,0,0,0.15)] active:shadow-[0_20px_50px_rgba(209,0,0,0.15)]"
                style={{ animationDelay: `${(index % 10) * 0.05}s` }}
              >
                <div className="relative h-32 md:h-36 mb-3 md:mb-4 overflow-hidden rounded-xl">
                  <img
                    src={menu.image || '/placeholder-food.jpg'}
                    alt={menu.name}
                    className="w-full h-full object-contain group-hover:scale-110 group-active:scale-110 transition-transform duration-700 ease-out"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-sm text-text-primary group-hover:text-white group-active:text-white transition-colors leading-tight mb-1 tracking-tight truncate">
                    {menu.name}
                  </h3>



                  <p className="text-[9px] text-text-muted/60 group-hover:text-white/60 group-active:text-white/60 line-clamp-2 mb-4 leading-relaxed font-bold tracking-widest transition-colors">
                    {menu.description}
                  </p>

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-black/5 group-hover:border-white/10 group-active:border-white/10">
                    <span className="font-black text-base text-text-primary group-hover:text-white group-active:text-white transition-colors">
                      ₹{(() => {
                        const variants = menu.variants || menu.sizes || [];
                        if (variants.length > 0) {
                          // Find the lowest price among variants
                          const prices = variants.map(v => v.price);
                          return Math.min(...prices);
                        }
                        return menu.offerPrice;
                      })()}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddClick(menu); }}
                      className="bg-[#DA9133]/10 group-hover:bg-[#DA9133] group-active:bg-[#DA9133] text-[#DA9133] group-hover:text-white group-active:text-white p-2 rounded-lg transition-all active:scale-90 shadow-sm"
                      title="Add to Cart"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Observer Target for Infinite Scroll */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center mt-2">
          {loadingMore && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-[#D10000]/20 border-t-[#D10000] rounded-full animate-spin"></div>
              <span className="text-[10px] font-black tracking-widest text-[#D10000] opacity-60">Loading more dishes...</span>
            </div>
          )}
          {!hasMore && filteredMenus.length > 0 && (
            <p className="text-[10px] font-black tracking-widest text-text-muted opacity-40">You've reached the end of the menu</p>
          )}
        </div>
      </div>
    </section>
  );
});


const HomePage = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMenuForModal, setSelectedMenuForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const observerTarget = useRef(null);

  const { addToCart, cartItems } = useCart();
  const { theme } = useTheme();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategories();
    fetchMenus();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchMenus = useCallback(async (categoryId = 'all', pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const url = categoryId === 'all'
        ? `/api/menus?page=${pageNum}&limit=10`
        : `/api/menus?category=${categoryId}&page=${pageNum}&limit=10`;

      const response = await api.get(url);

      if (pageNum === 1) {
        setMenus(response.data);
      } else {
        setMenus(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 10);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    if (page > 1) {
      fetchMenus(selectedCategory, page);
    }
  }, [page, selectedCategory, fetchMenus]);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setHasMore(true);
    fetchMenus(categoryId, 1);
  }, [fetchMenus]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  const filteredMenus = useMemo(() => {
    let result = menus.filter(menu => {
      const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDietary = dietaryFilter === 'all' ||
        (dietaryFilter === 'veg' && menu.foodType === 'veg') ||
        (dietaryFilter === 'non-veg' && menu.foodType === 'non-veg');
      return matchesSearch && matchesDietary;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => {
        const getMinPrice = (m) => {
          const variants = m.variants || m.sizes || [];
          return variants.length > 0 ? Math.min(...variants.map(v => v.price)) : (m.offerPrice || 0);
        };
        return getMinPrice(a) - getMinPrice(b);
      });
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => {
        const getMinPrice = (m) => {
          const variants = m.variants || m.sizes || [];
          return variants.length > 0 ? Math.min(...variants.map(v => v.price)) : (m.offerPrice || 0);
        };
        return getMinPrice(b) - getMinPrice(a);
      });
    } else if (sortBy === 'name-az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    }

    return result;
  }, [menus, searchQuery, sortBy, dietaryFilter]);

  const getCategoryName = () => {
    if (selectedCategory === 'all') return 'All Dishes';
    const cat = categories.find(c => c._id === selectedCategory);
    return cat ? cat.name : 'Dishes';
  };

  return (
    <div className={`min-h-screen bg-background font-sans ${theme}`}>
      <div className="relative min-h-0 md:min-h-0 w-full overflow-hidden flex flex-col bg-[#D10000]">
        <div className="absolute inset-0 z-0 bg-[#D10000]"></div>

        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />

        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          navigate={navigate}
          heroImages={heroImages}
        />
      </div>

      <main className="w-full pt-0 pb-0 space-y-0 bg-background">
        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
        />

        <MenuSection
          loading={loading}
          filteredMenus={filteredMenus}
          addToCart={addToCart}
          navigate={navigate}
          sortBy={sortBy}
          setSortBy={setSortBy}
          dietaryFilter={dietaryFilter}
          setDietaryFilter={setDietaryFilter}
          setSearchQuery={setSearchQuery}
          observerTarget={observerTarget}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onAddClick={(menu) => {
            setSelectedMenuForModal(menu);
            setIsModalOpen(true);
          }}
        />
      </main>

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menu={selectedMenuForModal}
        addToCart={addToCart}
      />

      {/* Premium Footer with Brand Red Theme */}
      <Footer />

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .bg-radial-gradient {
          background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to));
        }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default HomePage;
