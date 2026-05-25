import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, ChevronRight, Plus, Minus, Trash2, X } from 'lucide-react';

const FloatingCart = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, settings } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);

  const originalTotal = React.useMemo(() => {
    return cartItems.reduce((sum, item) => {
      let basePrice = 0;
      if (item.isCombo) {
        basePrice = item.comboItems?.reduce((s, ci) => s + (ci.price || 0), 0) || item.price || 0;
      } else {
        const variants = item.variants || item.sizes || [];
        basePrice = variants.find(v => v.size === item.selectedSize)?.price || item.offerPrice || item.price || 0;
      }
      return sum + (basePrice * item.quantity);
    }, 0);
  }, [cartItems]);

  if (cartItems.length === 0) return null;

  const excludedPaths = ['/cart', '/payment', '/login', '/register', '/admin/login', '/admin/dashboard', '/digital-menu', '/waiter/dashboard', '/kitchen/dashboard'];
  if (
    excludedPaths.includes(location.pathname) || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/waiter') || 
    location.pathname.startsWith('/kitchen') ||
    location.pathname.startsWith('/track-order')
  ) {
    return null;
  }

  const totalItems = cartItems.length;

  const platformFee = settings?.operationalSettings?.platformFee || 0;

  const discount = Math.max(0, Math.round(originalTotal - subtotal));
  const total = Math.round(subtotal + platformFee); // Excludes delivery since address isn't chosen yet

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-[999] bg-primary text-white p-3 py-4 rounded-l-2xl shadow-[0_10px_40px_rgba(185,28,28,0.4)] flex flex-col items-center gap-3 hover:pr-5 transition-all group border border-r-0 border-white/20"
      >
        <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black bg-white text-primary px-2 py-0.5 rounded-full shadow-inner">{totalItems}</span>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>View Cart</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed top-24 right-4 sm:right-6 lg:right-10 z-[999] w-[calc(100vw-32px)] sm:w-[380px] max-h-[calc(100vh-120px)] flex flex-col bg-background-card border border-border-light shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
       {/* Header */}
       <div className="bg-primary p-4 sm:p-5 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-widest uppercase text-sm leading-tight">Your Order</h3>
              <span className="text-[10px] font-bold text-white/80">{totalItems} Items Added</span>
            </div>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10 active:scale-95">
            <X size={20} />
          </button>
       </div>

       {/* Cart Items List */}
       <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-background-muted/30">
          {cartItems.map((item, idx) => {
            const getBasePrice = () => {
              if (item.isCombo) {
                return item.comboItems?.reduce((sum, ci) => sum + (ci.price || 0), 0) || item.price || 0;
              }
              const variants = item.variants || item.sizes || [];
              const sizeData = variants.find(v => v.size === item.selectedSize);
              return sizeData ? sizeData.price : (item.offerPrice || item.price || 0);
            };

            const basePrice = getBasePrice();
            const menuDiscount = item.discountPercentage || 0;
            const categoryDiscount = item.category?.discountPercentage || 0;
            const computedDiscountPercent = Math.max(menuDiscount, categoryDiscount);
            const finalPrice = item.isCombo 
              ? (item.price || basePrice)
              : Math.round(computedDiscountPercent > 0 ? basePrice * (1 - computedDiscountPercent / 100) : basePrice);

            return (
              <div key={idx} className="bg-background-card p-4 rounded-2xl border border-border-light shadow-sm hover:border-primary/20 transition-all group">
                  <div className="flex gap-4 items-center mb-3">
                    {/* Image Block */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-border/10 bg-background p-1 group-hover:border-primary/20 transition-all duration-500 shadow-sm relative z-10">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-black text-text-primary leading-tight capitalize truncate group-hover:text-primary transition-colors">{item.name}</h3>
                      </div>
                      
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-70">
                        {item.selectedSize ? `size: ${item.selectedSize}` : (item.category?.name || 'Main Course')}
                      </p>

                      {/* Combo Items */}
                      {item.isCombo && item.comboItems?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.comboItems.map((ci, cIdx) => (
                            <span key={cIdx} className="inline-flex items-center bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded border border-primary/10">
                              {ci.quantity || 1}x {ci.menuItem?.name || 'Item'}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Included Add-ons */}
                      {!item.isCombo && item.variants?.find(v => v.size === item.selectedSize)?.includedItems?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.variants.find(v => v.size === item.selectedSize).includedItems.map((ii, iIdx) => (
                            <span key={iIdx} className="inline-flex items-center bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded border border-primary/10">
                              {ii.quantity || 1}x {ii.menuItem?.name || 'Item'}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* BOGO Offer */}
                      {item.bogoItem && (
                        <div className="mt-1 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                          🎁 Free {item.bogoItem.name} {item.bogoItem.size ? `(${item.bogoItem.size})` : ''} x {item.bogoItem.quantity || item.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border-light/50">
                    <div className="flex items-center bg-background-muted rounded-xl border border-border-light overflow-hidden shadow-inner">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1.5 text-text-muted hover:text-primary hover:bg-background transition-colors disabled:opacity-30 disabled:hover:text-text-muted"><Minus size={14} strokeWidth={3} /></button>
                      <span className="w-8 text-center text-[11px] font-black text-text-primary">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1.5 text-text-muted hover:text-primary hover:bg-background transition-colors"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-text-primary">₹{(finalPrice * item.quantity).toFixed(0)}</span>
                        {basePrice > finalPrice && (
                          <span className="text-[10px] font-bold text-text-muted line-through opacity-50">₹{(basePrice * item.quantity).toFixed(0)}</span>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item._id)} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
              </div>
            );
          })}
       </div>

       {/* Footer / Bill Summary */}
       <div className="p-4 sm:p-5 bg-background-card border-t border-border-light shadow-[0_-10px_20px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Actual Price</span>
             <span className="text-sm font-black text-text-primary">₹{Math.round(originalTotal)}</span>
          </div>

          <div className="flex items-center justify-between text-green-500">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Savings</span>
             <span className="text-sm font-black">-₹{discount}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border-light/50">
             <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Platform Fee</span>
             <span className="text-sm font-black text-text-primary">₹{platformFee}</span>
          </div>

          <div className="flex items-center justify-between pt-3 pb-3">
             <span className="text-sm font-black text-text-primary uppercase tracking-widest">Subtotal</span>
             <span className="text-2xl font-black text-primary leading-none">₹{total}</span>
          </div>

          <button 
             onClick={() => navigate('/cart')}
             className="w-full py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-light shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
             Go To Checkout <ChevronRight size={16} strokeWidth={3} />
          </button>
       </div>
    </div>
  );
};

export default FloatingCart;
