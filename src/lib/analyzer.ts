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

import { VocabItem } from './types';

export function extractVocabFromAnalysis(analysis: any): VocabItem[] {
  if (!analysis) return [];
  const list: VocabItem[] = [];

  // Categories: Noun, Verb, Adjective, Adverb
  const categories = ['noun', 'verb', 'adjective', 'adverb'];
  categories.forEach((posKey) => {
    const cat = analysis.categories?.[posKey];
    if (cat && Array.isArray(cat.words)) {
      cat.words.forEach((w: any) => {
        list.push({
          word: w.word,
          pos: posKey,
          posLabelVi: cat.labelVi || posKey,
          cefr: w.cefr || 'B1',
          ipa: w.ipa || '',
          vietnamese: w.vietnamese || '',
          meaningVi: w.vietnamese || '',
          frequency: w.frequency || 1,
          contexts: Array.isArray(w.contexts) ? w.contexts : [],
          mastered: false
        });
      });
    }
  });

  // Communicative Sentences (Phrases, Collocations, Idioms, Slang)
  const rawSentences: any[] =
    (Array.isArray(analysis.communicativeSentences) && analysis.communicativeSentences.length > 0)
      ? analysis.communicativeSentences
      : (Array.isArray(analysis.categories?.sentences?.words) && analysis.categories.sentences.words.length > 0)
      ? analysis.categories.sentences.words
      : (Array.isArray(analysis.posGroups?.sentences) && analysis.posGroups.sentences.length > 0)
      ? analysis.posGroups.sentences
      : (Array.isArray(analysis.sentences) ? analysis.sentences : []);

  rawSentences.forEach((s: any) => {
    const text = s.cleanSentence || s.sentence || s.text || '';
    if (!text) return;
    list.push({
      word: text,
      sentence: text,
      cleanSentence: text,
      pos: 'communicative',
      isCommunicative: true,
      cefr: s.cefr || 'B1',
      ipa: s.ipa || '',
      vietnamese: s.vietnamese || s.meaningVi || '',
      meaningVi: s.vietnamese || s.meaningVi || '',
      frequency: s.frequency || 1,
      contexts: [{ text }],
      highlightPhrase: s.highlightPhrase || '',
      usageNote: s.usageNote || '',
      tag: s.tag || 'Giao tiếp'
    });
  });

  return list;
}
