import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getEffectiveStock } from '../../utils/stockHelpers';

const MenuModal = ({ isOpen, onClose, menu, onAction, viewOnly }) => {
  const { checkStoreStatus, cartItems = [] } = useCart();
  const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
  const isClosed = !storeStatus.isOpen;
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const variants = menu?.variants || menu?.sizes || [];
    if (variants.length > 0) {
      const effectiveStock = menu?.isCombo ? Infinity : getEffectiveStock(menu);
      const inStockVariants = variants.filter(v => Math.max(0, Math.floor(effectiveStock / (v.stockValue || 1))) > 0);
      const targetVariants = inStockVariants.length > 0 ? inStockVariants : variants;
      const lowestVariant = [...targetVariants].sort((a, b) => a.price - b.price)[0];
      setSelectedSize(lowestVariant.size);
    } else {
      setSelectedSize(null);
    }
    setQuantity(1);
  }, [menu]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !menu) return null;

  const variants = menu.variants || menu.sizes || [];
  const selectedVariant = variants.find(v => v.size === selectedSize);

  const menuDiscount = menu.discountPercentage || 0;
  const categoryDiscount = menu.category?.discountPercentage || 0;
  const discountPercent = Math.max(menuDiscount, categoryDiscount);

  const basePrice = selectedVariant ? selectedVariant.price : (menu.offerPrice || menu.price || 0);

  const currentPrice = menu.isCombo
    ? (menu.price || basePrice)
    : Math.round(discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice);

  const originalPrice = menu.isCombo
    ? menu.comboItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
    : basePrice;

  const isGlobalOutOfStock = getEffectiveStock(menu) < 1 || menu?.isBlocked || isClosed;
  const effectiveStock = menu?.isCombo ? Infinity : getEffectiveStock(menu);

  const currentInCart = cartItems
    .filter(c => (c.menuItemId || c.menuItem?._id || c._id) === menu._id && c.selectedSize === selectedSize)
    .reduce((acc, c) => acc + c.quantity, 0);
  const mult = selectedVariant && selectedVariant.stockValue ? selectedVariant.stockValue : 1;
  const maxAllowedQty = menu?.isCombo ? Infinity : Math.floor(effectiveStock / mult) - currentInCart;
  const isMaxReached = quantity >= maxAllowedQty;

  const isOutOfStock = isGlobalOutOfStock || (!menu?.isCombo && maxAllowedQty <= 0);
  const isLowStock = !isOutOfStock && !isClosed && effectiveStock > 0 && effectiveStock < (5 * mult);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-[500px] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-border/10">
        {/* Modal Header/Image */}
        <div className="relative h-40 md:h-44 bg-background-muted/50 flex items-center justify-center p-3">
          <img
            src={menu.image || '/placeholder-food.jpg'}
            alt={menu.name}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
          {isLowStock && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm border border-red-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 uppercase tracking-widest whitespace-nowrap">
              Only {effectiveStock} Left
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-background-card/80 backdrop-blur-md rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-lg border border-border/10 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${menu.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[9px] font-black tracking-[0.1em] text-text-muted opacity-60 uppercase">{menu.foodType}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary tracking-tighter leading-none">{menu.name}</h2>
            <p className="text-[10px] md:text-xs text-text-muted font-bold leading-relaxed opacity-60 tracking-wide line-clamp-2">
              {menu.description}
            </p>
          </div>

          {/* Combo Items List */}
          {menu.isCombo && menu.comboItems?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                <h4 className="text-[9px] font-black tracking-wider text-text-primary uppercase">Items in this combo</h4>
              </div>
              <div className="space-y-2">
                {menu.comboItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-background-muted/40 p-2.5 rounded-xl border border-border/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                      <span className="text-[11px] font-bold text-text-primary">{item.menuItem?.name || 'Item'}</span>
                    </div>
                    <span className="text-[10px] font-black text-text-muted opacity-50">₹{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Savings Message */}
              {(() => {
                const originalTotal = menu.comboItems.reduce((sum, item) => sum + (item.price || 0), 0);
                const savings = originalTotal - (menu.price || 0);
                if (savings > 0) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-1 bg-primary/5 py-3 rounded-[1.2rem] border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-muted line-through opacity-50">₹{originalTotal.toFixed(0)}</span>
                        <span className="text-[10px] font-black text-primary lowercase tracking-wider">bundle offer!</span>
                      </div>
                      <span className="text-[11px] font-black text-primary lowercase">
                        ✨ you save ₹{savings.toFixed(0)} with this combo ✨
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {variants.length > 0 && !menu.isCombo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                <h4 className="text-[9px] font-black tracking-wider text-text-primary uppercase">Choose portion</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => {
                  const variantMaxQty = Math.max(0, Math.floor(effectiveStock / (v.stockValue || 1)));
                  const isVariantOutOfStock = variantMaxQty < 1;
                  
                  return (
                  <button
                    key={v.size}
                    disabled={isVariantOutOfStock}
                    onClick={() => setSelectedSize(v.size)}
                    className={`relative p-2 rounded-xl flex flex-col items-start transition-all duration-300 border-2 overflow-hidden group ${
                      isVariantOutOfStock
                        ? 'bg-background-muted opacity-50 cursor-not-allowed border-border/20 grayscale'
                        : selectedSize === v.size 
                          ? 'bg-background border-primary shadow-lg' 
                          : 'bg-background-muted border-transparent hover:bg-background hover:border-border/60'
                    }`}
                  >
                    {isVariantOutOfStock && (
                      <div className="absolute inset-0 bg-background-muted/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="text-[8px] font-black text-text-primary px-2 py-1 bg-background rounded-md border border-border/10 uppercase tracking-wider shadow-md">Out of Stock</span>
                      </div>
                    )}
                    {selectedSize === v.size && (
                      <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-black tracking-wider ${selectedSize === v.size ? 'text-primary' : 'text-text-muted opacity-40'}`}>{v.size}</span>
                      {v.isBOGO && (
                        <span className="px-1 py-0.5 bg-emerald-500 text-white text-[6px] font-black rounded uppercase animate-pulse">BOGO</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      {discountPercent > 0 && !menu.isCombo && (
                        <span className="text-[10px] font-bold text-text-muted line-through opacity-50">₹{v.price}</span>
                      )}
                      <span className="text-base font-black text-text-primary tracking-tighter">
                        ₹{Math.round(discountPercent > 0 && !menu.isCombo ? v.price * (1 - discountPercent / 100) : v.price)}
                      </span>
                    </div>
                  </button>
                )})}
              </div>
            </div>
          )}

          {selectedVariant?.isBOGO && selectedVariant?.bogoItem && (
            <div className="bg-status-on/5 border border-status-on/10 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-status-available uppercase tracking-wider">buy 1 get 1 free!</span>
                <div className="px-2 py-0.5 bg-status-available text-white text-[8px] font-black rounded-full uppercase">active</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-border/5 flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedVariant.bogoItem.image || '/placeholder-food.jpg'}
                    alt={selectedVariant.bogoItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-black text-text-primary leading-tight lowercase">
                    free {selectedVariant.bogoItem.name} {selectedVariant.bogoVariant && `- ${selectedVariant.bogoVariant.toLowerCase()}`}
                  </h4>
                  <p className="text-[9px] font-bold text-text-muted opacity-60 lowercase">
                    added automatically to your order
                  </p>
                </div>
              </div>
            </div>
          )}



          {/* Quantity Selector */}
          {!isOutOfStock && !viewOnly && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                <h4 className="text-[9px] font-black tracking-wider text-text-primary uppercase">Select Quantity</h4>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center bg-background border border-border/40 rounded-xl overflow-hidden h-10 w-fit shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-10 flex items-center justify-center hover:bg-background-muted transition-colors text-text-muted disabled:opacity-20"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <input
                    type="number"
                    value={quantity === '' ? '' : quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantity('');
                      } else {
                        setQuantity(Math.min(maxAllowedQty, Math.max(1, parseInt(val) || 1)));
                      }
                    }}
                    onBlur={() => {
                      if (quantity === '' || quantity < 1) setQuantity(1);
                    }}
                    className="w-12 text-center text-sm font-black text-text-primary bg-transparent outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isMaxReached) {
                        import('../../utils/sweetAlert').then(({ showToast }) => {
                          showToast('error', `Only ${maxAllowedQty} will be available`);
                        });
                      } else {
                        setQuantity(prev => Math.min(maxAllowedQty, prev + 1));
                      }
                    }}
                    className="w-10 flex items-center justify-center hover:bg-background-muted transition-colors text-text-muted disabled:opacity-20"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 md:p-5 pt-0 flex items-center justify-between border-t border-border/10 bg-background-card/50 backdrop-blur-sm relative z-20">
          <div className="flex flex-col">
            <span className="text-[8px] font-black tracking-widest text-text-muted opacity-40 mb-1 uppercase">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-text-primary tracking-tighter leading-none">₹{currentPrice * quantity}</span>
              {originalPrice > currentPrice && (
                <span className="text-sm font-bold text-text-muted line-through opacity-50">₹{originalPrice * quantity}</span>
              )}
            </div>
          </div>
          {!viewOnly ? (
            <button
              onClick={() => { if (!isOutOfStock) { onAction(menu, quantity, selectedSize); onClose(); } }}
              disabled={isOutOfStock}
              className={`${isOutOfStock
                  ? 'bg-background-muted text-text-muted cursor-not-allowed grayscale'
                  : 'bg-primary-light hover:bg-primary-light/90 text-white shadow-primary-light/20'
                } px-6 py-2.5 rounded-xl font-black text-[9px] tracking-wider transition-all shadow-xl active:scale-95 flex items-center gap-2 uppercase`}
            >
              {isClosed ? 'Closed' : isOutOfStock ? 'Out of Stock' : 'Add to cart'}
              {!isOutOfStock && <Plus size={14} strokeWidth={3} />}
            </button>
          ) : (
            <div className="px-6 py-2.5 bg-primary/10 text-primary rounded-xl font-black text-[9px] tracking-wider uppercase">
              View Only Mode
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
