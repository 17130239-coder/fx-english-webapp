import { NextResponse } from 'next/server';
import { getServerDashboardData } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getServerDashboardData();

    return NextResponse.json(
      {
        success: data.connected,
        movies: data.movies,
        masterItems: data.masterItems,
        starredItems: data.starredItems,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard batch data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
