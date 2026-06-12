import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../Home/HomePage.css';
import api from '../../api/axiosInstance';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import CategorySection from '../../components/Category/CategorySection';
import MenuSection from '../../components/Menu/MenuSection';
import MenuModal from '../../components/Menu/MenuModal';
import PageSkeleton from '../../components/Skeleton/PageSkeleton';
import { useCart } from '../../context/CartContext';
import StoreStatusBanner from '../../components/StoreStatus/StoreStatusBanner';
import OffersCarousel from '../../components/Offers/OffersCarousel';
import { Utensils, MapPin, Sparkles, Flame, Share2, ChevronLeft, ChevronRight, X, Search, ArrowRight } from 'lucide-react';

const DigitalMenu = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { checkStoreStatus } = useCart();
  const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
  const isClosed = !storeStatus.isOpen;
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [trendingItems, setTrendingItems] = useState([]);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [offerFilter, setOfferFilter] = useState(null);
  const [offerName, setOfferName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || localStorage.getItem('admin_user') || 'null'));

  const observerTarget = useRef(null);
  const scrollContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.title = "Digital Menu | GuestO";
    fetchCategories();
    fetchMenus(1, true);
    fetchSettings();
    fetchTrending();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setRestaurantSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await api.get('/api/menus/top-selling');
      if (response.data?.success) {
        setTrendingItems(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching top-selling:', error);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.filter(cat => cat.isActive !== false));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchMenus = useCallback(async (pageNum = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get('/api/menus', {
        params: {
          page: pageNum,
          limit: 20,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: debouncedSearchQuery || undefined,
          foodType: dietaryFilter !== 'all' ? dietaryFilter : undefined,
          sortBy: sortBy !== 'default' ? sortBy : undefined,
          
          
          offerId: offerFilter && offerFilter.length === 24 ? offerFilter : undefined,
          bogo: offerFilter === 'bogo' ? 'true' : undefined,
          combo: offerFilter === 'combo' ? 'true' : undefined,
          discount: offerFilter === 'discount' ? 'true' : undefined,
        }
      });

      const newMenus = response.data;
      if (isInitial) {
        setMenus(newMenus);
      } else {
        setMenus(prev => [...prev, ...newMenus]);
      }
      setHasMore(newMenus.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, debouncedSearchQuery, dietaryFilter, sortBy, offerFilter]);

  useEffect(() => {
    fetchMenus(1, true);
  }, [selectedCategory, debouncedSearchQuery, dietaryFilter, sortBy, offerFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMenus(page + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchMenus]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setHasMore(true);
  };

  const handleClearAll = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('default');
    setDietaryFilter('all');
    setOfferFilter(null);
    setOfferName('');
    setPage(1);
    setHasMore(true);
  };

  const handlePromoFilterToggle = (type, label) => {
    if (offerFilter === type) {
      setOfferFilter(null);
      setOfferName('');
    } else {
      setSelectedCategory('all');
      setOfferFilter(type);
      setOfferName(label);
    }
    setPage(1);
    setHasMore(true);
  };

  const scrollTrending = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading && menus.length === 0 && categories.length === 0) {
    return <PageSkeleton />;
  }

  const restaurantName = restaurantSettings?.restaurantDetails?.name || 'GUESTO RESTAURANT';
  const restaurantAddress = restaurantSettings?.restaurantDetails?.address || 'Premium Dining';
  const logoSrc = restaurantSettings?.branding?.logoGold || '/logo-golden.png';

  return (
    <div className={`min-h-screen bg-background font-sans overflow-x-hidden ${theme}`}>
      {/* ── Header: same red hero style as LandingPage ── */}
      <div className="relative w-full overflow-hidden flex flex-col bg-[#B91C1C]">
        <div className="absolute inset-0 z-0 bg-[#B91C1C]"></div>

        {/* Shared Navbar (same as Landing / Home) */}
        <Navbar
          user={user}
          cartItems={[]}
          hideCart={true}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />

        {/* Hero content — logo + restaurant name + address */}
        <div className="relative pt-10 sm:pt-12 md:pt-14 lg:pt-16 pb-16 sm:pb-20 md:pb-28 lg:pb-32 overflow-hidden">
          {/* ambient blobs */}
          <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-[60px] sm:blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-[40px] sm:blur-[50px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-24">

              {/* Right: logo image */}
              <div className="w-full lg:flex-1 relative flex justify-center lg:justify-end order-1 lg:order-2">
                <div className="relative w-full max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[480px] aspect-square">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] sm:blur-[80px] animate-pulse"></div>
                  <img
                    src={logoSrc}
                    alt={restaurantName}
                    className="w-full h-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)] animate-float"
                  />
                </div>
              </div>

              {/* Left: text content */}
              <div className="flex-1 text-center lg:text-left space-y-4 sm:space-y-5 hero-fade-in order-2 lg:order-1 w-full flex flex-col items-center lg:items-start">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl mx-auto lg:mx-0">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]"></span>
                  Exclusive Digital Menu 🍽️
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] md:leading-[0.9] text-white tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] uppercase">
                    {restaurantName}
                  </h1>
                  <p className="text-white/70 text-[10px] sm:text-xs md:text-base font-bold leading-relaxed max-w-[280px] sm:max-w-md mx-auto lg:mx-0 tracking-wide flex items-center justify-center lg:justify-start gap-1.5">
                    <MapPin size={12} className="text-white/50 flex-shrink-0" />
                    {restaurantAddress}
                  </p>
                </div>

                {/* CTA: scroll to menu */}
                <div className="pt-1 sm:pt-2 mx-auto lg:mx-0">
                  <button
                    onClick={() => { const el = document.getElementById('menu'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                    className="bg-white text-[#B91C1C] px-6 sm:px-10 py-3 sm:py-4 rounded-full font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-black/20 flex items-center gap-2 hover:bg-gray-50"
                  >
                    Browse Menu <ArrowRight size={14} strokeWidth={3} />
                  </button>
                </div>

                {/* Top Selling pills */}
                {trendingItems.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mt-2">
                    <span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">🔥 Top Selling:</span>
                    {trendingItems.slice(0, 3).map(item => (
                      <button
                        key={item._id}
                        onClick={() => { const el = document.getElementById('menu'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                        className="text-[7px] sm:text-[9px] font-black text-white hover:text-white/60 transition-all uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/5 rounded-full border border-white/10"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area — same rounded-top style as LandingPage */}
      <div className="relative z-10 bg-background rounded-t-[3rem] -mt-12 md:-mt-20">

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-32">
          <div className="mb-16">
            <OffersCarousel
              onOfferClick={(offer) => {
                setSelectedCategory('all');
                setOfferFilter(offer._id);
                setOfferName(offer.title);
                setPage(1);
                setHasMore(true);
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
          
          {}
          {trendingItems.length > 0 && (
             <div className="mb-24 relative group/slider">
                <div className="flex items-center justify-between mb-12 px-6">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Flame size={28} className="text-primary animate-pulse" />
                         </div>
                         <h2 className="text-4xl font-black text-text-primary tracking-tighter">
                            Most Loved <span className="text-primary italic">Dishes</span>
                         </h2>
                      </div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60 ml-16">Most loved by our community</p>
                   </div>

                   <div className="hidden md:flex items-center gap-4">
                      <button 
                        onClick={() => scrollTrending('left')}
                        className="p-4 bg-background-card border border-border/10 rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90"
                      >
                         <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => scrollTrending('right')}
                        className="p-4 bg-background-card border border-border/10 rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90"
                      >
                         <ChevronRight size={24} />
                      </button>
                   </div>
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto no-scrollbar gap-8 px-6 pb-8 snap-x"
                >
                    {trendingItems.filter(item => !item.isBlocked).map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { if (!isClosed) { setSelectedMenu(item); setIsModalOpen(true); } }}
                        className={`flex-shrink-0 w-[220px] md:w-[280px] bg-background-card rounded-[2.5rem] p-4 border border-border/5 shadow-xl transition-all duration-500 group snap-center relative overflow-hidden ${
                          isClosed 
                          ? 'grayscale opacity-60 pointer-events-none' 
                          : 'hover:shadow-[0_20px_50px_rgba(185,28,28,0.1)] cursor-pointer'
                        }`}
                      >
                         <div className="relative h-44 md:h-52 rounded-[2rem] overflow-hidden mb-5">
                            <img 
                              src={item.image || '/placeholder-food.jpg'} 
                              alt={item.name} 
                              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ${isClosed ? 'grayscale brightness-0' : ''}`} 
                            />
                            
                            {isClosed && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20">
                                <span className="bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl border border-black/10">
                                  Closed
                                </span>
                              </div>
                            )}

                            {!isClosed && (
                              <>
                                 {(() => {
                                   const menuDiscount = item.discountPercentage || 0;
                                   const cat = categories.find(c => c._id === item.category);
                                   const categoryDiscount = cat?.discountPercentage || 0;
                                   const maxDiscountPercent = Math.max(menuDiscount, categoryDiscount);
                                   return maxDiscountPercent > 0 && !item.isCombo ? (
                                      <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg z-10">
                                         {`${maxDiscountPercent}% OFF`}
                                      </div>
                                   ) : null;
                                })()}
                              </>
                            )}
                         </div>
                         <div className="px-1">
                            <h3 className="text-lg font-black text-text-primary mb-3 group-hover:text-primary transition-colors truncate">{item.name}</h3>
                            <div className="flex items-center justify-between border-t border-border/10 pt-4">
                               {(() => {
                                  const originalPrice = item.offerPrice || item.price || (item.variants && item.variants.length > 0 ? Math.min(...item.variants.map(v => v.price)) : 0);
                                  const menuDiscount = item.discountPercentage || 0;
                                  const cat = categories.find(c => c._id === item.category);
                                  const categoryDiscount = cat?.discountPercentage || 0;
                                  const maxDiscountPercent = Math.max(menuDiscount, categoryDiscount);
                                  const discountedPrice = maxDiscountPercent > 0 && !item.isCombo ? originalPrice * (1 - maxDiscountPercent / 100) : originalPrice;
                                  
                                  return (
                                     <div className="flex flex-col">
                                        {maxDiscountPercent > 0 && !item.isCombo && (
                                           <span className="text-[10px] text-text-muted line-through opacity-60">
                                             ₹{Math.round(originalPrice)}
                                           </span>
                                        )}
                                        <span className="text-xl font-black text-text-primary">
                                          ₹{Math.round(discountedPrice)}
                                        </span>
                                     </div>
                                  );
                               })()}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {}
          <div className="max-w-3xl mx-auto mb-16 px-4 sticky top-6 z-40">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[50px] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                placeholder="Find your flavor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background-card border-2 border-border/5 rounded-[3rem] px-12 py-7 text-sm md:text-xl font-black text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-[20px] focus:ring-primary/5 transition-all shadow-2xl relative z-10"
              />
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-primary opacity-40 group-focus-within:opacity-100 group-focus-within:scale-110 transition-all z-20">
                <Utensils size={32} />
              </div>
            </div>
          </div>

          <CategorySection
            categories={categories}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
          />

          {offerFilter && (
             <div className="max-w-3xl mx-auto mb-8 px-4 flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-2xl animate-fade-in" id="menu">
                <div className="flex items-center gap-2">
                   <Sparkles size={18} className="text-primary" />
                   <span className="text-sm font-bold text-primary">
                      Showing: {offerName || 'Special Offer'}
                   </span>
                </div>
                <button 
                  onClick={() => { setOfferFilter(null); setOfferName(''); setPage(1); setHasMore(true); }}
                  className="text-xs font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Clear Filter
                </button>
             </div>
          )}

          <div className="pb-32" id={!offerFilter ? "menu" : undefined}>
             <MenuSection
               loading={loading}
               filteredMenus={menus.filter(menu => !menu.isBlocked)}
               sortBy={sortBy}
               setSortBy={setSortBy}
               dietaryFilter={dietaryFilter}
               setDietaryFilter={setDietaryFilter}
               setSearchQuery={setSearchQuery}
               observerTarget={observerTarget}
               hasMore={hasMore}
               loadingMore={loadingMore}
               onAddClick={(menu) => {
                 setSelectedMenu(menu);
                 setIsModalOpen(true);
               }}
               viewOnly={true}
               selectedCategory={selectedCategory}
               searchQuery={searchQuery}
               offerFilter={offerFilter}
               handlePromoFilterToggle={handlePromoFilterToggle}
               onClearAll={handleClearAll}
             />
          </div>
        </main>
      </div>

      {/* ── Bottom Floating Navbar — Landing Page Style ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-[400px] md:hidden">
        <nav className="bg-background-card/95 backdrop-blur-2xl border border-border/20 rounded-[2.5rem] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center justify-around gap-2 transition-all">

          {/* Offers */}
          <button
            onClick={() => setIsOffersModalOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-all group active:scale-90"
          >
            <div className="w-11 h-11 rounded-2xl bg-background-muted group-hover:bg-primary/10 flex items-center justify-center transition-all">
              <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Offers</span>
          </button>

          {/* Center: Browse Menu — raised pill, primary red */}
          <button
            onClick={() => { const el = document.getElementById('menu'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            className="flex-[1.4] flex flex-col items-center gap-1.5 py-3.5 bg-primary rounded-[2rem] text-white shadow-[0_12px_30px_rgba(185,28,28,0.35)] -translate-y-4 active:scale-95 transition-all group"
          >
            <Utensils size={22} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Menu</span>
          </button>

          {/* Share */}
          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({ title: restaurantName, text: 'Check out our digital menu!', url: window.location.href });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  alert('Menu link copied!');
                }
              } catch (e) { console.error(e); }
            }}
            className="flex-1 flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-all group active:scale-90"
          >
            <div className="w-11 h-11 rounded-2xl bg-background-muted group-hover:bg-primary/10 flex items-center justify-center transition-all">
              <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Share</span>
          </button>
        </nav>
      </div>

      {isOffersModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOffersModalOpen(false)}></div>
          <div className="bg-background-card w-full max-w-[500px] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-border/10 p-6 pt-12">
            <button
              onClick={() => setIsOffersModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-background-muted/80 backdrop-blur-md rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-lg border border-border/10 active:scale-90 z-20"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-black text-text-primary mb-4 tracking-tighter">Current Offers</h2>
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              <OffersCarousel onOfferClick={(offer) => {
                 setSelectedCategory('all');
                 setOfferFilter(offer._id);
                 setOfferName(offer.title);
                 setIsOffersModalOpen(false);
                 setPage(1);
                 setHasMore(true);
                 setTimeout(() => {
                    const menuElement = document.getElementById('menu');
                    if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }, 100);
              }} />
            </div>
          </div>
        </div>
      )}

      <Footer />

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menu={selectedMenu}
        onAction={() => {}} 
        viewOnly={true}
      />
      <StoreStatusBanner />

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-in { animation: hero-fade-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }

        .snap-x { scroll-snap-type: x mandatory; }
        .snap-center { scroll-snap-align: center; }
      `}} />
    </div>
  );
};

export default DigitalMenu;
