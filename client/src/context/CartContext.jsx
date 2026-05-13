import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axiosInstance';
import { showToast } from '../utils/sweetAlert';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchCart();
    fetchSettings();
    fetchOffers();
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
        showToast('success', 'Added to Feast');
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to add item');
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      return removeFromCart(id);
    }
    try {
      const response = await api.put(`/api/cart/${id}`, {
        quantity
      });
      if (response.data.success) {
        setCartItems(response.data.data.items);
      }
    } catch (error) {
      showToast('error', 'Failed to update quantity');
    }
  };

  const removeFromCart = async (id) => {
    try {
      const response = await api.delete(`/api/cart/${id}`);
      if (response.data.success) {
        setCartItems(response.data.data.items);
        showToast('success', 'Removed from Feast');
      }
    } catch (error) {
      showToast('error', 'Failed to remove item');
    }
  };

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
    const { isAlwaysOpen, manualClose, storeHours } = settings.operationalSettings;
    if (manualClose) return { isOpen: false, reason: 'Store is temporarily closed' };
    if (isAlwaysOpen) return { isOpen: true };

    // BULLETPROOF IST CALCULATION (UTC + 5:30)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (330 * 60000));

    const day = istDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check both "Tuesday" and "tuesday" for safety
    const hours = storeHours?.[day] || storeHours?.[day.toLowerCase()];

    // If hours are missing for this day, we'll assume open to prevent accidental lockouts
    if (hours && !hours.isOpen) return { isOpen: false, reason: `Closed on ${day}` };
    if (!hours) return { isOpen: true };

    // Robust Time Parsing (Handles "11:00", "11.00", etc.)
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.replace('.', ':').split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    };

    const currentTime = istDate.getHours() * 60 + istDate.getMinutes();
    const openMinutes = parseTime(hours.openTime);
    const closeMinutes = parseTime(hours.closeTime);

    if (currentTime < openMinutes) {
      return { isOpen: false, reason: `We open at ${hours.openTime}` };
    }

    if (currentTime > closeMinutes) {
      return { isOpen: false, reason: `We are closed for today` };
    }

    return { isOpen: true };
  }, [settings]);

  // --- ADVANCED OFFER CALCULATION ---
  const subtotal = useMemo(() => {
    let tempItems = cartItems.map(item => {
      // Find base price from variants or fallback fields
      const variantPrice = (item.variants || item.sizes || []).find(v => v.size === item.selectedSize)?.price;
      const basePrice = variantPrice || item.offerPrice || item.price || 0;

      return {
        ...item,
        originalPrice: basePrice,
        remainingQty: item.quantity
      };
    });

    let totalSubtotal = 0;
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (330 * 60000));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[istDate.getDay()];

    // Offer calculation logs removed for professional console output

    const activeOffers = offers.filter(o => {
      if (!o.isActive) return false;

      const normalizedToday = today.toLowerCase();
      const specificDays = (o.specificDays || []).map(d => d.toLowerCase());

      if (o.isWeekendOnly && !['saturday', 'sunday'].includes(normalizedToday)) return false;
      if (specificDays.length > 0 && !specificDays.includes(normalizedToday)) return false;
      return true;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Active offers logging removed

    // 1. PROCESS COMBOS (Bundle Percent Discount)
    activeOffers.filter(o => o.offerType === 'combo').forEach(offer => {
      const bundleItems = offer.applicableItems || [];
      if (bundleItems.length === 0) return;

      // Combo checking log removed

      // Aggregate requirements for this bundle (in case same item is listed twice with same size)
      const requirements = {};
      bundleItems.forEach(b => {
        const id = (b.menuItem?._id || b.menuItem || '').toString().toLowerCase();
        if (!id) return; // Skip invalid entries
        const size = (b.selectedSize || '').toString().toLowerCase();
        const key = `${id}-${size}`;
        requirements[key] = (requirements[key] || 0) + (b.quantity || 1);
      });

      let possibleCombos = Infinity;
      Object.keys(requirements).forEach(key => {
        const [id, size] = key.split('-');
        const needed = requirements[key];
        const cartItem = tempItems.find(i => {
          const itemId = (i.menuItemId || i.menuItem?._id || i._id || i.id || '').toString().toLowerCase();
          const itemSize = (i.selectedSize || '').toString().toLowerCase();
          return itemId === id && (size === '' || itemSize === size);
        });

        if (!cartItem) {
          possibleCombos = 0;
        } else {
          possibleCombos = Math.min(possibleCombos, Math.floor(cartItem.remainingQty / needed));
        }
      });

      if (possibleCombos > 0 && possibleCombos !== Infinity) {
        // Combo application log removed
        let bundleBasePrice = 0;
        
        // Calculate original price of ONE bundle
        Object.keys(requirements).forEach(key => {
          const [id, size] = key.split('-');
          const needed = requirements[key];
          const cartItem = tempItems.find(i => {
            const itemId = (i.menuItemId || i.menuItem?._id || i._id || i.id || '').toString().toLowerCase();
            const itemSize = (i.selectedSize || '').toString().toLowerCase();
            return itemId === id && (size === '' || itemSize === size);
          });
          bundleBasePrice += (cartItem.originalPrice || 0) * needed;
        });

        const discountPercent = Math.min(100, Math.max(0, parseFloat(offer.offerValue || 0)));
        const discountedBundlePrice = bundleBasePrice * (1 - discountPercent / 100);
        
        totalSubtotal += possibleCombos * discountedBundlePrice;

        // Consume quantities
        Object.keys(requirements).forEach(key => {
          const [id, size] = key.split('-');
          const needed = requirements[key];
          const cartItem = tempItems.find(i => {
            const itemId = (i.menuItemId || i.menuItem?._id || i._id || i.id || '').toString().toLowerCase();
            const itemSize = (i.selectedSize || '').toString().toLowerCase();
            return itemId === id && (size === '' || itemSize === size);
          });
          cartItem.remainingQty -= (possibleCombos * needed);
        });
      }
    });

    // 2. PROCESS REMAINING ITEMS (BOGO & DISCOUNTS)
    tempItems.forEach(item => {
      if (item.remainingQty <= 0) return;
      const itemId = (item.menuItemId || item.menuItem?._id || item._id || item.id || '').toString().toLowerCase();
      const itemCatId = (item.category?._id || item.category || '').toString().toLowerCase();

      // Check for BOGO first
      const bogoOffer = activeOffers.find(o => {
        const bogoSize = parseInt(o.offerValue) || 2;
        return (
          o.offerType === 'bogo' &&
          item.remainingQty >= bogoSize && // Must have at least bundleSize items to get a free one
          (o.applicableItems?.some(bi => (bi.menuItem?._id || bi.menuItem || '').toString().toLowerCase() === itemId) ||
            o.applicableCategories?.some(catId => (catId._id || catId || '').toString().toLowerCase() === itemCatId))
        );
      });

      if (bogoOffer) {
        const bundleSize = parseInt(bogoOffer.offerValue) || 2;
        // BOGO application log removed
        totalSubtotal += paidCount * (item.originalPrice || 0);
        item.remainingQty = 0;
        return;
      }

      // Check for Discount
      const discountOffer = activeOffers.find(o =>
        o.offerType === 'discount' &&
        item.remainingQty >= (o.minQuantity || 1) &&
        (o.applicableItems?.some(bi => (bi.menuItem?._id || bi.menuItem || '').toString().toLowerCase() === itemId) ||
          o.applicableCategories?.some(catId => (catId._id || catId || '').toString().toLowerCase() === itemCatId))
      );

      if (discountOffer) {
        // Discount application log removed
        const discountPercent = discountOffer.offerValue || 0;
        const discountedPrice = (item.originalPrice || 0) * (1 - discountPercent / 100);
        totalSubtotal += item.remainingQty * discountedPrice;
      } else {
        totalSubtotal += item.remainingQty * (item.originalPrice || 0);
      }
      item.remainingQty = 0;
    });

    // Final subtotal log removed
    return Math.round(totalSubtotal);
  }, [cartItems, offers, settings]);

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
