import MovieDetailView from '@/components/MovieDetailView';

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieDetailView movieId={decodeURIComponent(id)} />;
}
