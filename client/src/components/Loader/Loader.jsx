import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Loader = ({ size = 'medium', fullPage = false }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const loaderContent = (
    <div className="relative flex items-center justify-center">
      {/* Outer spinning ring */}
      <div className={`absolute ${sizes[size]} rounded-full border border-primary/20 border-t-primary animate-spin`}></div>
      
      {/* Inner pulsing logo */}
      <div className={`relative ${size === 'small' ? 'h-2.5' : size === 'large' ? 'h-7' : 'h-5'} w-auto animate-pulse`}>
        <img
          src={isDarkMode ? "/logo-golden.png" : "/logo-dark.png"}
          alt="Loading..."
          className="h-full w-auto object-contain"
        />
      </div>
      
      {/* Decorative glow */}
      <div className={`absolute ${sizes[size]} bg-primary/10 rounded-full blur-xl animate-pulse`}></div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background backdrop-blur-md">
        {loaderContent}
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
          Crafting your experience...
        </p>
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
