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
  phraseCategory?: 'phrasal_verb' | 'idiom' | 'collocation' | 'slang' | string;
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
  platform: 'youtube' | 'netflix' | 'file';
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
