import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Loader = ({ size = 'medium', fullPage = false, className = "" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const sizes = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-[3px]',
    large: 'h-12 w-12 border-4'
  };

  const loaderContent = (
    <div className={`${sizes[size]} rounded-full border-t-current animate-spin ${className || 'border-primary/10 text-primary'}`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        {loaderContent}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {loaderContent}
    </div>
  );
};

export default Loader;
