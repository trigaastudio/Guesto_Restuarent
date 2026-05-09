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

  // Fetch cart from database on mount or when user changes
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(currentUser);

    if (currentUser) {
      fetchCart();
    } else {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      setLoading(false);
    }

    // Listen for manual refreshes (useful after login)
    const handleRefresh = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updatedUser);
      fetchCart();
    };

    window.addEventListener('cart-refresh', handleRefresh);
    return () => window.removeEventListener('cart-refresh', handleRefresh);
  }, []);

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
    const itemToAdd = { ...product, selectedSize, quantity: 1 };
    showToast(itemToAdd);

    // Optimistic UI update
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => 
        item._id === product._id && item.selectedSize === selectedSize
      );
      if (existingItem) {
        return prevItems.map((item) =>
          (item._id === product._id && item.selectedSize === selectedSize)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevItems, itemToAdd];
    });

    // Sync with database if logged in
    if (user) {
      try {
        await api.post('/api/cart', { menuItemId: product._id, quantity: 1, size: selectedSize });
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      // For guests, keep in localStorage
      setCartItems((currentItems) => {
        localStorage.setItem('cart', JSON.stringify(currentItems));
        return currentItems;
      });
    }
  };

  const removeFromCart = async (productId, size = null) => {
    // UI update
    setCartItems((prevItems) => {
      const updated = prevItems.filter((item) => !(item._id === productId && item.selectedSize === size));
      if (!user) localStorage.setItem('cart', JSON.stringify(updated));
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
      if (!user) localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await api.put(`/api/cart/${productId}`, { quantity, size });
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
        loading
      }}
    >
      {children}

      {/* Stunning Custom Toast */}
      {toast.show && (
        <div className="fixed top-8 right-4 md:right-8 z-[1000] animate-in slide-in-from-right-full duration-500">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-4 rounded-[2rem] flex items-center gap-4 min-w-[320px] max-w-[400px]">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-inner">
              <img src={toast.image || '/placeholder-food.jpg'} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#16A34A]">{toast.message}</span>
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
