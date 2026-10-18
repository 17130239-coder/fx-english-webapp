'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
    // Auto-reload once if this is a stale chunk loading error from a new deployment
    if (
      typeof window !== 'undefined' &&
      (error?.message?.includes('Loading chunk') ||
       error?.message?.includes('Failed to fetch') ||
       error?.name === 'ChunkLoadError')
    ) {
      const reloaded = sessionStorage.getItem('fx_chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('fx_chunk_reload', 'true');
        window.location.reload();
      }
    }
  }, [error]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('fx_chunk_reload');
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--fx-bg-canvas, #0A0A0B)',
        color: 'var(--fx-text-primary, #F4F4F6)',
        padding: '24px',
        fontFamily: 'var(--fx-font-main, sans-serif)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--fx-bg-surface, #141416)',
          border: '1px solid var(--fx-border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: '12px',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Hardware Status Indicator */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
            fontSize: '18px'
          }}
          aria-hidden="true"
        >
          !
        </div>

        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              margin: '0 0 6px 0',
              color: 'var(--fx-text-primary, #F4F4F6)'
            }}
          >
            Đã có gián đoạn kết nối
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--fx-text-secondary, #71717A)',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            Hệ thống cần đồng bộ lại mã nguồn mới nhất từ máy chủ. Vui lòng tải lại trang.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handleReload}
            className="fx-btn-tesla-primary-sm"
            style={{
              flex: 1,
              padding: '10px 14px',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            Tải lại trang
          </button>
          <a
            href="/"
            className="fx-btn-tesla-ghost-sm"
            style={{
              flex: 1,
              padding: '10px 14px',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '12px'
            }}
          >
            Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
