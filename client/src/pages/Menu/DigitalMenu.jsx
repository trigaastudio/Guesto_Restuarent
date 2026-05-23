import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../Home/HomePage.css'; 
import api from '../../api/axiosInstance';
import Footer from '../../components/Footer/Footer';
import CategorySection from '../../components/Category/CategorySection';
import MenuSection from '../../components/Menu/MenuSection';
import MenuModal from '../../components/Menu/MenuModal';
import Loader from '../../components/Loader/Loader';
import { useCart } from '../../context/CartContext';
import StoreStatusBanner from '../../components/StoreStatus/StoreStatusBanner';
import OffersCarousel from '../../components/Offers/OffersCarousel';
import { Utensils, Info, Phone, MapPin, Sparkles, Flame, Share2, LayoutGrid, Star, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

  const observerTarget = useRef(null);
  const scrollContainerRef = useRef(null);
  const heroRef = useRef(null);

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
      const response = await api.get('/api/dashboard/stats');
      if (response.data?.success) {
        setTrendingItems(response.data.data.topDishes || []);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
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
          // If offerFilter is a MongoDB ObjectId (24 hex chars), use offerId param
          // If it's a type string like 'bogo', 'combo', 'discount', use direct type params
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

  // 3D Tilt Effect Logic
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    
    const logo = heroRef.current.querySelector('.tilt-logo');
    if (logo) {
      logo.style.transform = `perspective(1000px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) translateZ(50px)`;
    }
  };

  const handleMouseLeave = () => {
    const logo = heroRef.current.querySelector('.tilt-logo');
    if (logo) {
      logo.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    }
  };

  if (loading && menus.length === 0 && categories.length === 0) {
    return <Loader fullPage={true} />;
  }

  const restaurantName = restaurantSettings?.restaurantDetails?.name || 'GUESTO RESTAURANT';

  return (
    <div className={`min-h-screen bg-background font-sans overflow-x-hidden ${theme}`}>
      {/* 3D Depth Hero Header */}
      <header 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full min-h-[40vh] md:min-h-[50vh] flex flex-col items-center justify-center overflow-hidden bg-[#050505] perspective-[1000px]"
      >
        {/* Modern 3D Layered Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-black"></div>
           {/* Floating Geometric Orbs */}
           <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-light/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
           
           {/* Subtle Line Pattern */}
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* 3D Tilt Logo Container */}
          <div className="tilt-logo transition-transform duration-200 ease-out preserve-3d mb-8 mt-4">
             <div className="relative group">
                {/* Glow Ring */}
                <div className="absolute inset-[-20%] bg-gradient-to-r from-primary/40 to-primary-light/40 blur-3xl rounded-full opacity-30 group-hover:opacity-60 transition-opacity animate-spin-slow"></div>
                
                <img 
                   src={restaurantSettings?.branding?.logoGold || "/logo-golden.png"} 
                   alt={restaurantName} 
                   className="h-28 md:h-40 w-auto object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform translate-z-10" 
                />
             </div>
          </div>
          
          <div className="space-y-6 max-w-3xl mx-auto transform translate-z-20">
            {/* Glass Slabs Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in">
               <div className="px-6 py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] md:text-xs font-black text-white/90 uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2 hover:bg-white/[0.08] transition-colors cursor-default">
                  <MapPin size={14} className="text-primary" /> 
                  <span>{restaurantSettings?.restaurantDetails?.address || 'Premium Dining'}</span>
               </div>
               <div className="px-6 py-2.5 bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-2xl text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(185,28,28,0.2)] flex items-center gap-2 animate-bounce-subtle">
                  <Sparkles size={14} /> 
                  Exclusive Menu
               </div>
            </div>

            {/* Elegant Tagline */}
            <div className="opacity-40 animate-fade-in" style={{ animationDelay: '0.3s' }}>
               <p className="text-[10px] font-black text-white uppercase tracking-[0.8em]">Discover Perfection</p>
            </div>
          </div>
        </div>

        {/* 3D Floor Shadow Effect */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20"></div>
      </header>

      <div className="relative z-30 bg-background rounded-t-[5rem] -mt-20 shadow-[0_-40px_100px_rgba(0,0,0,0.2)]">
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
          
          {/* Trending Slider with Controls */}
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

          {/* Sticky Search Container */}
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

      {/* Floating Dynamic Navbar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-[420px] md:hidden">
         <nav className="bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] px-5 py-4 shadow-[0_50px_150px_rgba(0,0,0,0.8)] flex items-center justify-center gap-4 transition-all">
            
            <button 
               onClick={() => setIsOffersModalOpen(true)}
               className="flex-1 flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-all group"
            >
               <div className="w-14 h-14 rounded-[2rem] bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Offers</span>
            </button>

            <button 
               onClick={() => {
                  const menuElement = document.getElementById('menu');
                  if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
               }}
               className="flex-[1.5] flex flex-col items-center gap-1.5 py-4 bg-primary rounded-[2.5rem] text-white shadow-[0_20px_40px_rgba(185,28,28,0.4)] transform -translate-y-6 scale-110 group transition-all"
            >
               <Utensils size={28} className="group-hover:rotate-12 transition-transform" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Full Menu</span>
            </button>

            <button 
               onClick={async () => {
                  try {
                     if (navigator.share) {
                        await navigator.share({
                           title: 'GuestO Digital Menu',
                           text: 'Check out our delicious menu!',
                           url: window.location.href,
                        });
                     } else {
                        await navigator.clipboard.writeText(window.location.href);
                        alert('Menu link copied to clipboard!');
                     }
                  } catch (error) {
                     console.error('Error sharing:', error);
                  }
               }}
               className="flex-1 flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-all group"
            >
               <div className="w-14 h-14 rounded-[2rem] bg-white/5 flex items-center justify-center group-hover:bg-status-available/20 group-hover:text-status-available transition-all">
                  <Share2 size={24} className="group-hover:scale-110 transition-transform" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Share</span>
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
        
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-10 { transform: translateZ(30px); }
        .translate-z-20 { transform: translateZ(50px); }

        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }

        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }

        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .snap-x { scroll-snap-type: x mandatory; }
        .snap-center { scroll-snap-align: center; }
      `}} />
    </div>
  );
};

export default DigitalMenu;
