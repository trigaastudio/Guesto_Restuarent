import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../Home/HomePage.css';
import api from '../../api/axiosInstance';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import HeroSection from '../../components/Hero/HeroSection';
import CategorySection from '../../components/Category/CategorySection';
import MenuSection from '../../components/Menu/MenuSection';
import MenuModal from '../../components/Menu/MenuModal';
import { useCart } from '../../context/CartContext';
import PageSkeleton from '../../components/Skeleton/PageSkeleton';
import OffersCarousel from '../../components/Offers/OffersCarousel';
import StoreStatusBanner from '../../components/StoreStatus/StoreStatusBanner';
import { Sparkles, X, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { logoutAdmin, logoutStaff, logoutToLanding } from '../../utils/auth';
import { getEffectiveStock } from '../../utils/stockHelpers';

const heroImages = ['/heroSection/hero1.png', '/heroSection/hero2.png', '/heroSection/hero3.png', '/heroSection/hero4.png', '/heroSection/hero5.png'];

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [offerFilter, setOfferFilter] = useState(null);
  const [offerName, setOfferName] = useState('');
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

  const observerTarget = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollTrending = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }


  }, [navigate]);

  useEffect(() => {
    document.title = "GuestO | Premium Dining Experience";
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      window.scrollTo(0, 0);
    }
    fetchTrendingDishes();
    fetchCategories();
    fetchMenus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTrendingDishes = async () => {
    try {
      const response = await api.get('/api/menus/top-selling');
      if (response.data && response.data.success) {
        setTrendingItems(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching top-selling dishes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.filter(cat => cat.isActive !== false));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMenus = async (pageNum = 1, filterOverride = offerFilter) => {
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
  };

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

  const filteredMenus = useMemo(() => {
    // We moved most filtering to the backend, but we filter blocked items locally
    // so that websocket updates can instantly hide them without a refresh.
    return menus.filter(menu => !menu.isBlocked);
  }, [menus]);

  // Action for public users: Redirect to login. If admin is previewing, redirect to home.
  const handlePublicAction = () => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);


  const user = JSON.parse(
    localStorage.getItem('user') ||
    localStorage.getItem('admin_user') ||
    'null'
  );
  const { cartItems, checkStoreStatus } = useCart();
  const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
  const isClosed = !storeStatus.isOpen;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  if (loading && menus.length === 0 && categories.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className={`min-h-screen bg-background font-sans overflow-x-hidden ${theme}`}>
      <div className="relative w-full overflow-hidden flex flex-col bg-[#B91C1C]">
        <div className="absolute inset-0 z-0 bg-[#B91C1C]"></div>
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 -mt-6 sm:-mt-10 md:-mt-36 lg:-mt-40 pb-0 w-full">
        <div className="mb-12">
            <OffersCarousel
              onOfferClick={(offer) => {
                setSelectedCategory('all');
                setOfferFilter(offer.offerType);
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

          { }
          {trendingItems.length > 0 && (
            <div className="mb-0 relative group/slider mt-12 w-full">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 md:bg-white/20 rounded-2xl flex items-center justify-center">
                      <Flame size={24} className="text-primary md:text-white animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-text-primary md:text-white tracking-tighter">
                      Most Loved <span className="text-primary md:text-white/90 italic">Dishes</span>
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-text-muted md:text-white/80 uppercase tracking-widest opacity-60 md:opacity-100 ml-14">Most loved by our community</p>
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
                className="flex overflow-x-auto no-scrollbar gap-4 sm:gap-6 pb-6 snap-x w-full"
              >
                {trendingItems.filter(item => !item.isBlocked).map((item, idx) => {
                  const isItemOutOfStock = getEffectiveStock(item) < 1 || isClosed;
                  return (
                    <div
                      key={idx}
                      onClick={() => { if (!isItemOutOfStock) { setSelectedMenu(item); setIsModalOpen(true); } }}
                      className={`flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(25%-1rem)] lg:w-[calc(20%-1.2rem)] bg-background-card rounded-[1.25rem] p-2.5 border border-border/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 group snap-start relative overflow-hidden flex flex-col ${isItemOutOfStock
                        ? 'grayscale opacity-60 pointer-events-none'
                        : 'hover:shadow-[0_20px_50px_rgba(185,28,28,0.15)] hover:-translate-y-1 cursor-pointer'
                        }`}
                    >
                      <div className="relative h-[28vw] max-h-[110px] md:max-h-none md:h-32 rounded-xl overflow-hidden mb-2 bg-background-muted flex-shrink-0">
                        <img
                          src={item.image || '/placeholder-food.jpg'}
                          alt={item.name}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${isClosed ? 'grayscale brightness-50' : ''}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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

                          if (maxDiscountPercent > 0 && !item.isCombo && !isItemOutOfStock) {
                            return (
                              <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg z-10 animate-bounce-slow">
                                {`${maxDiscountPercent}% OFF`}
                              </div>
                            );
                          }
                          if (item.isCombo && !isItemOutOfStock) {
                            return (
                              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg z-10 uppercase tracking-wider">
                                Combo Deal
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <div className="px-1.5 flex flex-col flex-1 pb-1">
                        <h3 className="text-[10px] md:text-xs font-black text-text-primary mb-0.5 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{item.name}</h3>
                        <p className="text-[9px] font-medium text-text-muted opacity-80 line-clamp-1 mb-0.5">{item.description || "A delicious favorite from our menu."}</p>
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
              loading={loading}
              filteredMenus={filteredMenus}
              sortBy={sortBy}
              setSortBy={setSortBy}
              dietaryFilter={dietaryFilter}
              setDietaryFilter={setDietaryFilter}
              setSearchQuery={setSearchQuery}
              observerTarget={observerTarget}
              hasMore={hasMore}
              loadingMore={loadingMore}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              offerFilter={offerFilter}
              handlePromoFilterToggle={handlePromoFilterToggle}
              onClearAll={clearAllFilters}
              hideNameSort={true}
              onAddClick={(menu) => {
                setSelectedMenu(menu);
                setIsModalOpen(true);
              }}
            />
          </div>
        </main>

      <Footer />

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menu={selectedMenu}
        onAction={handlePublicAction}
      />
      <StoreStatusBanner />
    </div>
  );
};

export default LandingPage;
