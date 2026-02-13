
"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function InfiniteScrollTrigger({ onIntersect, isLoading, hasMore }: InfiniteScrollTriggerProps) {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onIntersect, isLoading, hasMore]);

  return (
    <div ref={observerTarget} className="h-10 flex items-center justify-center w-full">
      {isLoading && <div className="animate-pulse text-sm text-slate-400 font-bold uppercase tracking-widest">Loading more...</div>}
    </div>
  );
}
