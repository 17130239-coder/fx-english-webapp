import { MovieDetailSkeleton, NavbarSkeleton } from '@/components/Skeletons';

export default function MovieLoading() {
  return (
    <div className="fx-studio-layout">
      <NavbarSkeleton activeView="studio" />
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <MovieDetailSkeleton count={9} />
      </main>
    </div>
  );
}
