import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-pulse" aria-hidden="true">
    <div className="bg-gray-200 h-48 w-full" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-200" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

export default SkeletonCard;
