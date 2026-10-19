export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'pattern'
  | 'communicative'
  | 'highlight'
  | 'all';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';

export type PhraseCategory =
  | 'phrasal_verb'
  | 'collocation'
  | 'idiom'
  | 'slang'
  | string;

export type PlatformType = 'youtube' | 'netflix' | 'file';

export const POS_LABELS_VI: Record<string, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  phrase: 'Cụm từ',
  pattern: 'Cấu trúc câu',
  sentences: 'Câu giao tiếp',
  all: 'Tất cả'
};

export function getPosLabelVi(pos: string): string {
  if (!pos) return 'Từ vựng';
  const clean = pos.toLowerCase().trim();
  return POS_LABELS_VI[clean] || pos;
}

export interface VocabItem {
  word: string;
  lemma?: string;
  originalForm?: string;
  pos: string; // 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'pattern' | 'communicative' | 'highlight'
  posLabelVi?: string;
  cefr: string; // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  ipa: string;
  vietnamese: string;
  meaningVi?: string;
  frequency: number;
  contexts: Array<{ text: string; startSec?: number; endSec?: number }>;
  sentence?: string;
  cleanSentence?: string;
  isCommunicative?: boolean;
  isPhrase?: boolean;
  isPattern?: boolean;
  phraseCategory?: PhraseCategory;
  patternTemplate?: string;
  patternFormula?: string;
  highlightPhrase?: string;
  usageNote?: string;
  tag?: string;
  isNewMeaning?: boolean;
  mastered?: boolean;
}

export interface ScannedMovie {
  id: string;
  title: string;
  platform: PlatformType;
  url: string;
  timestamp: number;
  dateFormatted: string;
  wordCount: number;
  nounCount: number;
  verbCount: number;
  adjCount: number;
  advCount: number;
  phraseCount?: number;
  patternCount?: number;
  cues?: Array<{ text: string; start: number; end: number }>;
  analysis?: any;
  vocabulary?: VocabItem[];
}

export interface MasterItem {
  id: string;
  text: string;
  type: 'word' | 'phrase' | 'pattern' | 'sentence';
  pos?: string;
  cefr?: string;
  ipa?: string;
  knownMeanings: string[];
  context?: string;
  patternTemplate?: string;
  phraseCategory?: string;
  usageNote?: string;
  tag?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StarredItem {
  id: string;
  text: string;
  type?: 'word' | 'phrase' | 'pattern' | 'sentence';
  pos?: string;
  cefr?: string;
  ipa?: string;
  vietnamese?: string;
  meaningVi?: string;
  knownMeanings?: string[];
  context?: string;
  createdAt?: string;
  updatedAt?: string;
}
