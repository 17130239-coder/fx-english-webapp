import { ScannedHistorySkeleton, NavbarSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="fx-studio-layout">
      <NavbarSkeleton activeView="studio" />
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="fx-tab-pane">
          <ScannedHistorySkeleton count={6} />
        </div>
      </main>
    </div>
  );
}
