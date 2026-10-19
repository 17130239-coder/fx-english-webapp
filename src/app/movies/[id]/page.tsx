import { Suspense } from 'react';
import MovieDetailView from '@/components/MovieDetailView';
import { getServerMovieDetails } from '@/lib/serverDb';
import { MovieDetailSkeleton } from '@/components/Skeletons';

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cleanId = safeDecode(id || '');

  // Server-Side Data Fetching (RSC)
  const initialMovie = await getServerMovieDetails(cleanId);

  return (
    <Suspense fallback={<MovieDetailSkeleton count={9} />}>
      <MovieDetailView movieId={cleanId} initialMovie={initialMovie} />
    </Suspense>
  );
}
