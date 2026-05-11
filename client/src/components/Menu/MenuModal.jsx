import React, { useState, useEffect } from 'react';
import { X, Check, Plus } from 'lucide-react';

const MenuModal = ({ isOpen, onClose, menu, onAction }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    const variants = menu?.variants || menu?.sizes || [];
    if (variants.length > 0) {
      const lowestVariant = [...variants].sort((a, b) => a.price - b.price)[0];
      setSelectedSize(lowestVariant.size);
    } else {
      setSelectedSize(null);
    }
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
  const currentPrice = selectedVariant ? selectedVariant.price : menu.offerPrice;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-[400px] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-border/10">
        {/* Modal Header/Image */}
        <div className="relative h-44 md:h-48 bg-background-muted/50 flex items-center justify-center p-4">
          <img
            src={menu.image || '/placeholder-food.jpg'}
            alt={menu.name}
            className="w-full h-full object-contain drop-shadow-2xl animate-float"
          />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-background-card/80 backdrop-blur-md rounded-full text-text-primary hover:bg-primary hover:text-white transition-all shadow-lg border border-border/10 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
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

          {variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                <h4 className="text-[9px] font-black tracking-wider text-text-primary uppercase">Choose portion</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.size}
                    onClick={() => setSelectedSize(v.size)}
                    className={`relative p-2.5 rounded-xl flex flex-col items-start transition-all duration-300 border-2 overflow-hidden group ${selectedSize === v.size ? 'bg-background border-primary shadow-xl' : 'bg-background-muted border-transparent hover:bg-background hover:border-border/60'}`}
                  >
                    {selectedSize === v.size && (
                      <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                    <span className={`text-[9px] font-black tracking-wider mb-0.5 ${selectedSize === v.size ? 'text-primary' : 'text-text-muted opacity-40'}`}>{v.size}</span>
                    <span className="text-base font-black text-text-primary tracking-tighter">₹{v.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-border/10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black tracking-widest text-text-muted opacity-40 mb-1 uppercase">To pay</span>
              <span className="text-2xl font-black text-text-primary tracking-tighter leading-none">₹{currentPrice}</span>
            </div>
            <button
              onClick={() => { onAction(menu, selectedSize); onClose(); }}
              className="bg-primary-light hover:bg-primary-light/90 text-white px-4 py-2 rounded-xl font-black text-[9px] tracking-wider transition-all shadow-xl shadow-primary-light/20 active:scale-95 flex items-center gap-2 uppercase"
            >
              Add to cart <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
