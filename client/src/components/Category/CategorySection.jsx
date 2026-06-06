import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const CategorySection = React.memo(({ categories, selectedCategory, handleCategoryChange }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-background pt-0 md:pt-2 pb-4 w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
              Browse <span className="text-primary">Categories</span>
            </h2>
            <p className="text-[9px] md:text-sm text-text-muted font-bold tracking-widest uppercase opacity-80">Find exactly what you're craving today</p>
          </div>
          
          <div className="flex gap-2 md:gap-3">
            <button 
              onClick={() => scroll('left')}
              className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-background-card shadow-lg flex items-center justify-center text-text-primary hover:bg-primary-light hover:text-white transition-all border border-border/40 active:scale-90"
            >
              <ChevronLeft size={16} className="md:size-6" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-background-card shadow-lg flex items-center justify-center text-text-primary hover:bg-primary-light hover:text-white transition-all border border-border/40 active:scale-90"
            >
              <ChevronRight size={16} className="md:size-6" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2 scroll-smooth"
          >
            {}
            <button
              onClick={() => handleCategoryChange('all')}
              className="flex-shrink-0 group relative flex flex-col items-center gap-3 w-20 md:w-28 transition-all duration-500"
            >
              <div className={`w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-full flex items-center justify-center transition-all duration-500 ${
                selectedCategory === 'all' 
                  ? 'bg-primary shadow-[0_10px_30px_rgba(185,28,28,0.4)] scale-105' 
                  : 'bg-background-card shadow-sm hover:shadow-md hover:-translate-y-1'
              }`}>
                <LayoutGrid size={24} className={`md:size-8 ${selectedCategory === 'all' ? 'text-white' : 'text-primary'}`} />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black tracking-widest uppercase text-center transition-colors duration-300 ${
                selectedCategory === 'all' ? 'text-primary' : 'text-text-primary group-hover:text-primary'
              }`}>
                All Dishes
              </span>
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category._id)}
                className="flex-shrink-0 group relative flex flex-col items-center gap-3 w-20 md:w-28 transition-all duration-500"
              >
                <div className={`w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-full flex items-center justify-center transition-all duration-500 ${
                  selectedCategory === category._id 
                    ? 'bg-primary shadow-[0_10px_30px_rgba(185,28,28,0.4)] scale-105' 
                    : 'bg-background-card shadow-sm hover:shadow-md hover:-translate-y-1'
                }`}>
                  <img 
                    src={category.image || '/placeholder-category.png'} 
                    alt={category.name}
                    loading="lazy"
                    className={`w-10 h-10 md:w-14 md:h-14 object-contain transition-transform duration-500 ${selectedCategory === category._id ? 'scale-110' : 'group-hover:scale-110'}`}
                  />
                </div>
                <span className={`text-[9px] md:text-[10px] font-black tracking-widest uppercase text-center transition-colors duration-300 line-clamp-1 w-full px-1 ${
                  selectedCategory === category._id ? 'text-primary' : 'text-text-primary group-hover:text-primary'
                }`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default CategorySection;
