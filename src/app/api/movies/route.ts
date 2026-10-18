import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const isFull = searchParams.get('full') === 'true' || searchParams.get('export') === 'true';

    let rows;
    if (isFull) {
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
          phrase_count as "phraseCount",
          pattern_count as "patternCount",
          cues,
          analysis,
          created_at as "createdAt"
        FROM fx_scanned_movies
        ORDER BY timestamp DESC;
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
          phrase_count as "phraseCount",
          pattern_count as "patternCount",
          created_at as "createdAt"
        FROM fx_scanned_movies
        ORDER BY timestamp DESC
        LIMIT 100;
      `;
    }

    return NextResponse.json(
      { success: true, movies: rows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    await ensureSchema();
    const body = await req.json();
    const { id, title, platform, url, timestamp, dateFormatted, wordCount, nounCount, verbCount, adjCount, advCount, phraseCount, patternCount, cues, analysis } = body;

    const newId = id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalTimestamp = timestamp || Date.now();
    const finalDate = dateFormatted || new Date(finalTimestamp).toLocaleDateString('vi-VN');

    let finalPlatform = platform || 'file';
    if (url && (url.includes('netflix.com') || url.includes('/watch/'))) {
      finalPlatform = 'netflix';
    } else if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      finalPlatform = 'youtube';
    }

    const finalPhraseCount = phraseCount || analysis?.totals?.phrases || analysis?.phrases?.length || 0;
    const finalPatternCount = patternCount || analysis?.totals?.patterns || analysis?.patterns?.length || analysis?.sentenceStructures?.length || 0;

    const rows = await sql`
      INSERT INTO fx_scanned_movies (
        id, title, platform, url, timestamp, date_formatted,
        word_count, noun_count, verb_count, adj_count, adv_count, phrase_count, pattern_count,
        cues, analysis, updated_at
      )
      VALUES (
        ${newId},
        ${title || 'Phim mới'},
        ${finalPlatform},
        ${url || ''},
        ${finalTimestamp},
        ${finalDate},
        ${wordCount || 0},
        ${nounCount || 0},
        ${verbCount || 0},
        ${adjCount || 0},
        ${advCount || 0},
        ${finalPhraseCount},
        ${finalPatternCount},
        ${JSON.stringify(cues || [])}::jsonb,
        ${JSON.stringify(analysis || {})}::jsonb,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        platform = EXCLUDED.platform,
        url = EXCLUDED.url,
        timestamp = EXCLUDED.timestamp,
        date_formatted = EXCLUDED.date_formatted,
        word_count = EXCLUDED.word_count,
        noun_count = EXCLUDED.noun_count,
        verb_count = EXCLUDED.verb_count,
        adj_count = EXCLUDED.adj_count,
        adv_count = EXCLUDED.adv_count,
        phrase_count = EXCLUDED.phrase_count,
        pattern_count = EXCLUDED.pattern_count,
        cues = EXCLUDED.cues,
        analysis = EXCLUDED.analysis,
        updated_at = NOW()
      RETURNING id, title;
    `;

    return NextResponse.json({ success: true, movie: rows[0] });
  } catch (error: any) {
    console.error('Error saving movie:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM fx_scanned_movies;`;
    return NextResponse.json({ success: true, message: 'All movies cleared' });
  } catch (error: any) {
    console.error('Error clearing movies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
