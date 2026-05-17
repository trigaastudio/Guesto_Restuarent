import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, ShoppingCart, User, Phone, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { showToast } from '../../utils/sweetAlert';

const DineInPOSModal = ({ isOpen, onClose, table, fetchTables, editingOrder }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Not Specified');
  const [cashReceived, setCashReceived] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      if (editingOrder) {
        setCustomer({
          name: editingOrder.customerDetails?.name || '',
          phone: editingOrder.customerDetails?.phone || ''
        });
        setCart(editingOrder.items?.map(item => ({
          ...item,
          menuItem: item.menuItem?._id || item.menuItem,
          name: item.name || item.menuItem?.name || 'Item',
          image: item.image || item.menuItem?.image || '',
          unitPrice: item.unitPrice || item.price,
          totalPrice: item.totalPrice || ((item.unitPrice || item.price) * item.quantity)
        })) || []);
      } else {
        setCart([]);
        setCustomer({ name: '', phone: '' });
      }
      setPaymentMethod('Not Specified');
      setCashReceived('');
      setSearchTerm('');
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

  const addToCart = (item, variant) => {
    if (item.totalStock !== undefined && item.totalStock <= 0) {
      showToast('error', `Out of stock: ${item.name}`);
      return;
    }

    const sizeName = variant.size || 'Standard';

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(c => c.menuItem === item._id && c.size === sizeName);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
        return newCart;
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
    const newCart = [...cart];
    const item = newCart[index];
    item.quantity = Math.max(1, item.quantity + delta);
    item.totalPrice = item.quantity * item.unitPrice;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showToast('warning', 'Please add at least one item to the cart');
      return;
    }
    if (!customer.name.trim()) {
      showToast('warning', 'Please enter a customer name for this order');
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

      if (paymentMethod === 'cash') {
        const received = Number(cashReceived) || 0;
        if (received < subtotal) {
          showToast('warning', `Cash received (₹${received}) is less than the total amount (₹${subtotal})`);
          setIsSubmitting(false);
          return;
        }
      }

      const received = paymentMethod === 'cash' ? (Number(cashReceived) || 0) : (paymentMethod === 'upi/card' ? subtotal : 0);
      const bal = paymentMethod === 'cash' ? Math.max(0, received - subtotal) : 0;
      const status = paymentMethod === 'Not Specified' ? 'unpaid' : 'paid';

      if (editingOrder) {
        const updateData = {
          items: cart,
          customerDetails: {
            name: customer.name,
            phone: customer.phone || ''
          },
          paymentMethod,
          paymentStatus: status,
          cashReceived: received,
          balance: bal
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
            name: customer.name,
            phone: customer.phone || ''
          },
          items: cart,
          orderType: 'dine-in',
          tableId: table._id,
          orderSource: 'admin',
          paymentMethod: 'unpaid',
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
          orderType: 'dine-in',
          paymentMethod,
          paymentStatus: status,
          cashReceived: received,
          balance: bal,
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
      <div className="bg-background-card w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 flex overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Menu Selection */}
        <div className="flex-1 flex flex-col border-r border-border-light bg-background">
          <div className="p-6 border-b border-border-light bg-background-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">Table {table?.tableNumber} Menu</h3>
                <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">Select items to order</p>
              </div>
              <div className="relative w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border-light rounded-2xl focus:outline-none focus:border-primary font-bold text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 no-scrollbar">
            {filteredMenu.map(item => (
              <div 
                key={item._id} 
                onClick={() => {
                  const targetVariant = (item.variants && item.variants.length > 0) 
                    ? item.variants[0] 
                    : { size: 'Standard', price: item.price || 0 };
                  addToCart(item, targetVariant);
                }}
                className={`bg-background-muted/30 p-3 rounded-2xl border border-border-light hover:border-primary/30 transition-all group relative cursor-pointer active:scale-[0.98] ${item.totalStock <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}
              >
                <div className="w-full aspect-square bg-background-card rounded-xl mb-3 overflow-hidden border border-border-light relative">
                  <img src={item.image || '/placeholder-dish.png'} alt={item.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.totalStock <= 0 ? 'grayscale' : ''}`} />
                  {item.totalStock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-text-primary text-xs line-clamp-1">{item.name}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${item.totalStock > 10 ? 'bg-primary/10 text-primary' : item.totalStock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                      {item.totalStock} Left
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
                      className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20 mt-1"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.variants && item.variants.map((v, idx) => {
                        const isOutOfStock = item.totalStock !== undefined && item.totalStock <= 0;
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) addToCart(item, v);
                            }}
                            disabled={isOutOfStock}
                            className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${isOutOfStock
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
            ))}
          </div>
        </div>

        {/* Right Side: Cart & Customer */}
        <div className="w-[400px] flex flex-col bg-background-card flex-shrink-0">
          <div className="p-6 border-b border-border-light flex justify-between items-center">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary" />
              {editingOrder ? `Edit #${editingOrder.orderNumber}` : 'Current Order'}
            </h3>
            <button onClick={onClose} className="p-2 bg-background-muted text-text-muted hover:text-primary rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 border-b border-border-light space-y-4 bg-primary/5">
            <div>
               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Customer Name (Required)</label>
               <div className="relative">
                 <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                 <input 
                   type="text" 
                   value={customer.name}
                   onChange={e => setCustomer({...customer, name: e.target.value})}
                   placeholder="e.g. John Doe (Seat 1)" 
                   className="w-full pl-10 pr-4 py-3 bg-background border border-border-light rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold text-sm text-text-primary transition-all"
                 />
               </div>
            </div>
            <div>
               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Phone (Optional)</label>
               <div className="relative">
                 <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                 <input 
                   type="text" 
                   value={customer.phone}
                   onChange={e => setCustomer({...customer, phone: e.target.value})}
                   placeholder="e.g. 9876543210" 
                   className="w-full pl-10 pr-4 py-3 bg-background border border-border-light rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold text-sm text-text-primary transition-all"
                 />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted/50">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-sm">Cart is empty</p>
                <p className="text-[10px] uppercase tracking-widest">Select items from the menu</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.menuItem}-${item.size}-${index}`} className="flex items-center gap-3 p-3 bg-background-card rounded-2xl border border-border-light shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-text-primary text-sm truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">₹{item.unitPrice} • {item.size}</p>
                  </div>
                  <div className="flex items-center bg-background border border-border-light rounded-xl overflow-hidden shadow-inner">
                    <button onClick={() => updateCartQuantity(index, -1)} className="p-2 hover:bg-background-muted text-text-secondary transition-colors"><Minus size={14} /></button>
                    <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(index, 1)} className="p-2 hover:bg-background-muted text-text-secondary transition-colors"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(index)} className="p-2 text-status-unavailable/50 hover:text-status-unavailable hover:bg-status-off/10 rounded-xl transition-all">
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-background-card border-t border-border-light shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="mb-4">
               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-2 block">Payment Method</label>
               <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: 'Not Specified', label: 'Not Specified' },
                   { id: 'cash', label: 'Cash' },
                   { id: 'upi/card', label: 'UPI / Card' }
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => {
                       setPaymentMethod(method.id);
                       setCashReceived('');
                     }}
                     className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${paymentMethod === method.id ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-background-muted/30 text-text-secondary border-border-light hover:border-primary/30'}`}
                   >
                     {method.label}
                   </button>
                 ))}
               </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cash Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">₹</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0"
                      className="w-32 pl-7 pr-3 py-2 bg-background border border-border-light rounded-xl focus:outline-none focus:border-primary text-right font-black text-sm text-text-primary"
                    />
                  </div>
                </div>
                {Number(cashReceived) > 0 && (
                  <div className="flex justify-between items-center text-xs font-black border-t border-border-light/60 pt-2.5">
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">Balance to Return</span>
                    <span className={Number(cashReceived) >= cart.reduce((acc, item) => acc + item.totalPrice, 0) ? "text-emerald-600 text-sm" : "text-amber-500 text-[10px] uppercase"}>
                      {Number(cashReceived) >= cart.reduce((acc, item) => acc + item.totalPrice, 0)
                        ? `₹${(Number(cashReceived) - cart.reduce((acc, item) => acc + item.totalPrice, 0)).toFixed(2)}`
                        : "Insufficient Cash"}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Amount</p>
                <p className="text-3xl font-black text-primary tracking-tighter">
                  ₹{cart.reduce((acc, item) => acc + item.totalPrice, 0)}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (editingOrder ? 'Updating Order...' : 'Sending to Kitchen...') : (
                <>
                  <CheckCircle2 size={18} />
                  {editingOrder ? 'Update Order Items' : 'Send Order to Kitchen'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DineInPOSModal;
