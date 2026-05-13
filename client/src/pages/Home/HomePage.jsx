import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import api from '../../api/axiosInstance';
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

const heroImages = ['/heroSection/hero1.png', '/heroSection/hero2.png', '/heroSection/hero3.png', '/heroSection/hero4.png', '/heroSection/hero5.png'];


const HomePage = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const { addToCart, cartItems } = useCart();
  const { theme } = useTheme();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  // Listen for storage changes (useful if updated in another tab or component)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
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
        ? `/api/menus?page=${pageNum}&limit=6`
        : `/api/menus?category=${categoryId}&page=${pageNum}&limit=6`;

      const response = await api.get(url);

      if (pageNum === 1) {
        setMenus(response.data);
      } else {
        setMenus(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 6);
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
    navigate('/login', { replace: true });
  }, [navigate]);

  const filteredMenus = useMemo(() => {
    let result = menus.filter(menu => {
      const matchesSearch = menu.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
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
  }, [menus, debouncedSearchQuery, sortBy, dietaryFilter]);

  const getCategoryName = () => {
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

      {/* Weekend & Special Offers Banner */}
      <OffersCarousel 
        onOfferClick={(offer) => {
          // If it's a category offer, filter by category
          if (offer.applicableCategories?.length > 0) {
            handleCategoryChange(offer.applicableCategories[0]._id);
          } else {
            // Otherwise show all and let the filter handle tags (Future expansion)
            setSelectedCategory('all');
          }
          
          const menuElement = document.getElementById('menu');
          if (menuElement) {
            menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />

      <main className="max-w-7xl mx-auto px-6 py-0">
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

        <div className="pb-32">
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
