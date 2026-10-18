import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeCues = searchParams.get('cues') === 'true';
    const rawAnalysis = searchParams.get('raw') === 'true';

    let rows;
    if (includeCues) {
      rows = await sql`
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
    } else {
      rows = await sql`
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
          analysis,
          created_at as "createdAt"
        FROM fx_scanned_movies
        WHERE id = ${id}
        LIMIT 1;
      `;
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }

    const movie = rows[0];

    // Optimize payload: extract clean vocabulary and strip out 750KB+ of duplicate analysis structures
    if (!rawAnalysis && movie.analysis) {
      let analysisObj = movie.analysis;
      if (typeof analysisObj === 'string') {
        try { analysisObj = JSON.parse(analysisObj); } catch (e) { analysisObj = {}; }
      }
      movie.vocabulary = extractVocabFromAnalysis(analysisObj);
      delete movie.analysis;
    }

    return NextResponse.json(
      { success: true, movie },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
        }
      }
    );
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
