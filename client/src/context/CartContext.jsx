import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true); // Start as true to prevent flash
  // Use a state for user to trigger re-renders
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [toast, setToast] = useState({ show: false, message: '', productName: '', image: '' });
  const [settings, setSettings] = useState(null);

  // Fetch cart and settings on mount
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(currentUser);

    // Baseline load from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    fetchSettings();

    if (currentUser) {
      fetchCart();
    } else {
      setLoading(false);
    }

    // Listen for manual refreshes (useful after login)
    const handleRefresh = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updatedUser);
      fetchCart();
      fetchSettings();
    };

    window.addEventListener('cart-refresh', handleRefresh);

    // Auto-poll settings every 60 seconds so store status updates without refresh
    const settingsInterval = setInterval(() => {
      fetchSettings();
    }, 60 * 1000);

    return () => {
      window.removeEventListener('cart-refresh', handleRefresh);
      clearInterval(settingsInterval);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const checkStoreStatus = () => {
    if (!settings) return { isOpen: true }; // Default to open if settings not loaded yet

    const { isStoreOpen, isHolidayMode, isBusyMode, businessHours } = settings.operationalSettings || {};

    // 1. Manual close by admin
    if (isStoreOpen === false) {
      return { isOpen: false, reason: 'manual_close', message: 'We are currently closed. Please check back later.' };
    }

    // 2. Holiday mode
    if (isHolidayMode) {
      return { isOpen: false, reason: 'holiday', message: 'We are closed for the holidays. See you soon!' };
    }

    // 3. Business hours check (Forcing Indian Standard Time - IST)
    if (businessHours) {
      // Get current time in IST (Asia/Kolkata) using Intl.DateTimeFormat for maximum reliability
      const now = new Date();
      const istOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'long' };
      const istString = new Intl.DateTimeFormat('en-US', istOptions).format(now);
      
      // format: "Monday, 17:59" or "17:59" (depends on locale, but let's use parts for safety)
      const parts = new Intl.DateTimeFormat('en-US', istOptions).formatToParts(now);
      const istHour = parseInt(parts.find(p => p.type === 'hour').value);
      const istMinute = parseInt(parts.find(p => p.type === 'minute').value);
      const currentDay = parts.find(p => p.type === 'weekday').value;

      // Check closed days
      if (businessHours.closedDays?.includes(currentDay)) {
        return { isOpen: false, reason: 'closed_day', message: `We are closed on ${currentDay}s. See you tomorrow!` };
      }

      // Check opening/closing time
      const currentTime = istHour * 60 + istMinute;
      const [openH, openM] = (businessHours.open || '00:00').split(':').map(Number);
      const [closeH, closeM] = (businessHours.close || '23:59').split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      let isInsideHours = false;
      if (closeTime > openTime) {
        // Standard same-day hours (e.g., 09:00 to 22:00)
        isInsideHours = currentTime >= openTime && currentTime <= closeTime;
      } else {
        // Overnight hours (e.g., 11:00 to 00:31)
        isInsideHours = currentTime >= openTime || currentTime <= closeTime;
      }

      if (!isInsideHours) {
        return {
          isOpen: false,
          reason: 'outside_hours',
          message: `We're closed right now. We open at ${businessHours.open} and close at ${businessHours.close} (IST).`
        };
      }
    }

    // 4. Busy mode (store is open but adding extra info)
    if (isBusyMode) {
      return { isOpen: true, isBusy: true };
    }

    return { isOpen: true };
  };

  const fetchCart = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await api.get('/api/cart');
      if (response.data.success) {
        setCartItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (product) => {
    setToast({
      show: true,
      message: 'Menu added successfully!',
      productName: product.name,
      image: product.image
    });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 1000);
  };

  const addToCart = async (product, selectedSize = null) => {
    const storeStatus = checkStoreStatus();
    if (!storeStatus.isOpen) {
      setToast({
        show: true,
        message: storeStatus.message,
        productName: 'Store Closed',
        image: ''
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
      return;
    }

    const itemToAdd = { ...product, selectedSize, quantity: 1 };
    showToast(itemToAdd);

    // Optimistic UI update
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => 
        item._id === product._id && item.selectedSize === selectedSize
      );
      let updated;
      if (existingItem) {
        updated = prevItems.map((item) =>
          (item._id === product._id && item.selectedSize === selectedSize)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        updated = [...prevItems, itemToAdd];
      }
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });

    // Sync with database if logged in
    if (user) {
      try {
        const response = await api.post('/api/cart', { menuItemId: product._id, quantity: 1, size: selectedSize });
        if (response.data.success) {
          const updatedItems = response.data.data;
          setCartItems(updatedItems);
          localStorage.setItem('cart', JSON.stringify(updatedItems));
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      localStorage.setItem('cart', JSON.stringify([...cartItems])); // This is handled by optimistic update now
    }
  };

  const removeFromCart = async (productId, size = null) => {
    // UI update
    setCartItems((prevItems) => {
      const updated = prevItems.filter((item) => !(item._id === productId && item.selectedSize === size));
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await api.delete(`/api/cart/${productId}?size=${size || ''}`);
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }
  };

  const updateQuantity = async (productId, quantity, size = null) => {
    if (quantity < 1) return removeFromCart(productId, size);

    // UI update
    setCartItems((prevItems) => {
      const updated = prevItems.map((item) =>
        (item._id === productId && item.selectedSize === size) ? { ...item, quantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        const response = await api.put(`/api/cart/${productId}`, { quantity, size });
        if (response.data.success) {
          setCartItems(response.data.data);
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      try {
        await api.delete('/api/cart');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else {
      localStorage.removeItem('cart');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const variants = item.variants || item.sizes || [];
    const sizeData = variants.find(v => v.size === item.selectedSize);
    const price = sizeData ? sizeData.price : (item.offerPrice || 0);
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        loading,
        settings,
        checkStoreStatus
      }}
    >
      {children}

      {/* Stunning Custom Toast */}
      {toast.show && (
        <div className="fixed top-8 right-4 md:right-8 z-[1000] animate-in slide-in-from-right-full duration-500">
          <div className="bg-background-card/80 backdrop-blur-2xl border border-border/40 shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-4 rounded-[2rem] flex items-center gap-4 min-w-[320px] max-w-[400px]">
            {toast.image && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-background-muted flex-shrink-0 shadow-inner border border-border/40">
                <img src={toast.image || '/placeholder-food.jpg'} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">{toast.message}</span>
              </div>
              <p className="font-black text-text-primary text-sm truncate uppercase tracking-tight">{toast.productName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DA9133] flex items-center justify-center text-white shadow-lg shadow-[#DA9133]/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-6 right-14 h-1 bg-[#DA9133]/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#DA9133] animate-[progress_1s_linear_forwards]"></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </CartContext.Provider>
  );
};
