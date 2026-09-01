"use client";

import React, { useCallback, useRef, useState } from "react";

const THRESHOLD = 64;

export default function PullToRefresh({
  onRefresh,
  children,
  className,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const atTop = () => {
    const el = rootRef.current;
    const windowTop = (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    if (!el) return windowTop;
    return windowTop && el.scrollTop <= 0;
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (!atTop()) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      pullRef.current = 0;
      setPull(0);
      return;
    }
    if (atTop() && dy > 8) {
      const next = Math.min(dy * 0.45, THRESHOLD * 1.6);
      pullRef.current = next;
      setPull(next);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    const shouldRefresh = pullRef.current >= THRESHOLD && !refreshing;
    if (!shouldRefresh) {
      pullRef.current = 0;
      setPull(0);
      return;
    }
    setRefreshing(true);
    pullRef.current = THRESHOLD;
    setPull(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
    }
  }, [onRefresh, refreshing]);

  const indicatorY = refreshing ? THRESHOLD : pull;
  const visible = indicatorY > 8 || refreshing;

  return (
    <div
      ref={rootRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        aria-hidden={!visible}
        className="pointer-events-none flex justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: visible ? 40 : 0 }}
      >
        <span
          className={`material-symbols-outlined text-on-surface-variant mt-2 ${refreshing || pull >= THRESHOLD ? "animate-spin" : ""}`}
          style={{ transform: `translateY(${Math.max(0, indicatorY - THRESHOLD)}px)` }}
        >
          progress_activity
        </span>
      </div>
      {children}
    </div>
  );
}
