import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';

const HeroSection = React.memo(({ searchQuery, setSearchQuery, heroImages, trendingItems }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});
  const directionRef = useRef(1);

  // Preload all hero images on mount to prevent loading flashes
  useEffect(() => {
    if (heroImages && heroImages.length > 0) {
      heroImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [heroImages]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroIndex((prev) => {
        let next = prev + directionRef.current;
        if (next >= heroImages.length) {
          directionRef.current = -1;
          return prev - 1;
        }
        if (next < 0) {
          directionRef.current = 1;
          return prev + 1;
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(heroTimer);
  }, [heroImages.length]);

  return (
    <div className="relative pt-10 sm:pt-12 md:pt-14 lg:pt-16 pb-16 sm:pb-20 md:pb-24 lg:pb-12 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-[60px] sm:blur-[70px] md:blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-[40px] sm:blur-[50px] md:blur-[60px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-24">

          {/* Right Side: Hero Image Carousel - Top on Mobile/Tablet */}
          <div className="w-full lg:flex-1 relative flex justify-center lg:justify-end order-1 lg:order-2 min-h-[350px] sm:min-h-[450px] md:min-h-[600px] lg:min-h-[650px]">
            <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[580px] lg:max-w-[750px] aspect-square">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] animate-pulse"></div>

              {heroImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 w-full h-full flex justify-center items-center transition-all duration-[2s] cubic-bezier(0.4, 0, 0.2, 1) ${idx === heroIndex ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 rotate-12 pointer-events-none'
                    }`}
                >
                  {!loadedImages[idx] && (
                    <div className="absolute w-[80%] h-[80%] bg-white/5 rounded-full blur-[80px] sm:blur-[100px] animate-pulse"></div>
                  )}
                  <img
                    src={img}
                    alt={`Hero ${idx + 1}`}
                    fetchpriority={idx === 0 ? "high" : "low"}
                    loading={idx === 0 ? "eager" : "lazy"}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [idx]: true }))}
                    className={`w-full h-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)] animate-float transition-opacity duration-700 ${
                      loadedImages[idx] ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Left Side: Content */}
          <div className="flex-1 text-center lg:text-left space-y-4 sm:space-y-5 md:space-y-6 hero-fade-in order-2 lg:order-1 w-full flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl mx-auto lg:mx-0">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]"></span>
              Experience the best flavors 🍕
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] md:leading-[0.9] text-white tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] uppercase">
                Taste the <br className="hidden sm:block" />
                <span className="text-white/90">Extraordinary</span>
              </h1>
              <p className="text-white/70 text-[10px] sm:text-xs md:text-lg lg:text-xl font-bold leading-relaxed max-w-[280px] sm:max-w-md md:max-w-xl mx-auto lg:mx-0 tracking-wide uppercase sm:normal-case">
                Guesto delivers <span className="text-white font-black">artisanal quality</span> meals directly to your doorstep.
              </p>
            </div>

            {/* Premium Search Bar */}
            <div className="w-full max-w-2xl pt-1 sm:pt-2 md:pt-4 mx-auto lg:mx-0">
              <div className="bg-background-card rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 flex items-center shadow-[0_20px_80px_rgba(0,0,0,0.2)] overflow-hidden group focus-within:ring-4 sm:focus-within:ring-8 focus-within:ring-white/10 transition-all border-0">
                <div className="flex-1 flex items-center gap-2 sm:gap-3 md:gap-4 pl-3 sm:pl-4 md:pl-6 relative">
                  <Search size={16} className="text-primary md:size-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchQuery(localQuery);
                        const menuElement = document.getElementById('menu');
                        if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    placeholder="Search for food..."
                    className="w-full py-2 sm:py-3 md:py-4 pr-8 text-[9px] sm:text-[10px] md:text-base font-black outline-none placeholder:text-gray-400 bg-transparent text-text-primary uppercase tracking-wider"
                  />
                  {localQuery && (
                    <button
                      onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
                      className="absolute right-2 sm:right-4 p-1.5 sm:p-2 hover:bg-background-muted rounded-full text-text-muted transition-all active:scale-90"
                    >
                      <X size={12} sm:size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery(localQuery);
                    const menuElement = document.getElementById('menu');
                    if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-primary hover:bg-primary-dark text-white px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 rounded-[1.2rem] sm:rounded-[2rem] font-black text-[8px] sm:text-[10px] md:text-sm transition-all transform active:scale-95 shrink-0 tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 md:gap-3 shadow-xl shadow-primary/30 uppercase"
                >
                  <span className="hidden sm:inline">Explore</span> <ArrowRight size={14} sm:size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 mt-5 sm:mt-6 md:mt-8">
                <span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">Trending:</span>
                {trendingItems && trendingItems.length > 0 ? (
                  trendingItems.slice(0, 3).map(item => (
                    <button
                      key={item._id}
                      onClick={() => { setLocalQuery(item.name); setSearchQuery(item.name); const menuElement = document.getElementById('menu'); if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth' }); }}
                      className="text-[7px] sm:text-[9px] md:text-[10px] font-black text-white hover:text-white/60 transition-all uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 bg-white/5 rounded-full border border-white/10"
                    >
                      {item.name}
                    </button>
                  ))
                ) : (
                  ['Burgers', 'Pizzas', 'Pasta'].map(item => (
                    <button
                      key={item}
                      onClick={() => { setLocalQuery(item); setSearchQuery(item); const menuElement = document.getElementById('menu'); if (menuElement) menuElement.scrollIntoView({ behavior: 'smooth' }); }}
                      className="text-[7px] sm:text-[9px] md:text-[10px] font-black text-white hover:text-white/60 transition-all uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/10"
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HeroSection;
