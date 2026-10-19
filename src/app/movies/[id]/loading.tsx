import { MovieDetailSkeleton } from '@/components/Skeletons';

export default function MovieLoading() {
  return (
    <div className="fx-app-container">
      <main className="fx-main-content" style={{ paddingTop: '24px' }}>
        <MovieDetailSkeleton count={9} />
      </main>
    </div>
  );
}
