import React from 'react';
import Skeleton from './Skeleton';

const ListSkeleton = () => {
  return (
    <div className="rounded-3xl border border-border-light bg-background-card overflow-hidden shadow-sm flex flex-col">
      {/* Top Header Row */}
      <div className="flex items-center justify-between p-5 border-b border-border-light/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      {/* User Info Row */}
      <div className="flex items-center space-x-3 p-5 border-b border-border-light/50">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      
      {/* Items Area */}
      <div className="p-5 space-y-3 bg-background-muted/30 flex-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between bg-white dark:bg-black/20 p-2.5 rounded-xl border border-border-light/50 h-[52px]">
            <div className="space-y-1.5 flex-1 pr-4">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Action Area */}
      <div className="p-4 border-t border-border-light bg-background-card flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
};

export default ListSkeleton;
