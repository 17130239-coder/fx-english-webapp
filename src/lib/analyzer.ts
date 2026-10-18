// Offline NLP Analyzer & Subtitle Parser (100% Client-side, Strictly Zero AI)

let parserModule: any = null;
let analyzerModule: any = null;

export function getParser() {
  if (typeof window === 'undefined') return null;
  if (!parserModule) {
    try {
      parserModule = require('./subtitleParser.js');
    } catch (e) {
      parserModule = (window as any).APP_SUBTITLE_PARSER || null;
    }
  }
  return parserModule;
}

export function getAnalyzer() {
  if (typeof window === 'undefined') return null;
  if (!analyzerModule) {
    try {
      // Ensure compromise and cefrDict are loaded
      require('./compromise.js');
      require('./cefrDict.js');
      analyzerModule = require('./vocabAnalyzer.js');
    } catch (e) {
      analyzerModule = (window as any).APP_VOCAB_ANALYZER || null;
    }
  }
  return analyzerModule;
}

export function parseSubtitles(text: string) {
  const parser = getParser();
  if (parser && typeof parser.parse === 'function') {
    return parser.parse(text);
  }
  // Fallback simple line chunker
  return text.split('\n\n').filter(Boolean).map((chunk, idx) => ({
    start: idx * 3,
    end: (idx + 1) * 3,
    text: chunk.replace(/^\d+\s+/, '').replace(/\d{2}:\d{2}:\d{2}.*/, '').trim()
  })).filter(c => c.text);
}

export function analyzeSubtitlesOffline(cues: Array<{ text: string; start?: number; end?: number }>) {
  const analyzer = getAnalyzer();
  if (!analyzer) {
    throw new Error('VocabAnalyzer could not be initialized.');
  }
  return analyzer.analyzeSubtitles(cues);
}
