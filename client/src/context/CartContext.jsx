import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../api/axiosInstance';
import { showToast, showCartToast } from '../utils/sweetAlert';
import socket from '../services/socket';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [offers, setOffers] = useState([]);
  const pendingUpdatesRef = useRef({});

  useEffect(() => {
    fetchCart();
    fetchSettings();
    fetchOffers();

    // Socket Setup
    if (!socket.connected) socket.connect();

    socket.on('stockUpdate', ({ itemId, totalStock, isBlocked }) => {
      const receivedId = (itemId?._id || itemId || '').toString();
      setCartItems(prev => prev.map(item => {
        // Find the actual Menu Item ID in our flattened cart item structure
        const itemMenuId = (
          item.menuItemId || 
          (item.menuItem && (item.menuItem._id || item.menuItem)) || 
          item._id || 
          ''
        ).toString();

        if (itemMenuId === receivedId) {
          return { 
            ...item, 
            totalStock: totalStock !== undefined ? totalStock : item.totalStock,
            isBlocked: isBlocked !== undefined ? isBlocked : item.isBlocked
          };
        }
        return item;
      }));
    });

    socket.on('offerUpdate', () => {
      fetchOffers();
    });
    
    socket.on('settingsUpdate', (newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
      } else {
        fetchSettings();
      }
    });

    return () => {
      socket.off('stockUpdate');
      socket.off('offerUpdate');
      socket.off('settingsUpdate');
      if (pendingUpdatesRef.current) {
        Object.values(pendingUpdatesRef.current).forEach(clearTimeout);
      }
    };
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      if (response.data.success) {
        setCartItems(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchOffers = async () => {
    try {
      const response = await api.get('/api/offers?activeOnly=true');
      if (response.data.success) {
        setOffers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const addToCart = async (menuItem, quantity, selectedSize) => {
    try {
      const response = await api.post('/api/cart', {
        menuItemId: menuItem._id,
        quantity,
        selectedSize
      });
      if (response.data.success) {
        setCartItems(response.data.data.items);
        showCartToast(menuItem);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to add item');
    }
  };

  const removeFromCart = useCallback(async (id) => {
    if (pendingUpdatesRef.current[id]) {
      clearTimeout(pendingUpdatesRef.current[id]);
      delete pendingUpdatesRef.current[id];
    }
    try {
      const response = await api.delete(`/api/cart/${id}`);
      if (response.data.success) {
        setCartItems(response.data.data.items);
      }
    } catch (error) {
      showToast('error', 'Failed to remove item');
    }
  }, []);

  const updateQuantity = useCallback(async (id, quantity) => {
    if (quantity < 1) {
      return removeFromCart(id);
    }

    // Optimistically update the UI state immediately
    setCartItems(prev => prev.map(item => item._id === id ? { ...item, quantity } : item));

    // Clear existing timeout for this item if any
    if (pendingUpdatesRef.current[id]) {
      clearTimeout(pendingUpdatesRef.current[id]);
    }

    // Set a new timeout to sync with backend
    pendingUpdatesRef.current[id] = setTimeout(async () => {
      try {
        const response = await api.put(`/api/cart/${id}`, { quantity });
        if (response.data.success) {
          // Sync with the actual database response in case other things changed
          setCartItems(response.data.data.items);
        }
      } catch (error) {
        showToast('error', 'Failed to update quantity');
        // Fetch cart to revert to correct state on error
        fetchCart();
      } finally {
        delete pendingUpdatesRef.current[id];
      }
    }, 400); // 400ms debounce time
  }, [removeFromCart]);

  const clearCart = async () => {
    try {
      await api.delete('/api/cart');
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const checkStoreStatus = useCallback(() => {
    if (!settings?.operationalSettings) return { isOpen: true };
    const { isStoreOpen, isHolidayMode, businessHours } = settings.operationalSettings;
    
    if (isHolidayMode) return { isOpen: false, reason: 'holiday' };
    if (isStoreOpen === false) return { isOpen: false, reason: 'manual_close' };

    // BULLETPROOF IST CALCULATION (UTC + 5:30)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (330 * 60000));

    const day = istDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if today is a closed day
    const closedDays = businessHours?.closedDays || [];
    const isClosedToday = closedDays.some(d => d.toLowerCase() === day.toLowerCase());
    if (isClosedToday) {
      return { isOpen: false, reason: 'closed_day' };
    }

    if (businessHours?.open && businessHours?.close) {
      // Robust Time Parsing (Handles "11:00", "11.00", etc.)
      const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.replace('.', ':').split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
      };

      // Format HH:mm string to 12-hour AM/PM format
      const format12Hour = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.replace('.', ':').split(':');
        let h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        const mStr = m < 10 ? `0${m}` : m;
        return `${h}:${mStr} ${ampm}`;
      };

      const currentTime = istDate.getHours() * 60 + istDate.getMinutes();
      const openMinutes = parseTime(businessHours.open);
      const closeMinutes = parseTime(businessHours.close);

      let isStoreCurrentlyOpen = true;
      let reason = '';

      if (closeMinutes < openMinutes) {
        // CROSSES MIDNIGHT (e.g. 11:00 AM to 12:57 AM the next morning)
        if (currentTime >= openMinutes || currentTime <= closeMinutes) {
          isStoreCurrentlyOpen = true;
        } else {
          isStoreCurrentlyOpen = false;
          reason = `We open at ${format12Hour(businessHours.open)}`;
        }
      } else {
        // DOES NOT CROSS MIDNIGHT (e.g. 09:00 AM to 10:00 PM)
        if (currentTime >= openMinutes && currentTime <= closeMinutes) {
          isStoreCurrentlyOpen = true;
        } else {
          isStoreCurrentlyOpen = false;
          if (currentTime < openMinutes) {
            reason = `We open at ${format12Hour(businessHours.open)}`;
          } else {
            reason = `We closed at ${format12Hour(businessHours.close)}`;
          }
        }
      }

      if (!isStoreCurrentlyOpen) {
        return { isOpen: false, reason };
      }
    }

    return { isOpen: true };
  }, [settings]);

  // --- ADVANCED OFFER CALCULATION ---
  const subtotal = useMemo(() => {
    let totalSubtotal = 0;

    cartItems.forEach(item => {
      // Find base price from variants or fallback fields
      const variantPrice = (item.variants || item.sizes || []).find(v => v.size === item.selectedSize)?.price;
      const basePrice = variantPrice || item.offerPrice || item.price || 0;

      if (item.isCombo) {
        totalSubtotal += basePrice * item.quantity;
        return;
      }

      // Check for Item/Category Discount
      const menuDiscount = item.menuItem?.discountPercentage || item.discountPercentage || 0;
      const categoryDiscount = item.menuItem?.category?.discountPercentage || item.category?.discountPercentage || 0;
      const maxDiscountPercent = Math.max(menuDiscount, categoryDiscount);

      if (maxDiscountPercent > 0) {
        const discountedPrice = basePrice * (1 - maxDiscountPercent / 100);
        totalSubtotal += item.quantity * discountedPrice;
      } else {
        totalSubtotal += item.quantity * basePrice;
      }
    });

    return Math.round(totalSubtotal);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart, clearCart,
      subtotal, loading, settings, checkStoreStatus, offers
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
