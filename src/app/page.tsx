import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { getServerDashboardData } from '@/lib/serverDb';
import Loading from './loading';

export default async function Home() {
  const initialDashboardData = await getServerDashboardData();

  return (
    <Suspense fallback={<Loading />}>
      <Dashboard initialData={initialDashboardData} />
    </Suspense>
  );
}
