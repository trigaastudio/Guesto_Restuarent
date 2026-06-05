import React from 'react';
import Skeleton from './Skeleton';

const CardSkeleton = () => {
  return (
    <div className="rounded-3xl border border-border-light bg-background-card p-6 shadow-sm space-y-4">
      {}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {}
      <Skeleton className="h-32 w-full rounded-2xl mb-4" />
      
      {}
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      
      {}
      <div className="pt-4 mt-2 border-t border-border-light">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default CardSkeleton;
