import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

export const sql = databaseUrl ? neon(databaseUrl) : null;

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (!sql || schemaEnsured) return;

  if (!schemaPromise) {
    schemaPromise = (async () => {
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
            phrase_count INT DEFAULT 0,
            pattern_count INT DEFAULT 0,
            cues JSONB DEFAULT '[]'::jsonb,
            analysis JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`ALTER TABLE fx_scanned_movies ADD COLUMN IF NOT EXISTS phrase_count INT DEFAULT 0;`;
        await sql`ALTER TABLE fx_scanned_movies ADD COLUMN IF NOT EXISTS pattern_count INT DEFAULT 0;`;

        await sql`
          CREATE TABLE IF NOT EXISTS fx_master_known_list (
            id VARCHAR(100) PRIMARY KEY,
            text TEXT NOT NULL UNIQUE,
            type VARCHAR(50) DEFAULT 'word',
            pos VARCHAR(20) DEFAULT 'N',
            cefr VARCHAR(10),
            ipa TEXT,
            context TEXT,
            known_meanings JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`ALTER TABLE fx_master_known_list ADD COLUMN IF NOT EXISTS cefr VARCHAR(10);`;
        await sql`ALTER TABLE fx_master_known_list ADD COLUMN IF NOT EXISTS ipa TEXT;`;
        await sql`ALTER TABLE fx_master_known_list ADD COLUMN IF NOT EXISTS context TEXT;`;

        await sql`
          CREATE TABLE IF NOT EXISTS fx_starred_words (
            id VARCHAR(100) PRIMARY KEY,
            text TEXT NOT NULL UNIQUE,
            type VARCHAR(50) DEFAULT 'word',
            pos VARCHAR(20) DEFAULT 'N',
            cefr VARCHAR(10),
            ipa TEXT,
            context TEXT,
            vietnamese TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        // Create performance indexes for frequent query paths
        await sql`CREATE INDEX IF NOT EXISTS idx_movies_timestamp ON fx_scanned_movies (timestamp DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_movies_url ON fx_scanned_movies (url);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_master_text ON fx_master_known_list (text);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_starred_text ON fx_starred_words (text);`;

        schemaEnsured = true;
      } catch (err) {
        console.warn('[Neon Serverless] Schema ensure warning:', err);
      } finally {
        schemaPromise = null;
      }
    })();
  }

  return schemaPromise;
}
