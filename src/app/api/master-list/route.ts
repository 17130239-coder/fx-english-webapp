import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        text, 
        type, 
        pos, 
        cefr,
        ipa,
        context,
        known_meanings as "knownMeanings", 
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_master_known_list
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
    console.error('Error fetching master list:', error);
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

    // 1. Batch Import Support: { items: Array<{ text: string; type?: string; pos?: string; cefr?: string; ipa?: string; context?: string; meanings?: string[] }> }
    if (Array.isArray(body.items) && body.items.length > 0) {
      const insertedItems: any[] = [];
      for (const item of body.items) {
        if (!item || !item.text || !String(item.text).trim()) continue;
        const cleanText = String(item.text).trim().toLowerCase();
        const cleanType = String(item.type || (cleanText.includes(' ') ? 'phrase' : 'word'));
        const cleanPos = String(item.pos || 'N');
        const rawM = item.meanings || item.knownMeanings;
        const meanings = Array.isArray(rawM)
          ? rawM.map((m: any) => String(m).trim()).filter(Boolean)
          : ['Đã thuộc'];

        const itemId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const rows = await sql`
          INSERT INTO fx_master_known_list (id, text, type, pos, cefr, ipa, context, known_meanings, updated_at)
          VALUES (
            ${itemId},
            ${cleanText},
            ${cleanType},
            ${cleanPos},
            ${item.cefr || null},
            ${item.ipa || null},
            ${item.context || null},
            ${JSON.stringify(meanings)}::jsonb,
            NOW()
          )
          ON CONFLICT (text) DO UPDATE SET
            pos = EXCLUDED.pos,
            cefr = COALESCE(EXCLUDED.cefr, fx_master_known_list.cefr),
            ipa = COALESCE(EXCLUDED.ipa, fx_master_known_list.ipa),
            context = COALESCE(EXCLUDED.context, fx_master_known_list.context),
            known_meanings = EXCLUDED.known_meanings,
            updated_at = NOW()
          RETURNING id, text, type, pos, cefr, ipa, context, known_meanings as "knownMeanings";
        `;
        if (rows.length > 0) insertedItems.push(rows[0]);
      }
      return NextResponse.json({ success: true, count: insertedItems.length, items: insertedItems });
    }

    // 2. Single Item Creation
    const { text, type, pos, cefr, ipa, context, meanings, knownMeanings } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const clean = String(text).trim().toLowerCase();
    const cleanType = String(type || 'word');
    const cleanPos = String(pos || 'N');
    const rawMeanings = meanings || knownMeanings;
    const newMeanings = Array.isArray(rawMeanings) ? rawMeanings.map(m => String(m).trim()).filter(Boolean) : [];

    // Check existing
    const existing = await sql`
      SELECT id, text, type, pos, cefr, ipa, context, known_meanings as "knownMeanings" 
      FROM fx_master_known_list 
      WHERE text = ${clean} 
      LIMIT 1;
    `;

    let accumulatedMeanings = [...newMeanings];
    let id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (existing.length > 0) {
      id = existing[0].id;
      const prev = Array.isArray(existing[0].knownMeanings) ? existing[0].knownMeanings : [];
      newMeanings.forEach((m) => {
        if (!prev.includes(m)) {
          prev.push(m);
        }
      });
      accumulatedMeanings = prev;
    }

    const rows = await sql`
      INSERT INTO fx_master_known_list (id, text, type, pos, cefr, ipa, context, known_meanings, updated_at)
      VALUES (
        ${id},
        ${clean},
        ${cleanType},
        ${cleanPos},
        ${cefr || (existing[0]?.cefr || null)},
        ${ipa || (existing[0]?.ipa || null)},
        ${context || (existing[0]?.context || null)},
        ${JSON.stringify(accumulatedMeanings)}::jsonb,
        NOW()
      )
      ON CONFLICT (text) DO UPDATE SET
        pos = CASE WHEN EXCLUDED.pos IS NOT NULL AND EXCLUDED.pos != 'N' THEN EXCLUDED.pos ELSE fx_master_known_list.pos END,
        cefr = CASE WHEN EXCLUDED.cefr IS NOT NULL THEN EXCLUDED.cefr ELSE fx_master_known_list.cefr END,
        ipa = CASE WHEN EXCLUDED.ipa IS NOT NULL AND EXCLUDED.ipa != '' THEN EXCLUDED.ipa ELSE fx_master_known_list.ipa END,
        context = CASE WHEN EXCLUDED.context IS NOT NULL AND EXCLUDED.context != '' THEN EXCLUDED.context ELSE fx_master_known_list.context END,
        known_meanings = EXCLUDED.known_meanings,
        updated_at = NOW()
      RETURNING 
        id, 
        text, 
        type, 
        pos, 
        cefr,
        ipa,
        context,
        known_meanings as "knownMeanings", 
        created_at as "createdAt";
    `;

    return NextResponse.json({ success: true, item: rows[0] });
  } catch (error: any) {
    console.error('Error saving master item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!sql) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL is not configured' }, { status: 500 });
  }

  try {
    await ensureSchema();
    const url = new URL(req.url);
    const textOrId = url.searchParams.get('id') || url.searchParams.get('text');

    if (!textOrId) {
      // Clear all
      await sql`DELETE FROM fx_master_known_list;`;
      return NextResponse.json({ success: true, message: 'Master list cleared' });
    }

    const clean = String(textOrId).trim().toLowerCase();
    await sql`DELETE FROM fx_master_known_list WHERE id = ${clean} OR text = ${clean};`;
    return NextResponse.json({ success: true, deleted: clean });
  } catch (error: any) {
    console.error('Error deleting from master list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
