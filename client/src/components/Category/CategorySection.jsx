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
    <section className="bg-background pt-6 md:pt-20 pb-4 w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-xl md:text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
              Browse <span className="text-primary">Categories</span>
            </h2>
            <p className="text-[9px] md:text-sm text-text-muted font-bold tracking-widest uppercase opacity-60">Find exactly what you're craving today</p>
          </div>
          
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full bg-background-card shadow-lg flex items-center justify-center text-text-primary hover:bg-primary-light hover:text-white active:bg-primary-light active:text-white transition-all border border-border/60 active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full bg-background-card shadow-lg flex items-center justify-center text-text-primary hover:bg-primary-light hover:text-white active:bg-primary-light active:text-white transition-all border border-border/60 active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2 scroll-smooth"
        >
          {/* "All" Category button */}
          <button
            onClick={() => handleCategoryChange('all')}
            className={`flex-shrink-0 group relative flex flex-col items-center gap-2 p-2 md:p-6 rounded-[1.25rem] md:rounded-[2.5rem] transition-all duration-500 border-2 ${
              selectedCategory === 'all'
                ? 'bg-primary border-primary shadow-2xl shadow-primary/30 scale-105'
                : 'bg-background-muted border-transparent text-text-primary hover:bg-background-card hover:shadow-xl'
            }`}
          >
            <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
              selectedCategory === 'all' 
                ? 'bg-white/20 scale-110' 
                : 'bg-white shadow-inner group-hover:scale-110'
            }`}>
              <LayoutGrid size={20} className={selectedCategory === 'all' ? 'text-white' : 'text-primary'} />
            </div>
            <span className={`text-[9px] md:text-xs font-black tracking-[0.15em] uppercase transition-colors duration-300 ${
              selectedCategory === 'all' ? 'text-white' : 'text-text-primary'
            }`}>
              All Dishes
            </span>
          </button>

          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryChange(category._id)}
              className={`flex-shrink-0 group relative flex flex-col items-center gap-2 p-2 md:p-6 rounded-[1.25rem] md:rounded-[2.5rem] transition-all duration-500 border-2 ${
                selectedCategory === category._id
                  ? 'bg-primary border-primary shadow-2xl shadow-primary/30 scale-105'
                  : 'bg-background-muted border-transparent text-text-primary hover:bg-background-card hover:shadow-xl'
              }`}
            >
              <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                selectedCategory === category._id 
                  ? 'bg-white/20 scale-110 rotate-12' 
                  : 'bg-white shadow-inner group-hover:scale-110'
              }`}>
                <img 
                  src={category.image || '/placeholder-category.png'} 
                  alt={category.name}
                  className="w-7 h-7 md:w-12 md:h-12 object-contain"
                />
              </div>
              <span className={`text-[9px] md:text-xs font-black tracking-[0.15em] uppercase transition-colors duration-300 ${
                selectedCategory === category._id ? 'text-white' : 'text-text-primary'
              }`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

export default CategorySection;
