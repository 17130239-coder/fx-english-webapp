import { VocabItem } from './types';

/**
 * Lightweight, zero-dependency extractor that converts raw database analysis JSONB
 * into a strongly-typed VocabItem[] array.
 * Highly optimized for ultra-fast page loading without pulling in 450KB+ of NLP libraries into client bundles.
 */
export function extractVocabFromAnalysis(analysis: any): VocabItem[] {
  if (!analysis) return [];
  const list: VocabItem[] = [];

  // 1. Categories: Noun, Verb, Adjective, Adverb
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

  // 2. Dedicated Phrases (Cụm từ) from analysis.phrases or analysis.highlights
  const rawPhrases: any[] = Array.isArray(analysis.phrases)
    ? analysis.phrases
    : Array.isArray(analysis.highlights)
    ? analysis.highlights
    : (analysis.categories?.phrase?.words || []);

  const addedPhraseKeys = new Set<string>();

  rawPhrases.forEach((p: any) => {
    const phraseText = p.phrase || p.word || p.text || '';
    if (!phraseText) return;
    const k = phraseText.trim().toLowerCase();
    if (addedPhraseKeys.has(k)) return;
    addedPhraseKeys.add(k);

    list.push({
      word: phraseText,
      pos: 'phrase',
      posLabelVi: 'Cụm từ',
      cefr: p.cefr || 'B2',
      ipa: p.ipa || '',
      vietnamese: p.meaningVi || p.vietnamese || '',
      meaningVi: p.meaningVi || p.vietnamese || '',
      frequency: p.frequency || 1,
      contexts: p.contextSentence ? [{ text: p.contextSentence }] : (Array.isArray(p.contexts) ? p.contexts : []),
      isPhrase: true,
      phraseCategory: p.category || 'collocation',
      usageNote: p.nuance || p.usageNote || '',
      tag: p.tag || 'Cụm từ',
      mastered: false
    });
  });

  // 3. Dedicated Sentence Structures / Patterns (Cấu trúc câu)
  const rawPatterns: any[] = Array.isArray(analysis.sentenceStructures)
    ? analysis.sentenceStructures
    : Array.isArray(analysis.patterns)
    ? analysis.patterns
    : Array.isArray(analysis.sentence_structures)
    ? analysis.sentence_structures
    : (analysis.categories?.pattern?.words || []);

  const addedPatternKeys = new Set<string>();

  rawPatterns.forEach((pt: any) => {
    const patternText = pt.pattern || pt.formula || pt.phrase || pt.word || pt.text || '';
    if (!patternText) return;
    const k = patternText.trim().toLowerCase();
    if (addedPatternKeys.has(k)) return;
    addedPatternKeys.add(k);

    const example = pt.exampleSentence || pt.contextSentence || pt.sentence || '';
    list.push({
      word: patternText,
      sentence: example,
      pos: 'pattern',
      posLabelVi: 'Cấu trúc câu',
      cefr: pt.cefr || 'B1',
      ipa: '',
      vietnamese: pt.meaningVi || pt.vietnamese || '',
      meaningVi: pt.meaningVi || pt.vietnamese || '',
      frequency: pt.frequency || 1,
      contexts: example ? [{ text: example }] : (Array.isArray(pt.contexts) ? pt.contexts : []),
      isPattern: true,
      patternTemplate: pt.pattern || pt.formula || pt.patternTemplate || patternText,
      usageNote: pt.explanation || pt.usageNote || pt.note || '',
      tag: pt.tag || 'Cấu trúc câu',
      mastered: false
    });
  });

  // 4. Backward Compatibility: Parse communicativeSentences into Phrases & Patterns
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
    const highlight = s.highlightPhrase || '';
    if (!text && !highlight) return;

    // Check if this is a sentence structure pattern or a phrase
    const tag = (s.tag || '').toLowerCase();
    const isPatternType =
      tag.includes('đề xuất') ||
      tag.includes('nhờ vả') ||
      tag.includes('cấu trúc') ||
      highlight.includes('/') ||
      highlight.includes('why don') ||
      highlight.includes('would you') ||
      highlight.includes('how about');

    if (isPatternType) {
      const pKey = (highlight || text).trim().toLowerCase();
      if (!addedPatternKeys.has(pKey)) {
        addedPatternKeys.add(pKey);
        list.push({
          word: highlight || text,
          sentence: text,
          pos: 'pattern',
          posLabelVi: 'Cấu trúc câu',
          cefr: s.cefr || 'B1',
          ipa: '',
          vietnamese: s.vietnamese || s.meaningVi || '',
          meaningVi: s.vietnamese || s.meaningVi || '',
          frequency: s.frequency || 1,
          contexts: [{ text }],
          isPattern: true,
          patternTemplate: highlight || text,
          usageNote: s.usageNote || '',
          tag: 'Cấu trúc câu',
          mastered: false
        });
      }
    } else {
      // It's a phrase (Collocation, Idiom, Phrasal verb)
      const phraseWord = highlight || text;
      const pKey = phraseWord.trim().toLowerCase();
      if (!addedPhraseKeys.has(pKey)) {
        addedPhraseKeys.add(pKey);
        list.push({
          word: phraseWord,
          sentence: text !== phraseWord ? text : '',
          pos: 'phrase',
          posLabelVi: 'Cụm từ',
          cefr: s.cefr || 'B1',
          ipa: s.ipa || '',
          vietnamese: s.vietnamese || s.meaningVi || '',
          meaningVi: s.vietnamese || s.meaningVi || '',
          frequency: s.frequency || 1,
          contexts: [{ text }],
          isPhrase: true,
          phraseCategory: s.category || 'idiom',
          highlightPhrase: highlight,
          usageNote: s.usageNote || '',
          tag: 'Cụm từ',
          mastered: false
        });
      }
    }
  });

  return list;
}
