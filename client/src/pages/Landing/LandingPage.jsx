import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../Home/HomePage.css'; // Reuse HomePage styles
import api from '../../api/axiosInstance';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import HeroSection from '../../components/Hero/HeroSection';
import CategorySection from '../../components/Category/CategorySection';
import MenuSection from '../../components/Menu/MenuSection';
import MenuModal from '../../components/Menu/MenuModal';
import { useCart } from '../../context/CartContext';

const heroImages = ['/heroSection/hero1.png', '/heroSection/hero2.png', '/heroSection/hero3.png', '/heroSection/hero4.png'];

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
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

  const observerTarget = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "GuestO | Premium Dining Experience";
    fetchTrendingDishes();
    fetchCategories();
    fetchMenus(1, true);
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

  const fetchMenus = useCallback(async (pageNum = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get('/api/menus', {
        params: {
          page: pageNum,
          limit: 10,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: debouncedSearchQuery || undefined,
          foodType: dietaryFilter !== 'all' ? dietaryFilter : undefined,
          sort: sortBy !== 'default' ? sortBy : undefined
        }
      });

      const newMenus = response.data;
      if (isInitial) {
        setMenus(newMenus);
      } else {
        setMenus(prev => [...prev, ...newMenus]);
      }
      setHasMore(newMenus.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, dietaryFilter, sortBy]);

  useEffect(() => {
    fetchMenus(1, true);
  }, [selectedCategory, searchQuery, dietaryFilter, sortBy]);

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

  const filteredMenus = useMemo(() => {
    return menus;
  }, [menus]);

  // Action for public users: Redirect to login
  const handlePublicAction = () => {
    navigate('/login');
  };

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const { cartItems } = useCart();

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
    window.location.replace('/login');
  };

  return (
    <div className={`min-h-screen bg-background font-sans select-none overflow-x-hidden ${theme}`}>
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
          hideCart={true} 
        />
        
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          navigate={navigate}
          heroImages={heroImages}
          trendingItems={trendingItems}
        />
      </div>

      <div className="relative z-10 bg-background rounded-t-[3rem] -mt-12 md:-mt-20">
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
            />
          </div>
        </main>
      </div>

      <Footer />

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menu={selectedMenu}
        onAction={handlePublicAction}
      />
    </div>
  );
};

export default LandingPage;
