import React from 'react';

export const ProduceCardSkeleton: React.FC = () => (
  <div
    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
    aria-hidden="true"
  >
    {/* 4:3 Image Placeholder */}
    <div className="relative aspect-[4/3] w-full skeleton-shimmer overflow-hidden">
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <div className="h-5 w-8 rounded bg-white/60 dark:bg-slate-900/60" />
        <div className="h-5 w-24 rounded bg-white/60 dark:bg-slate-900/60" />
      </div>
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
        <div className="h-5 w-14 rounded bg-white/60 dark:bg-slate-900/60" />
      </div>
      <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-white/60 dark:bg-slate-900/60" />
        <div className="h-6 w-20 rounded-md bg-white/70 dark:bg-slate-900/70" />
      </div>
    </div>

    {/* Body Content */}
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="h-5 w-3/4 rounded-md skeleton-shimmer" />
          <div className="h-3.5 w-1/2 rounded skeleton-shimmer" />
        </div>
        <div className="space-y-1.5 w-16 shrink-0 flex flex-col items-end">
          <div className="h-5 w-14 rounded-md skeleton-shimmer" />
          <div className="h-3 w-12 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Comparison strip */}
      <div className="h-7 w-full rounded-lg skeleton-shimmer" />

      {/* Description lines */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded skeleton-shimmer" />
      </div>

      {/* Price tier pills */}
      <div className="h-14 w-full rounded-lg skeleton-shimmer" />

      {/* Community demand bar */}
      <div className="h-16 w-full rounded-lg skeleton-shimmer" />

      {/* Quantity presets + Add button */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="h-7 rounded skeleton-shimmer" />
        <div className="h-7 rounded skeleton-shimmer" />
        <div className="h-7 rounded skeleton-shimmer" />
        <div className="h-7 rounded skeleton-shimmer" />
      </div>
      <div className="h-10 w-full rounded-xl skeleton-shimmer" />
    </div>
  </div>
);

export const CatalogGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-2 w-full max-w-full min-w-0"
    aria-label="Loading produce catalog"
    aria-busy="true"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <ProduceCardSkeleton key={idx} />
    ))}
  </div>
);

export const SeasonalStripSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div
    className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-1"
    aria-label="Loading seasonal items"
    aria-busy="true"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="w-40 sm:w-44 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 flex flex-col justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-lg skeleton-shimmer shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-14 rounded skeleton-shimmer" />
            <div className="h-3.5 w-full rounded skeleton-shimmer" />
            <div className="h-3 w-12 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="h-6 w-full rounded-lg skeleton-shimmer" />
      </div>
    ))}
  </div>
);

export const RecipeVideosSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2" aria-busy="true">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2 flex items-start gap-2.5"
      >
        <div className="w-24 h-16 rounded-lg skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-20 rounded skeleton-shimmer" />
          <div className="h-3.5 w-full rounded skeleton-shimmer" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 w-16 rounded-md skeleton-shimmer" />
            <div className="h-5 w-16 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const OrderCardSkeleton: React.FC = () => (
  <div
    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
    aria-hidden="true"
  >
    {/* Header row */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-28 rounded skeleton-shimmer" />
          <div className="h-4 w-24 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded skeleton-shimmer" />
        </div>
        <div className="h-3.5 w-56 rounded skeleton-shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-6 w-32 rounded-full skeleton-shimmer" />
        <div className="h-6 w-28 rounded-md skeleton-shimmer" />
      </div>
    </div>

    {/* 5-step progress grid */}
    <div className="grid grid-cols-5 gap-1.5 py-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="h-7 rounded-lg skeleton-shimmer" />
      ))}
    </div>

    {/* Order Items Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 py-1">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-md skeleton-shimmer shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 rounded skeleton-shimmer" />
              <div className="h-3 w-14 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="space-y-1.5 w-12 flex flex-col items-end shrink-0">
            <div className="h-3.5 w-10 rounded skeleton-shimmer" />
            <div className="h-3 w-8 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>

    {/* Footer row */}
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-32 rounded skeleton-shimmer" />
        <div className="h-5 w-36 rounded-full skeleton-shimmer" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-5 w-16 rounded skeleton-shimmer" />
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  </div>
);

export const OrdersListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div
    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5"
    aria-label="Loading orders"
    aria-busy="true"
  >
    {/* Customer summary banner skeleton */}
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-44 rounded skeleton-shimmer" />
          <div className="h-3 w-64 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-36 rounded-xl skeleton-shimmer" />
        <div className="h-9 w-32 rounded-xl skeleton-shimmer" />
      </div>
    </div>

    {/* Section header skeleton */}
    <div className="flex items-center justify-between">
      <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
      <div className="h-6 w-24 rounded-full skeleton-shimmer" />
    </div>

    {/* Order cards */}
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <OrderCardSkeleton key={idx} />
      ))}
    </div>
  </div>
);

export const ViewTabSkeleton: React.FC = () => (
  <div
    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5"
    aria-label="Loading view"
    aria-busy="true"
  >
    <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
    <div className="h-28 w-full rounded-2xl skeleton-shimmer" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="h-48 rounded-2xl border border-slate-200 dark:border-slate-800 skeleton-shimmer"
        />
      ))}
    </div>
  </div>
);
