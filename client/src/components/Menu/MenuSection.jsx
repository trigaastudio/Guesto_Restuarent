import React from 'react';
import { LayoutGrid, UtensilsCrossed, Plus } from 'lucide-react';
import Loader from '../Loader/Loader';
import { useCart } from '../../context/CartContext';

const MenuSection = React.memo(({ title, loading, filteredMenus, addToCart, navigate, sortBy, setSortBy, dietaryFilter, setDietaryFilter, setSearchQuery, observerTarget, hasMore, loadingMore, onAddClick, selectedCategory, bogoOnly, comboOnly, searchQuery, onClearAll, viewOnly }) => {
  const { offers, checkStoreStatus } = useCart();
  const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: true };
  const isClosed = !storeStatus.isOpen;

  const isAnyFilterActive = sortBy !== 'default' || dietaryFilter !== 'all' || bogoOnly || comboOnly || selectedCategory !== 'all' || !!searchQuery;

  return (
    <section id="menu" className="bg-background pt-2 md:pt-8 pb-6 w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3 md:gap-4">
              {title || 'Popular'} <span className="text-primary">menu</span>
            </h2>
            <p className="text-[10px] md:text-base text-text-muted font-bold opacity-80 tracking-widest uppercase md:normal-case">Discover the most loved dishes</p>
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 pt-2">
            <div className="relative group flex-1 md:flex-none min-w-[120px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-background-muted border border-border/40 text-text-primary text-[9px] md:text-xs font-black tracking-widest rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40 transition-all cursor-pointer shadow-sm"
              >
                <option value="default">Relevance</option>
                <option value="name-az">Name (A-Z)</option>
                <option value="price-low">Price (L-H)</option>
                <option value="price-high">Price (H-L)</option>
                <option value="rating">Top Rated</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                <LayoutGrid size={12} />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border text-[9px] md:text-xs font-black tracking-widest rounded-xl transition-all shadow-sm group ${dietaryFilter === 'veg' ? 'bg-primary text-white border-primary' : 'bg-background-muted border-border/60 text-text-primary hover:bg-background-card hover:border-primary/40'}`}
              >
                <span className={`w-2 h-2 rounded-full bg-green-500 ${dietaryFilter === 'veg' ? 'brightness-150' : ''}`}></span>
                Veg
              </button>
              <button
                onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border text-[9px] md:text-xs font-black tracking-widest rounded-xl transition-all shadow-sm ${dietaryFilter === 'non-veg' ? 'bg-primary text-white border-primary' : 'bg-background-muted border-border/60 text-text-primary hover:bg-background-card hover:border-primary/40'}`}
              >
                <span className={`w-2 h-2 rounded-full bg-red-500 ${dietaryFilter === 'non-veg' ? 'brightness-150' : ''}`}></span>
                Non-veg
              </button>
            </div>

            {isAnyFilterActive && (
              <button
                onClick={onClearAll}
                className="text-[10px] md:text-xs font-black tracking-widest text-primary hover:underline underline-offset-4 px-2"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader size="medium" />
          </div>
        ) : (!filteredMenus || filteredMenus.length === 0) ? (
          <div className="py-20 text-center space-y-6 animate-fade-in bg-background-muted/50 rounded-[3rem] border border-dashed border-border/60">
            <div className="w-24 h-24 bg-background-card rounded-full flex items-center justify-center mx-auto shadow-xl">
              <UtensilsCrossed size={40} className="text-primary opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-text-primary tracking-tighter">No dishes found</h3>
              <p className="text-sm text-text-muted font-bold tracking-widest opacity-80">We couldn't find any items matching your current filters.</p>
            </div>
            <button
              onClick={onClearAll}
              className="px-8 py-3 bg-primary text-white font-black text-[10px] tracking-widest rounded-full hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 animate-fade-in">
            {filteredMenus.map((menu, index) => {
              const variants = menu.variants || menu.sizes || [];
              const originalPrice = menu.isCombo 
                ? menu.comboItems?.reduce((sum, item) => sum + (item.price || 0), 0) 
                : (variants.length > 0 ? Math.min(...variants.map(v => v.price)) : (menu.offerPrice || 0));

              // Find active discount offer for this item
              const activeDiscount = !menu.isCombo && offers?.find(o => {
                if (!o.isActive || o.offerType !== 'discount') return false;
                
                // Check Schedule
                const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                if (o.isWeekendOnly && !['Saturday', 'Sunday'].includes(day)) return false;
                if (o.specificDays?.length > 0 && !o.specificDays.includes(day)) return false;

                // Check Applicability
                const isItemMatch = o.applicableItems?.some(bundleItem => (bundleItem.menuItem?._id || bundleItem.menuItem) === menu._id);
                const isCategoryMatch = o.applicableCategories?.some(cat => (cat._id || cat) === (menu.category?._id || menu.category));
                
                return isItemMatch || isCategoryMatch;
              });

              const isTriggered = activeDiscount && (activeDiscount.minQuantity || 1) <= 1;
              const discountPercent = isTriggered ? activeDiscount.offerValue : 0;
              const discountedPrice = menu.isCombo 
                ? (menu.price || originalPrice)
                : (discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice);

              const hasSavings = originalPrice > discountedPrice;

              const isOutOfStock = menu.totalStock <= 0 || isClosed;

              return (
                <div
                  key={`${menu._id}-${index}`}
                  className={`bg-background-card rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden p-3.5 md:p-5 transition-all duration-500 group flex flex-col h-full shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-border/10 will-change-transform ${
                    isOutOfStock 
                    ? 'grayscale opacity-60 pointer-events-none' 
                    : 'hover:bg-primary active:bg-primary hover:shadow-[0_20px_50px_rgba(185,28,28,0.15)] active:shadow-[0_20px_50px_rgba(185,28,28,0.15)]'
                  }`}
                  style={{ 
                    animationDelay: `${(index % 10) * 0.05}s`,
                    willChange: 'transform, box-shadow'
                  }}
                  onClick={() => !isOutOfStock && onAddClick(menu)}
                >
                  <div className="relative h-32 md:h-36 mb-3 md:mb-4 overflow-hidden rounded-xl bg-white/5">
                    <img
                      src={menu.image || '/placeholder-food.jpg'}
                      alt={menu.name}
                      loading="lazy"
                      className={`w-full h-full object-contain group-hover:scale-110 group-active:scale-110 transition-transform duration-700 ease-out ${isClosed ? 'grayscale brightness-0' : ''}`}
                    />
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20">
                        <span className="bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl border border-black/10">
                          {isClosed ? 'Closed' : 'Out of Stock'}
                        </span>
                      </div>
                    )}

                    {activeDiscount && !isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-bounce-slow z-10">
                        {activeDiscount.minQuantity > 1 
                          ? `BUY ${activeDiscount.minQuantity} GET ${activeDiscount.offerValue}% OFF` 
                          : `${activeDiscount.offerValue}% OFF`}
                      </div>
                    )}
                    {variants.some(v => v.isBOGO) && !isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg z-10 uppercase tracking-tighter">
                        BOGO
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="font-black text-sm text-text-primary group-hover:text-white group-active:text-white transition-colors leading-tight mb-1 tracking-tight truncate">
                      {menu.name}
                    </h3>

                    <p className="text-[9px] text-text-muted/90 group-hover:text-white/90 group-active:text-white/90 line-clamp-2 mb-4 leading-relaxed font-bold tracking-widest transition-colors">
                      {menu.description}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-text-primary/5 group-hover:border-white/10 group-active:border-white/10">
                      <div className="flex flex-col">
                        {hasSavings && (
                          <span className="text-[10px] text-text-muted line-through opacity-60 group-hover:text-white/60">
                            ₹{Math.round(originalPrice)}
                          </span>
                        )}
                        <span className="font-black text-base text-text-primary group-hover:text-white group-active:text-white transition-colors">
                          ₹{Math.round(discountedPrice)}
                        </span>
                      </div>
                      {!viewOnly && (
                        <button
                          onClick={(e) => { e.stopPropagation(); !isOutOfStock && onAddClick(menu); }}
                          disabled={isOutOfStock}
                          className={`p-2 rounded-lg transition-all active:scale-90 shadow-sm ${
                            isOutOfStock
                            ? 'bg-background-muted text-text-muted cursor-not-allowed opacity-30'
                            : 'bg-primary-light/10 group-hover:bg-primary-light group-active:bg-primary-light text-primary-light group-hover:text-white group-active:text-white'
                          }`}
                          title={isOutOfStock ? "Unavailable" : "Add to Cart"}
                        >
                          {isOutOfStock ? <UtensilsCrossed size={16} /> : <Plus size={16} strokeWidth={3} />}
                        </button>
                      )}
                      {viewOnly && (
                        <div className="p-2 rounded-lg bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-all">
                           <LayoutGrid size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Observer Target for Infinite Scroll */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center mt-2">
          {loadingMore && (
            <div className="flex items-center gap-3">
              <Loader size="small" />
              <span className="text-[10px] font-black tracking-widest text-primary opacity-60">Loading more dishes...</span>
            </div>
          )}
          {!hasMore && filteredMenus && filteredMenus.length > 0 && (
            <p className="text-[10px] font-black tracking-widest text-text-muted opacity-70">You've reached the end of the menu</p>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}} />
    </section>
  );
});

export default MenuSection;
