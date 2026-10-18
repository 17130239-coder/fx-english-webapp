import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/neon';

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
        known_meanings as "knownMeanings", 
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_master_known_list
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({ success: true, items: rows });
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
    const { text, type, pos, meanings } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const clean = String(text).trim().toLowerCase();
    const cleanType = String(type || 'word');
    const cleanPos = String(pos || 'N');
    const newMeanings = Array.isArray(meanings) ? meanings.map(m => String(m).trim()).filter(Boolean) : [];

    // Check existing
    const existing = await sql`
      SELECT id, text, type, pos, known_meanings as "knownMeanings" 
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
      INSERT INTO fx_master_known_list (id, text, type, pos, known_meanings, updated_at)
      VALUES (
        ${id},
        ${clean},
        ${cleanType},
        ${cleanPos},
        ${JSON.stringify(accumulatedMeanings)}::jsonb,
        NOW()
      )
      ON CONFLICT (text) DO UPDATE SET
        pos = EXCLUDED.pos,
        known_meanings = EXCLUDED.known_meanings,
        updated_at = NOW()
      RETURNING 
        id, 
        text, 
        type, 
        pos, 
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
