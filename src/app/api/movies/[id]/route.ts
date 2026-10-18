import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    await ensureSchema();
    const rows = await sql`
      SELECT 
        id, 
        title, 
        platform, 
        url, 
        timestamp, 
        date_formatted as "dateFormatted", 
        word_count as "wordCount", 
        noun_count as "nounCount", 
        verb_count as "verbCount", 
        adj_count as "adjCount", 
        adv_count as "advCount",
        cues,
        analysis,
        created_at as "createdAt"
      FROM fx_scanned_movies
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, movie: rows[0] });
  } catch (error: any) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || '').trim();
    await ensureSchema();

    // Query URL first to eliminate duplicates of the same movie
    const existing = await sql`SELECT url FROM fx_scanned_movies WHERE id = ${cleanId} LIMIT 1;`;
    const movieUrl = existing[0]?.url ? String(existing[0].url).trim() : '';

    if (movieUrl) {
      await sql`DELETE FROM fx_scanned_movies WHERE id = ${cleanId} OR url = ${movieUrl};`;
    } else {
      await sql`DELETE FROM fx_scanned_movies WHERE id = ${cleanId};`;
    }

    return NextResponse.json({ success: true, id: cleanId });
  } catch (error: any) {
    console.error('Error deleting movie:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
