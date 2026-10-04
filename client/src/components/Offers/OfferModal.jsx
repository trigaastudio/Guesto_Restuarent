import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { showToast } from '../../utils/sweetAlert';
import { getEffectiveStock } from '../../utils/stockHelpers';

const OfferModal = ({ isOpen, onClose, offer, menus, onBrowseMenu }) => {
  const { addToCart } = useCart();
  
  // Track selections for Choice Groups
  // Key: item ID (for fixed items) or index (for choice groups)
  // Value: the specific menu ID selected
  const [choices, setChoices] = useState({});

  if (!isOpen || !offer) return null;

  const handleChoiceChange = (idx, type, value) => {
    setChoices(prev => ({
      ...prev,
      [`${type}-${idx}`]: value
    }));
  };

  const handleAddToCart = async () => {
    try {
      if (offer.offerType === 'discount') {
        // Discounts don't "add to cart" directly as a bundle, they apply to categories.
        onClose();
        if (onBrowseMenu) {
           onBrowseMenu(offer);
        } else {
           const menuElement = document.getElementById('menu');
           if (menuElement) {
             menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }
        }
        return;
      }

      // For Combo and BOGO, we need to add all required items
      const itemsToAdd = [];

      const processList = (list, type) => {
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          let menuIdStr = (item.menuItem?._id || item.menuItem || '').toString();
          
          if (item.isChoice) {
            menuIdStr = choices[`${type}-${i}`];
            if (!menuIdStr) {
              throw new Error(`Please make a selection for: ${item.choiceGroupName || 'Choice Group'}`);
            }
          }

          if (menuIdStr) {
            const menuObj = menus.find(m => m._id.toString() === menuIdStr) || 
                            (item.isChoice ? item.menuItems?.find(m => m._id?.toString() === menuIdStr) : item.menuItem);
                            
            if (menuObj) {
              itemsToAdd.push({
                menuItem: menuObj,
                quantity: item.quantity || 1,
                selectedSize: item.selectedSize || ''
              });
            }
          }
        }
      };

      if (offer.applicableItems) processList(offer.applicableItems, 'buy');
      if (offer.offerType === 'bogo' && offer.getApplicableItems) {
        processList(offer.getApplicableItems, 'get');
      }

      // Check stock before adding
      for (const item of itemsToAdd) {
        if (getEffectiveStock(item.menuItem) < item.quantity) {
          throw new Error(`Item ${item.menuItem.name} is out of stock!`);
        }
      }

      // Add all items to cart sequentially silently
      for (const item of itemsToAdd) {
        await addToCart(item.menuItem, item.quantity, item.selectedSize, true);
      }
      
      showToast('success', `${offer.title} items added to cart!`);
      onClose();
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const renderRequirementList = (list, type, title) => {
    if (!list || list.length === 0) return null;
    return (
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">{title}</h4>
        <div className="space-y-3">
          {list.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-4 bg-background border border-border/20 rounded-2xl">
              {item.isChoice ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{item.choiceGroupName || 'Choose an Option'}</span>
                    <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded-md">Qty: {item.quantity}</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {item.menuItems?.map(mId => {
                      const mIdStr = (mId?._id || mId).toString();
                      const m = menus.find(menu => menu._id.toString() === mIdStr) || (mId?.name ? mId : null);
                      if (!m || !m.name) return null;

                      const isSelected = choices[`${type}-${idx}`] === m._id.toString();
                      const outOfStock = getEffectiveStock(m) < 1;

                      return (
                        <label 
                          key={m._id} 
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            outOfStock ? 'opacity-50 cursor-not-allowed border-border/10 bg-background-muted grayscale' :
                            isSelected 
                              ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--color-primary),0.15)] cursor-pointer' 
                              : 'border-border/20 bg-background-card hover:bg-background-muted cursor-pointer'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`choice-${type}-${idx}`}
                            value={m._id.toString()}
                            checked={isSelected && !outOfStock}
                            disabled={outOfStock}
                            onChange={(e) => handleChoiceChange(idx, type, e.target.value)}
                            className="hidden"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-primary' : 'border-border/50'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full animate-in zoom-in duration-200" />}
                          </div>
                          <span className={`text-sm font-bold flex-1 ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                            {m.name}
                          </span>
                          {outOfStock && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                              Sold Out
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm flex items-center gap-2">
                    {(() => {
                       const mIdStr = (item.menuItem?._id || item.menuItem || '').toString();
                       const menuMatch = menus.find(m => m._id.toString() === mIdStr);
                       const m = menuMatch || item.menuItem;
                       const outOfStock = m ? getEffectiveStock(m) < 1 : true;
                       
                       return (
                         <>
                           {m?.name || 'Unknown Item'}
                           {outOfStock && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                                Sold Out
                              </span>
                           )}
                         </>
                       );
                    })()}
                    {item.selectedSize && <span className="text-text-muted text-xs ml-1">({item.selectedSize})</span>}
                  </span>
                  <span className="text-[10px] font-black uppercase bg-background-muted px-2 py-1 rounded-md">Qty: {item.quantity}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-[500px] rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-border/10">
        
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 w-full">
          <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90 z-20"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-4 left-6 right-6">
            <span className={`inline-block px-3 py-1 mb-2 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg ${
              offer.offerType === 'bogo' ? 'bg-orange-600 text-white' : 
              offer.offerType === 'combo' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {offer.offerType}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">{offer.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto no-scrollbar">
          <p className="text-sm font-bold text-text-secondary mb-6">{offer.description}</p>

          {offer.offerType === 'combo' && (
            renderRequirementList(offer.applicableItems, 'buy', 'Combo Includes:')
          )}
          
          {offer.offerType === 'bogo' && (
            <>
              {renderRequirementList(offer.applicableItems, 'buy', 'You Buy:')}
              {renderRequirementList(offer.getApplicableItems, 'get', 'You Get:')}
            </>
          )}

          {offer.offerType === 'discount' && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3">
              <Info className="text-primary mt-0.5" size={20} />
              <p className="text-xs font-bold text-primary leading-relaxed">
                Click "Browse Menu" to see all items that apply to this discount. The discount will automatically apply in your cart!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/10 bg-background">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-text-muted uppercase tracking-widest">Total Value</span>
            <span className="text-2xl font-black text-primary">
              {offer.offerType === 'combo' ? `₹${offer.offerValue}` : 
               offer.offerType === 'discount' ? `${offer.offerValue}% OFF` : 'Free Items'}
            </span>
          </div>
          
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <ShoppingBag size={20} />
            {offer.offerType === 'discount' ? 'Browse Menu' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;
