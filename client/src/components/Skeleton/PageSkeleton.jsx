import React from 'react';
import Skeleton from './Skeleton';
import CardSkeleton from './CardSkeleton';

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background font-sans animate-in fade-in duration-500">
      {}
      <div className="w-full bg-[#B91C1C] h-64 sm:h-80 md:h-96 relative flex flex-col pt-16 px-6 sm:px-12">
        <Skeleton className="w-1/2 md:w-1/3 h-8 sm:h-12 bg-white/20 rounded-xl mb-4" />
        <Skeleton className="w-3/4 md:w-1/2 h-4 sm:h-6 bg-white/20 rounded-lg" />
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {}
        <div className="space-y-4">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <div className="flex gap-4 overflow-x-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-24 h-10 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {}
        <div className="space-y-4">
          <Skeleton className="w-40 h-8 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
