import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  className = '',
  style = {},
  width,
  height,
  borderRadius
}: SkeletonProps) {
  return (
    <span
      className={`fx-skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '16px',
        borderRadius: borderRadius ?? '4px',
        ...style
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a single movie card in ScannedHistory
 */
export function MovieCardSkeleton() {
  return (
    <div className="fx-history-card fx-skeleton-card" aria-hidden="true">
      {/* Top Header: Platform Dot & Tag + Date */}
      <div className="fx-history-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="8px" height="8px" borderRadius="50%" />
          <Skeleton width="54px" height="13px" borderRadius="3px" />
        </div>
        <Skeleton width="72px" height="12px" borderRadius="3px" />
      </div>

      {/* Title */}
      <div style={{ margin: '3px 0 2px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton width="90%" height="16px" borderRadius="4px" />
        <Skeleton width="45%" height="13px" borderRadius="4px" />
      </div>

      {/* Bottom Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
        <Skeleton width="50px" height="18px" borderRadius="4px" />
        <Skeleton width="42px" height="18px" borderRadius="4px" />
        <Skeleton width="46px" height="18px" borderRadius="4px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for ScannedHistory section
 */
export function ScannedHistorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="fx-history-section" aria-busy="true" aria-label="Đang tải danh sách phim">
      <div className="fx-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="160px" height="20px" borderRadius="4px" />
          <Skeleton width="28px" height="18px" borderRadius="10px" />
        </div>
        <Skeleton width="75px" height="18px" borderRadius="4px" />
      </div>

      <div className="fx-history-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <MovieCardSkeleton key={idx} />
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton for a single vocabulary word card
 */
export function WordCardSkeleton() {
  return (
    <div className="fx-word-card fx-skeleton-card" aria-hidden="true">
      {/* Line 1: Word + Specs + Actions */}
      <div className="fx-card-line-1">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flex: 1 }}>
          <Skeleton width="110px" height="20px" borderRadius="4px" />
          <Skeleton width="65px" height="13px" borderRadius="3px" />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Skeleton width="22px" height="22px" borderRadius="4px" />
          <Skeleton width="22px" height="22px" borderRadius="4px" />
          <Skeleton width="22px" height="22px" borderRadius="4px" />
        </div>
      </div>

      {/* Line 2: IPA / Meaning */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
        <Skeleton width="70px" height="12px" borderRadius="3px" />
        <Skeleton width="88%" height="15px" borderRadius="3px" />
      </div>

      {/* Line 3: Context Sentence Box */}
      <div
        style={{
          padding: '8px 10px',
          background: 'var(--fx-bg-surface-hover)',
          border: '1px solid var(--fx-border-subtle)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <Skeleton width="100%" height="12px" borderRadius="3px" />
        <Skeleton width="60%" height="11px" borderRadius="3px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for MasterListView
 */
export function MasterListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="fx-master-view" aria-busy="true" aria-label="Đang tải danh sách từ đã biết">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Skeleton width="180px" height="24px" borderRadius="4px" />
          <Skeleton width="34px" height="18px" borderRadius="10px" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="85px" height="30px" borderRadius="6px" />
          <Skeleton width="65px" height="30px" borderRadius="6px" />
          <Skeleton width="65px" height="30px" borderRadius="6px" />
        </div>
      </div>

      {/* CEFR Distribution Bar Skeleton */}
      <div
        style={{
          background: 'var(--fx-bg-surface)',
          border: '1px solid var(--fx-border-subtle)',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="150px" height="14px" borderRadius="3px" />
          <Skeleton width="70px" height="13px" borderRadius="3px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="4px" />
      </div>

      {/* Toolbar & Tabs Skeleton */}
      <div className="fx-unified-toolbar" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="82px" height="32px" borderRadius="6px" />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="110px" height="34px" borderRadius="6px" />
          <Skeleton width="190px" height="34px" borderRadius="6px" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="fx-cards-grid">
        {Array.from({ length: count }).map((_, i) => (
          <WordCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton for MovieDetailView
 */
export function MovieDetailSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      aria-busy="true"
      aria-label="Đang tải dữ liệu phim"
    >
      {/* Top Breadcrumb Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <Skeleton width="110px" height="32px" borderRadius="6px" />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Skeleton width="95px" height="32px" borderRadius="6px" />
          <Skeleton width="120px" height="32px" borderRadius="6px" />
          <Skeleton width="85px" height="32px" borderRadius="6px" />
        </div>
      </div>

      {/* Movie Header Card */}
      <div
        style={{
          background: 'var(--fx-bg-surface)',
          border: '1px solid var(--fx-border-subtle)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <Skeleton width="55%" height="24px" borderRadius="4px" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="55px" height="13px" borderRadius="3px" />
          <span style={{ fontSize: '11px', color: 'var(--fx-text-muted)' }}>·</span>
          <Skeleton width="75px" height="13px" borderRadius="3px" />
          <span style={{ fontSize: '11px', color: 'var(--fx-text-muted)' }}>·</span>
          <Skeleton width="115px" height="13px" borderRadius="3px" />
        </div>
      </div>

      {/* CEFR Distribution Bar Skeleton */}
      <div
        style={{
          background: 'var(--fx-bg-surface)',
          border: '1px solid var(--fx-border-subtle)',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="160px" height="14px" borderRadius="3px" />
          <Skeleton width="90px" height="13px" borderRadius="3px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="4px" />
      </div>

      {/* POS Tabs & Search Toolbar Skeleton */}
      <div className="fx-unified-toolbar">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="84px" height="34px" borderRadius="6px" />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="130px" height="34px" borderRadius="6px" />
          <Skeleton width="200px" height="34px" borderRadius="6px" />
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="fx-cards-grid">
        {Array.from({ length: count }).map((_, i) => (
          <WordCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
