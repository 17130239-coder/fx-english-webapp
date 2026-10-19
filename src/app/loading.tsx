import { ScannedHistorySkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="fx-app-container">
      <header className="fx-navbar" style={{ opacity: 0.7 }}>
        <div className="fx-navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>FX ENGLISH</span>
          </div>
        </div>
      </header>
      <main className="fx-main-content">
        <div style={{ padding: '24px 0' }}>
          <ScannedHistorySkeleton count={6} />
        </div>
      </main>
    </div>
  );
}
