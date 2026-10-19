import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT 
        id, 
        text, 
        type, 
        pos, 
        cefr,
        ipa,
        context,
        vietnamese,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_starred_words
      ORDER BY created_at DESC;
    `;

    return NextResponse.json(
      { success: true, items: rows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=59'
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching starred words:', error);
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
    const { text, type, pos, cefr, ipa, context, vietnamese } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const clean = String(text).trim().toLowerCase();
    const cleanType = String(type || (clean.includes(' ') ? 'phrase' : 'word'));
    const cleanPos = String(pos || 'N');
    const cleanVietnamese = String(vietnamese || '').trim();
    const id = `star_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const rows = await sql`
      INSERT INTO fx_starred_words (id, text, type, pos, cefr, ipa, context, vietnamese, updated_at)
      VALUES (
        ${id},
        ${clean},
        ${cleanType},
        ${cleanPos},
        ${cefr || null},
        ${ipa || null},
        ${context || null},
        ${cleanVietnamese || null},
        NOW()
      )
      ON CONFLICT (text) DO UPDATE SET
        pos = CASE WHEN EXCLUDED.pos IS NOT NULL AND EXCLUDED.pos != 'N' THEN EXCLUDED.pos ELSE fx_starred_words.pos END,
        cefr = CASE WHEN EXCLUDED.cefr IS NOT NULL THEN EXCLUDED.cefr ELSE fx_starred_words.cefr END,
        ipa = CASE WHEN EXCLUDED.ipa IS NOT NULL AND EXCLUDED.ipa != '' THEN EXCLUDED.ipa ELSE fx_starred_words.ipa END,
        context = CASE WHEN EXCLUDED.context IS NOT NULL AND EXCLUDED.context != '' THEN EXCLUDED.context ELSE fx_starred_words.context END,
        vietnamese = CASE WHEN EXCLUDED.vietnamese IS NOT NULL AND EXCLUDED.vietnamese != '' THEN EXCLUDED.vietnamese ELSE fx_starred_words.vietnamese END,
        updated_at = NOW()
      RETURNING 
        id, 
        text, 
        type, 
        pos, 
        cefr,
        ipa,
        context,
        vietnamese, 
        created_at as "createdAt";
    `;

    return NextResponse.json({ success: true, item: rows[0] });
  } catch (error: any) {
    console.error('Error saving starred word:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    if (text) {
      const clean = text.trim().toLowerCase();
      await sql`DELETE FROM fx_starred_words WHERE text = ${clean};`;
      return NextResponse.json({ success: true, text: clean });
    }

    // Clear all
    await sql`DELETE FROM fx_starred_words;`;
    return NextResponse.json({ success: true, message: 'All starred words cleared' });
  } catch (error: any) {
    console.error('Error deleting starred word:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
