import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

export const sql = databaseUrl ? neon(databaseUrl) : null;

export async function ensureSchema() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS fx_scanned_movies (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        platform VARCHAR(50) DEFAULT 'file',
        url TEXT DEFAULT '',
        timestamp BIGINT NOT NULL,
        date_formatted TEXT,
        word_count INT DEFAULT 0,
        noun_count INT DEFAULT 0,
        verb_count INT DEFAULT 0,
        adj_count INT DEFAULT 0,
        adv_count INT DEFAULT 0,
        cues JSONB DEFAULT '[]'::jsonb,
        analysis JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fx_master_known_list (
        id VARCHAR(100) PRIMARY KEY,
        text TEXT NOT NULL UNIQUE,
        type VARCHAR(50) DEFAULT 'word',
        pos VARCHAR(20) DEFAULT 'N',
        known_meanings JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
  } catch (err) {
    console.warn('[Neon Serverless] Schema ensure warning:', err);
  }
}
