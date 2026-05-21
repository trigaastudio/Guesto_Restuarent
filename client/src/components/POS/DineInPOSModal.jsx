import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, ShoppingCart, User, Phone, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../api/axiosInstance';
import { showToast } from '../../utils/sweetAlert';

const DineInPOSModal = ({ isOpen, onClose, table, fetchTables, editingOrder, orderSource = 'admin', occupiedSeats }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingItems, setExistingItems] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:5000`;
    const socket = io(SOCKET_URL);

    socket.on('stockUpdate', ({ itemId, totalStock, isBlocked }) => {
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId
            ? { ...item, totalStock, isBlocked }
            : item
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      if (editingOrder) {
        setCustomer({
          name: editingOrder.customerDetails?.name || '',
          phone: editingOrder.customerDetails?.phone || ''
        });
        setExistingItems(editingOrder.items?.map(item => ({
          ...item,
          menuItem: item.menuItem?._id || item.menuItem,
          name: item.name || item.menuItem?.name || 'Item',
          image: item.image || item.menuItem?.image || '',
          unitPrice: item.unitPrice || item.price,
          totalPrice: item.totalPrice || ((item.unitPrice || item.price) * item.quantity)
        })) || []);
        setCart([]);
      } else {
        setExistingItems([]);
        setCart([]);
        setCustomer({ name: '', phone: '' });
      }
      setSearchTerm('');
      setShowConfirmModal(false);
    }
  }, [isOpen, editingOrder]);

  const fetchMenu = async () => {
    try {
      const response = await api.get('/api/menus');
      setMenuItems(response.data.filter(m => !m.isBlocked));
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  // Sum of raw stock consumed by cart items for this menu item (qty × stockValue per variant)
  const getConsumedStock = (item) =>
    cart
      .filter(c => c.menuItem === item._id)
      .reduce((acc, c) => {
        const variant = item.variants?.find(v => v.size === c.size);
        const stockValue = variant?.stockValue || 1;
        return acc + (c.quantity * stockValue);
      }, 0);

  // Remaining RAW stock shown in the badge (e.g. 18 Left when stock=20, 1×Full(sv=2) in cart)
  const getDynamicRawStock = (item) =>
    Math.max(0, (item.totalStock ?? 0) - getConsumedStock(item));

  // Can we add one more serving of a specific variant right now?
  const canAddVariant = (item, variant) => {
    const stockValue = variant?.stockValue || 1;
    return getDynamicRawStock(item) >= stockValue;
  };

  const addToCart = (item, variant) => {
    if (item.totalStock !== undefined && !canAddVariant(item, variant)) {
      showToast('error', `Not enough stock for: ${item.name} (${variant?.size || 'Standard'})`);
      return;
    }

    const sizeName = variant.size || 'Standard';

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(c => c.menuItem === item._id && c.size === sizeName);
      if (existingIndex > -1) {
        return prevCart.map((c, idx) => {
          if (idx === existingIndex) {
            const newQty = c.quantity + 1;
            return {
              ...c,
              quantity: newQty,
              totalPrice: newQty * c.unitPrice
            };
          }
          return c;
        });
      } else {
        return [...prevCart, {
          menuItem: item._id,
          name: item.name,
          image: item.image || '',
          size: sizeName,
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price
        }];
      }
    });
  };

  const updateCartQuantity = (index, delta) => {
    setCart(prevCart => {
      const targetItem = prevCart[index];
      if (!targetItem) return prevCart;

      if (delta > 0) {
        const menuItem = menuItems.find(m => m._id === targetItem.menuItem);
        if (menuItem && menuItem.totalStock !== undefined) {
          const variant = menuItem.variants?.find(v => v.size === targetItem.size);
          const stockValue = variant?.stockValue || 1;
          // Total raw stock consumed by ALL sizes of this item currently in cart
          const totalConsumed = prevCart
            .filter(c => c.menuItem === targetItem.menuItem)
            .reduce((acc, c) => {
              const v = menuItem.variants?.find(vv => vv.size === c.size);
              return acc + (c.quantity * (v?.stockValue || 1));
            }, 0);
          if (totalConsumed + stockValue > menuItem.totalStock) {
            const remaining = Math.floor((menuItem.totalStock - totalConsumed) / stockValue);
            showToast('error', `Only ${remaining} more serving${remaining !== 1 ? 's' : ''} of ${targetItem.name} available`);
            return prevCart;
          }
        }
      }

      return prevCart.map((item, idx) => {
        if (idx === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const validateCartStock = async () => {
    try {
      const response = await api.get('/api/menus');
      const latestMenu = response.data.filter(m => !m.isBlocked);
      
      // Update local menuItems with the absolute latest stock from server
      setMenuItems(latestMenu);

      for (const cartItem of cart) {
        const menuItem = latestMenu.find(m => m._id === cartItem.menuItem);
        if (!menuItem) {
          showToast('error', `${cartItem.name} is no longer available in the menu.`);
          return false;
        }

        const totalQtyInCart = cart.reduce((acc, c) => c.menuItem === cartItem.menuItem ? acc + c.quantity : acc, 0);

        if (menuItem.totalStock === undefined || totalQtyInCart > menuItem.totalStock) {
          const availableStock = menuItem.totalStock !== undefined ? menuItem.totalStock : 0;
          showToast('error', `Insufficient stock for ${cartItem.name}. Available: ${availableStock}, Requested: ${totalQtyInCart}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error validating stock:', error);
      showToast('error', 'Failed to validate stock. Please try again.');
      return false;
    }
  };

  const handleNext = async () => {
    if (cart.length === 0) {
      showToast('warning', 'Please add at least one item to the cart');
      return;
    }
    const isValid = await validateCartStock();
    if (!isValid) return;

    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const isValid = await validateCartStock();
      if (!isValid) {
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }

      const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

      if (editingOrder) {
        // Keep newly added items completely separate from already ordered items for individual status tracking
        const mergedItems = [...existingItems, ...cart];

        const updateData = {
          items: mergedItems,
          customerDetails: {
            name: customer.name || 'Walk-in',
            phone: ''
          },
          paymentMethod: 'Not Specified',
          paymentStatus: 'unpaid',
          cashReceived: 0,
          balance: 0
        };
        const res = await api.patch(`/api/orders/${editingOrder._id}/items`, updateData);
        if (res.data.success) {
          showToast('success', 'Order updated successfully!');
          onClose();
          fetchTables();
        }
      } else {
        const orderData = {
          customerDetails: {
            name: customer.name || 'Walk-in',
            phone: ''
          },
          items: cart,
          orderType: 'dine-in',
          tableId: table._id,
          orderSource: orderSource,
          paymentMethod: 'Not Specified',
          subtotal,
          deliveryFee: 0,
          tax: 0,
          discount: 0,
          totalAmount: subtotal,
          cashReceived: 0,
          balance: 0,
        };

        const counterOrderData = {
          ...orderData,
          paymentStatus: 'unpaid',
          occupiedSeats: occupiedSeats || 0,
        };

        const res = await api.post('/api/orders/counter', counterOrderData);

        if (res.data.success) {
          showToast('success', 'Order sent to kitchen!');
          onClose();
          fetchTables();
        }
      }
    } catch (error) {
      console.error('Error creating/updating order:', error);
      showToast('error', error.response?.data?.message || 'Failed to save order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredMenu = menuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-6xl h-[85vh] rounded-[2.5rem] shadow-2xl relative z-10 flex overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Left Side: Menu Selection */}
        <div className="flex-1 flex flex-col border-r border-border-light bg-background">
          <div className="p-6 border-b border-border-light bg-background-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">Table {table?.tableNumber} Menu</h3>
                <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">Select items to order</p>
              </div>
              <div className="relative w-64 md:w-72 lg:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-background border border-border-light rounded-2xl focus:outline-none focus:border-primary font-bold text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 no-scrollbar">
            {filteredMenu.map(item => {
              const rawStock = getDynamicRawStock(item);
              const isFullyOutOfStock = item.totalStock !== undefined && rawStock <= 0;
              return (
                <div
                  key={item._id}
                  onClick={() => {
                    const targetVariant = (item.variants && item.variants.length > 0)
                      ? item.variants[0]
                      : { size: 'Standard', price: item.price || 0 };
                    addToCart(item, targetVariant);
                  }}
                  className={`bg-background-muted/30 p-3 rounded-2xl border border-border-light hover:border-primary/30 transition-all group relative cursor-pointer active:scale-[0.98] ${isFullyOutOfStock ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                  <div className="w-full aspect-square bg-background-card rounded-xl mb-3 overflow-hidden border border-border-light relative">
                    <img src={item.image || '/placeholder-dish.png'} alt={item.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isFullyOutOfStock ? 'grayscale' : ''}`} />
                    {isFullyOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-text-primary text-sm md:text-base line-clamp-1">{item.name}</p>
                      <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full ${rawStock > 10 ? 'bg-primary/10 text-primary' : rawStock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {rawStock} Left
                      </span>
                    </div>
                    {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.comboItems.map((ci, idx) => (
                          <span key={idx} className="text-[7px] font-black text-text-muted bg-background-muted px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-border-light">
                            {ci.menuItem?.name || ci.name || 'Item'}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.isCombo ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetVariant = (item.variants && item.variants.length > 0)
                            ? item.variants[0]
                            : { size: 'Standard', price: item.price || 0 };
                          addToCart(item, targetVariant);
                        }}
                        className="w-full py-2.5 md:py-3 bg-primary text-white text-[11px] md:text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20 mt-2"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.variants && item.variants.map((v, idx) => {
                          const isVariantOut = item.totalStock !== undefined && !canAddVariant(item, v);
                          return (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isVariantOut) addToCart(item, v);
                              }}
                              disabled={isVariantOut}
                              className={`px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-[11px] font-black rounded-lg transition-all ${isVariantOut
                                ? 'bg-background-muted text-text-muted cursor-not-allowed border border-border-light'
                                : 'bg-primary text-white hover:bg-primary-light shadow-sm active:scale-95'
                                }`}
                            >
                              {v.size}: ₹{v.price}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart & Customer */}
        <div className="w-[40%] min-w-[340px] max-w-[450px] flex flex-col bg-background-card flex-shrink-0 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border-light flex justify-between items-center shrink-0 bg-background-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/10 shrink-0">
                <ShoppingCart size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                {editingOrder ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Add Items To</span>
                    <span className="text-base font-black text-primary capitalize tracking-wide bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/20 mt-0.5 inline-block w-fit">
                      {editingOrder.orderNumber?.toLowerCase()}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">Dine-In POS</span>
                    <span className="text-base font-black text-text-primary mt-0.5">Current Order</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-background border border-border-light text-text-muted hover:text-primary rounded-xl transition-all shadow-sm active:scale-95">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-background min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted/50">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-sm">Cart is empty</p>
                <p className="text-[10px] uppercase tracking-widest">Select items from the menu</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.menuItem}-${item.size}-${index}`} className="flex items-center gap-3 p-3 bg-background-card rounded-2xl border border-border-light shadow-sm">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-black text-text-primary text-sm md:text-base truncate">{item.name}</p>
                    <p className="text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-wider mt-0.5">₹{item.unitPrice} • {item.size}</p>
                  </div>
                  <div className="flex items-center bg-background border border-border-light rounded-xl overflow-hidden shadow-inner">
                    <button onClick={() => updateCartQuantity(index, -1)} className="p-2.5 hover:bg-background-muted text-text-secondary transition-colors"><Minus size={16} /></button>
                    <span className="w-8 text-center font-black text-sm md:text-base">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(index, 1)} className="p-2.5 hover:bg-background-muted text-text-secondary transition-colors"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(index)} className="p-2.5 text-status-unavailable/50 hover:text-status-unavailable hover:bg-status-off/10 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-5 md:p-6 border-t border-border-light space-y-4 bg-primary/5 shrink-0">
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Customer Name (Optional)</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-background border border-border-light rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold text-sm md:text-base text-text-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 bg-background-card border-t border-border-light shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center shrink-0">
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Total Amount</p>
              <p className="text-2xl font-black text-primary tracking-tight leading-none">
                ₹{cart.reduce((acc, item) => acc + item.totalPrice, 0)}
              </p>
            </div>
            <button
              onClick={handleNext}
              disabled={cart.length === 0}
              className="px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-wider text-[11px] shadow-md shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={16} />
              {editingOrder ? 'UPDATE ORDER' : 'NEXT'}
            </button>
          </div>
        </div>

        {/* Confirmation Modal Overlay */}
        {showConfirmModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-background-card w-full max-w-md md:max-w-lg lg:max-w-xl p-6 md:p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 m-4">
              <h3 className="text-xl md:text-2xl font-black text-text-primary mb-5 md:mb-6 uppercase tracking-tight text-center">Confirm Order</h3>

              <div className="space-y-3 min-h-[35vh] max-h-[50vh] overflow-y-auto mb-6 pr-2 no-scrollbar bg-background-muted/20 p-4 rounded-2xl">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-background p-4 rounded-xl shadow-sm">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-bold text-text-primary text-[15px] truncate">{item.name}</p>
                      <p className="text-[11px] text-text-muted uppercase font-black tracking-widest mt-1">{item.size} x {item.quantity}</p>
                    </div>
                    <p className="font-black text-text-primary text-base shrink-0">₹{item.totalPrice}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black text-primary tracking-tighter">₹{cart.reduce((acc, i) => acc + i.totalPrice, 0)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] border-2 border-border-light text-text-secondary hover:bg-background-muted hover:text-text-primary transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DineInPOSModal;
