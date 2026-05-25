import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import api from '../../api/axiosInstance';
import { logoutAdmin, logoutToLanding } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import HeroSection from '../../components/Hero/HeroSection';
import CategorySection from '../../components/Category/CategorySection';
import MenuSection from '../../components/Menu/MenuSection';
import MenuModal from '../../components/Menu/MenuModal';
import StoreStatusBanner from '../../components/StoreStatus/StoreStatusBanner';
import Loader from '../../components/Loader/Loader';
import OffersCarousel from '../../components/Offers/OffersCarousel';
import socket from '../../services/socket';
import { getEffectiveStock } from '../../utils/stockHelpers';
import { Sparkles, X, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

const heroImages = ['/heroSection/hero1.png', '/heroSection/hero2.png', '/heroSection/hero3.png', '/heroSection/hero4.png', '/heroSection/hero5.png'];


const HomePage = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [isFirstVisit] = useState(() => !sessionStorage.getItem('home_visited'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [offerFilter, setOfferFilter] = useState(null); // null | 'bogo' | 'combo' | 'discount' | mongoId
  const [offerName, setOfferName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
  const scrollContainerRef = useRef(null);

  const scrollTrending = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const { addToCart, cartItems, checkStoreStatus } = useCart();
  const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
  const isClosed = !storeStatus.isOpen;
  const { theme } = useTheme();
  // Staff are intentionally excluded from the customer website context
  const [user, setUser] = useState(() => JSON.parse(
    localStorage.getItem('user') || 
    localStorage.getItem('admin_user') || 
    '{}'
  ));

  // Listen for storage changes (useful if updated in another tab or component)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(
        localStorage.getItem('user') || 
        localStorage.getItem('admin_user') || 
        '{}'
      ));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    document.title = "GuestO | Fresh & Delicious";
    window.scrollTo(0, 0);
    fetchCategories();
    fetchMenus();
    fetchTrendingDishes();
    sessionStorage.setItem('home_visited', 'true');

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Socket Setup
    if (!socket.connected) socket.connect();

    socket.on('stockUpdate', ({ itemId, totalStock, isBlocked }) => {
      const receivedId = (itemId?._id || itemId || '').toString();
      setMenus(prev => prev.map(menu => {
        if (menu._id.toString() === receivedId) {
          return {
            ...menu,
            totalStock: totalStock !== undefined ? totalStock : menu.totalStock,
            isBlocked: isBlocked !== undefined ? isBlocked : menu.isBlocked
          };
        }
        return menu;
      }));

      setSelectedMenuForModal(prev => {
        if (prev && prev._id.toString() === receivedId) {
          return {
            ...prev,
            totalStock: totalStock !== undefined ? totalStock : prev.totalStock,
            isBlocked: isBlocked !== undefined ? isBlocked : prev.isBlocked
          };
        }
        return prev;
      });
    });

    socket.on('categoryStockUpdate', ({ categoryId, totalStock }) => {
      setMenus(prev => prev.map(menu => {
        if (menu.category && menu.category._id.toString() === categoryId.toString() && menu.category.isSharedStock) {
          return {
            ...menu,
            category: {
              ...menu.category,
              totalStock: totalStock
            }
          };
        }
        return menu;
      }));

      setSelectedMenuForModal(prev => {
        if (prev && prev.category && prev.category._id.toString() === categoryId.toString() && prev.category.isSharedStock) {
          return {
            ...prev,
            category: {
              ...prev.category,
              totalStock: totalStock
            }
          };
        }
        return prev;
      });
    });

    socket.on('categoryUpdate', () => {
      fetchCategories();
      fetchMenus();
    });

    socket.on('offerUpdate', () => {
      fetchMenus();
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socket.off('stockUpdate');
      socket.off('categoryStockUpdate');
      socket.off('categoryUpdate');
      socket.off('offerUpdate');
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTrendingDishes = useCallback(async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      if (response.data && response.data.success) {
        setTrendingItems(response.data.data.topDishes || []);
      }
    } catch (error) {
      console.error('Error fetching trending dishes:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.filter(cat => cat.isActive !== false));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchMenus = useCallback(async (pageNum = 1, filterOverride = offerFilter) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 10,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: debouncedSearchQuery || undefined,
        dietary: dietaryFilter !== 'all' ? dietaryFilter : undefined,
        sortBy: sortBy !== 'default' ? sortBy : undefined,
        offerId: filterOverride && filterOverride.length === 24 ? filterOverride : undefined,
        bogo: filterOverride === 'bogo' ? 'true' : undefined,
        combo: filterOverride === 'combo' ? 'true' : undefined,
        discount: filterOverride === 'discount' ? 'true' : undefined,
      };

      const response = await api.get('/api/menus', { params });

      if (pageNum === 1) {
        setMenus(response.data);
      } else {
        setMenus(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, debouncedSearchQuery, dietaryFilter, sortBy, offerFilter]);

  useEffect(() => {
    fetchMenus(1, offerFilter);
  }, [selectedCategory, debouncedSearchQuery, dietaryFilter, sortBy, offerFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMenus(page + 1, offerFilter);
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

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    setOfferFilter(null);
    setOfferName('');
    setPage(1);
    setHasMore(true);
  }, []);

  const handlePromoFilterToggle = useCallback((type, label) => {
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
  }, [offerFilter]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory('all');
    setOfferFilter(null);
    setOfferName('');
    setSortBy('default');
    setDietaryFilter('all');
    setSearchQuery('');
    setPage(1);
    setHasMore(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_notifications');
    localStorage.removeItem('dineInTableId');
    localStorage.removeItem('dineInTableNumber');
    
    window.location.href = '/';
  };

  const filteredMenus = useMemo(() => {
    // We moved most filtering to the backend, but we filter blocked items locally
    // so that websocket updates can instantly hide them without a refresh.
    return menus.filter(menu => !menu.isBlocked);
  }, [menus]);

  const getCategoryName = () => {
    if (offerFilter === 'bogo') return 'BOGO Offers';
    if (offerFilter === 'combo') return 'Special Combos';
    if (offerFilter === 'discount') return 'Discounted Items';
    if (offerFilter && offerFilter.length === 24) return offerName || 'Special Offer';
    if (selectedCategory === 'all') return 'All Dishes';
    const cat = categories.find(c => c._id === selectedCategory);
    return cat ? cat.name : 'Dishes';
  };

  const logoSrc = theme === 'dark' ? "/logo-golden.png" : "/logo-dark.png";

  if (loading && menus.length === 0 && categories.length === 0) {
    return <Loader fullPage={true} />;
  }

  return (
    <div className={`min-h-screen bg-background font-sans ${theme}`}>
      <div className="relative w-full overflow-hidden flex flex-col bg-[#B91C1C]">
        <div className="absolute inset-0 z-0 bg-[#B91C1C]"></div>

        <StoreStatusBanner />

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
          trendingItems={trendingItems}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-0">
        <div className="mb-12">
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

        {/* Most Loved Dishes Slider */}
        {trendingItems.length > 0 && (
          <div className="mb-20 relative group/slider mt-12">
            <div className="flex items-center justify-between mb-8 px-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Flame size={24} className="text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-text-primary tracking-tighter">
                    Most Loved <span className="text-primary italic">Dishes</span>
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60 ml-14">Most loved by our community</p>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => scrollTrending('left')}
                  className="p-3 bg-background-muted border border-border/10 rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scrollTrending('right')}
                  className="p-3 bg-background-muted border border-border/10 rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto no-scrollbar gap-6 px-6 pb-6 snap-x"
            >
              {trendingItems.filter(item => !item.isBlocked).map((item, idx) => {
                const isComboOutOfStock = item.isCombo && item.comboItems?.length > 0 && item.comboItems.some(ci => {
                  const subItem = ci.menuItem;
                  return !subItem || subItem.isBlocked || getEffectiveStock(subItem) <= 0;
                });
                const isItemOutOfStock = (item.isCombo ? false : (getEffectiveStock(item) <= 0)) || isClosed || !!isComboOutOfStock;
                return (
                  <div
                    key={idx}
                    onClick={() => { if (!isItemOutOfStock) { setSelectedMenuForModal(item); setIsModalOpen(true); } }}
                    className={`flex-shrink-0 w-[200px] md:w-[260px] bg-background-muted rounded-[2rem] p-4 border border-border/5 shadow-xl transition-all duration-500 group snap-center relative overflow-hidden ${isItemOutOfStock
                        ? 'grayscale opacity-60 pointer-events-none'
                        : 'hover:shadow-[0_20px_50px_rgba(185,28,28,0.1)] cursor-pointer'
                      }`}
                  >
                    <div className="relative h-40 md:h-48 rounded-[1.5rem] overflow-hidden mb-4">
                      <img
                        src={item.image || '/placeholder-food.jpg'}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ${isClosed ? 'grayscale brightness-50' : ''}`}
                      />
                      {isItemOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20">
                          <span className="bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl border border-black/10">
                            {isClosed ? 'Closed' : 'Out of Stock'}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const menuDiscount = item.discountPercentage || 0;
                        const cat = categories.find(c => c._id === item.category);
                        const categoryDiscount = cat?.discountPercentage || 0;
                        const maxDiscountPercent = Math.max(menuDiscount, categoryDiscount);
                        return maxDiscountPercent > 0 && !item.isCombo && !isItemOutOfStock ? (
                          <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg z-10">
                            {`${maxDiscountPercent}% OFF`}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="px-1">
                      <h3 className="text-base font-black text-text-primary mb-2 group-hover:text-primary transition-colors truncate">{item.name}</h3>
                      <div className="flex items-center justify-between border-t border-border/10 pt-3">
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
                                <span className="text-[9px] text-text-muted line-through opacity-60">
                                  ₹{Math.round(originalPrice)}
                                </span>
                              )}
                              <span className="text-lg font-black text-text-primary">
                                ₹{Math.round(discountedPrice)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategoryChange={(id) => {
            handleCategoryChange(id);
            const menuElement = document.getElementById('menu');
            if (menuElement) {
              menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
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

        <div className="pb-32">
          <MenuSection
            title={getCategoryName()}
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
            selectedCategory={selectedCategory}
            offerFilter={offerFilter}
            handlePromoFilterToggle={handlePromoFilterToggle}
            searchQuery={searchQuery}
            onClearAll={clearAllFilters}
            onAddClick={(menu) => {
              setSelectedMenuForModal(menu);
              setIsModalOpen(true);
            }}
          />
        </div>
      </main>

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menu={selectedMenuForModal}
        onAction={addToCart}
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
