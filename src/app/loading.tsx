import React from 'react';
import { ScannedHistorySkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="fx-studio-layout">
      {/* Skeleton Navbar placeholder */}
      <header className="fx-navbar" aria-hidden="true">
        <div className="fx-nav-brand">
          <div className="fx-brand-title">FX ENGLISH</div>
        </div>
        <div className="fx-nav-center">
          <div className="fx-nav-pill-group">
            <span className="fx-skeleton" style={{ width: '75px', height: '28px', borderRadius: '6px' }} />
            <span className="fx-skeleton" style={{ width: '95px', height: '28px', borderRadius: '6px' }} />
          </div>
        </div>
        <div className="fx-nav-right">
          <span className="fx-skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
        </div>
      </header>

      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <ScannedHistorySkeleton count={6} />
      </main>
    </div>
  );
}
