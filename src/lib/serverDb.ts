import { sql } from '@/lib/neon';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';
import { ScannedMovie, MasterItem, StarredItem } from '@/lib/types';

export async function getServerMovies(limit: number = 100): Promise<ScannedMovie[]> {
  if (!sql) return [];
  try {
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
        phrase_count as "phraseCount", 
        pattern_count as "patternCount", 
        created_at as "createdAt"
      FROM fx_scanned_movies
      ORDER BY timestamp DESC
      LIMIT ${limit};
    `;
    return rows as unknown as ScannedMovie[];
  } catch (e) {
    console.error('[serverDb] Error fetching movies:', e);
    return [];
  }
}

export async function getServerMasterList(): Promise<MasterItem[]> {
  if (!sql) return [];
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
    return rows as unknown as MasterItem[];
  } catch (e) {
    console.error('[serverDb] Error fetching master list:', e);
    return [];
  }
}

export async function getServerStarredList(): Promise<StarredItem[]> {
  if (!sql) return [];
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
        vietnamese, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM fx_starred_words
      ORDER BY created_at DESC;
    `;
    return rows as unknown as StarredItem[];
  } catch (e) {
    console.error('[serverDb] Error fetching starred list:', e);
    return [];
  }
}

export async function getServerDashboardData() {
  if (!sql) {
    return {
      movies: [],
      masterItems: [],
      starredItems: [],
      connected: false,
    };
  }

  try {
    const [movies, masterItems, starredItems] = await Promise.all([
      getServerMovies(100),
      getServerMasterList(),
      getServerStarredList(),
    ]);

    return {
      movies,
      masterItems,
      starredItems,
      connected: true,
    };
  } catch (e) {
    console.error('[serverDb] Error batch fetching dashboard data:', e);
    return {
      movies: [],
      masterItems: [],
      starredItems: [],
      connected: false,
    };
  }
}

export async function getServerMovieDetails(
  id: string,
  options: { includeCues?: boolean; rawAnalysis?: boolean } = {}
): Promise<ScannedMovie | null> {
  if (!sql || !id) return null;

  try {
    const cleanId = decodeURIComponent(id).trim();
    let rows;

    if (options.includeCues) {
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
        WHERE id = ${cleanId}
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
        WHERE id = ${cleanId}
        LIMIT 1;
      `;
    }

    if (!rows || rows.length === 0) return null;

    const movie = rows[0] as unknown as ScannedMovie;

    if (!options.rawAnalysis && movie.analysis) {
      let analysisObj = movie.analysis;
      if (typeof analysisObj === 'string') {
        try {
          analysisObj = JSON.parse(analysisObj);
        } catch {
          analysisObj = {};
        }
      }
      movie.vocabulary = extractVocabFromAnalysis(analysisObj);
      delete movie.analysis;
    }

    return movie;
  } catch (e) {
    console.error('[serverDb] Error fetching movie details for id:', id, e);
    return null;
  }
}
