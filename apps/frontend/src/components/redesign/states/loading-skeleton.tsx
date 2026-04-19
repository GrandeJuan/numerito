'use client';

export interface LoadingSkeletonProps {
  rows?: number;
  withHeader?: boolean;
}

export function LoadingSkeleton({ rows = 3, withHeader = true }: LoadingSkeletonProps) {
  return (
    <div className="animate-pulse">
      {withHeader && (
        <>
          <div className="h-6 w-[240px] bg-[var(--surface-2)] rounded mb-2" />
          <div className="h-4 w-[180px] bg-[var(--surface-2)] rounded mb-6" />
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-3.5"
          >
            <div className="h-3 w-[60%] bg-[var(--surface-2)] rounded mb-2.5" />
            <div className="h-6 w-[40%] bg-[var(--surface-2)] rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-[120px] bg-[var(--surface)] border border-[var(--border)] rounded-[12px] mb-3 p-4"
        >
          <div className="h-4 w-[30%] bg-[var(--surface-2)] rounded mb-3" />
          <div className="h-3 w-[80%] bg-[var(--surface-2)] rounded mb-2" />
          <div className="h-3 w-[60%] bg-[var(--surface-2)] rounded" />
        </div>
      ))}
    </div>
  );
}
