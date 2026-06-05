import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-red-200 dark:bg-red-900/40 rounded-xl ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
