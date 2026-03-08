import { memo } from 'react';

export default memo(function DrugCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse" aria-hidden="true">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-green-50 rounded-full w-12" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-emerald-50 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-12" />
        <div className="flex gap-1.5">
          <div className="h-7 bg-blue-50 rounded-lg w-20" />
          <div className="h-7 bg-blue-50 rounded-lg w-24" />
          <div className="h-7 bg-blue-50 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
});
