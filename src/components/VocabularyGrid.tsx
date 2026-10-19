'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, Check, Star, Search } from 'lucide-react';
import { VocabItem } from '@/lib/types';
import { speakWord } from '@/lib/speech';

interface VocabularyGridProps {
  movieTitle: string;
  items: VocabItem[];
  masteredWords: Set<string>;
  starredWords: Set<string>;
  onToggleMaster: (item: VocabItem) => void;
  onToggleStar: (word: string, item?: VocabItem) => void;
}

function cleanAndNormalizeSentence(text: string): string {
  if (!text) return '';
  let str = String(text).trim();
  str = str.replace(/[♪♫#]/g, '').trim();
  str = str.replace(/\[[^\]]+\]/g, ' ').replace(/\([^)]+\)/g, ' ').trim();
  str = str.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  str = str.replace(/[,;]+$/, '').trim();
  str = str.replace(/\s+/g, ' ');

  const letters = str.replace(/[^a-zA-Z]/g, '');
  const upper = str.replace(/[^A-Z]/g, '');
  if (letters.length >= 3 && (upper.length / letters.length) > 0.65) {
    str = str.toLowerCase();
    str = str.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
    str = str.replace(/\b(i)\b/g, 'I');
    str = str.replace(/\bi'([a-z]+)\b/g, (_, p1) => "I'" + p1);
  }
  return str;
}

function scoreContextSentence(text: string): number {
  if (!text) return -100;
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  let score = 0;
  if (wordCount >= 6 && wordCount <= 22) score += 60;
  else if (wordCount >= 4 && wordCount <= 28) score += 40;
  else if (wordCount < 3) score -= 60;
  else if (wordCount < 4) score -= 30;
  if (/[.!?]$/.test(text.trim())) score += 20;
  else if (/[,;:\-]$/.test(text.trim())) score -= 20;
  if (/\b(I|you|he|she|it|we|they|the|this|that|is|are|was|were|have|do|can|will|would)\b/i.test(text)) {
    score += 15;
  }
  return score;
}

function renderHighlightedContext(sentence: string, word: string) {
  if (!sentence) return null;
  const normalized = cleanAndNormalizeSentence(sentence);
  if (!word) return normalized;

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
  const parts = normalized.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <b key={i} className="fx-quote-highlight">
            {part}
          </b>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function VocabularyGrid({
  movieTitle,
  items,
  masteredWords,
  starredWords,
  onToggleMaster,
  onToggleStar
}: VocabularyGridProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'pattern'>('all');
  const [cefrFilter, setCefrFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [hideMastered, setHideMastered] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(48);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts for Vocabulary Grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

      // Focus search: '/' or 'Ctrl+K' / 'Cmd+K'
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'Escape') {
        if (active === searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.blur();
          return;
        }
      }

      // If user is currently typing in an input, do not intercept single-letter shortcuts
      if (isInput) return;

      // 'H' / 'h': Toggle hide mastered
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHideMastered((prev) => !prev);
        return;
      }

      // Number keys 1-7 for POS tabs
      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('all');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('noun');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('verb');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveTab('adjective');
      } else if (e.key === '5') {
        e.preventDefault();
        setActiveTab('adverb');
      } else if (e.key === '6') {
        e.preventDefault();
        setActiveTab('phrase');
      } else if (e.key === '7') {
        e.preventDefault();
        setActiveTab('pattern');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Count how many items in this movie are already in master list
  const masteredCountInMovie = useMemo(() => {
    let count = 0;
    (items || []).forEach((item) => {
      if (!item) return;
      const k = (item.word || item.sentence || '').trim().toLowerCase();
      if (masteredWords.has(k)) count++;
    });
    return count;
  }, [items, masteredWords]);

  // Stats
  const stats = useMemo(() => {
    let nouns = 0, verbs = 0, adjs = 0, advs = 0, phrases = 0, patterns = 0;
    let cefrA1 = 0, cefrA2 = 0, cefrB1 = 0, cefrB2 = 0, cefrC1C2 = 0;

    (items || []).forEach((item) => {
      if (!item) return;
      if (item.pos === 'pattern' || item.isPattern) patterns++;
      else if (item.pos === 'phrase' || item.isPhrase) phrases++;
      else if (item.pos === 'noun') nouns++;
      else if (item.pos === 'verb') verbs++;
      else if (item.pos === 'adjective') adjs++;
      else if (item.pos === 'adverb') advs++;
      else if (item.sentence || item.isCommunicative) phrases++;

      const c = (item.cefr || '').toUpperCase();
      if (c === 'A1') cefrA1++;
      else if (c === 'A2') cefrA2++;
      else if (c === 'B1') cefrB1++;
      else if (c === 'B2') cefrB2++;
      else if (c === 'C1' || c === 'C2') cefrC1C2++;
    });

    return {
      total: items.length,
      nouns,
      verbs,
      adjs,
      advs,
      phrases,
      patterns,
      cefrA1,
      cefrA2,
      cefrB1,
      cefrB2,
      cefrC1C2
    };
  }, [items]);

  // Filtered Items
  const filtered = useMemo(() => {
    return (items || []).filter((item) => {
      if (!item) return false;
      const k = (item.word || item.sentence || '').trim().toLowerCase();

      // Hide Mastered Filter (Deduplication against Master List)
      if (hideMastered && masteredWords.has(k)) {
        return false;
      }

      // POS Tab
      if (activeTab === 'phrase') {
        if (item.pos !== 'phrase' && !item.isPhrase && (!item.isCommunicative || item.isPattern)) return false;
      } else if (activeTab === 'pattern') {
        if (item.pos !== 'pattern' && !item.isPattern) return false;
      } else if (activeTab !== 'all') {
        if (item.pos !== activeTab) return false;
      }

      // CEFR Filter
      if (cefrFilter !== 'all') {
        if ((item.cefr || '').toUpperCase() !== cefrFilter.toUpperCase()) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const wordMatch = k.includes(q);
        const transMatch = (item.vietnamese || item.meaningVi || '').toLowerCase().includes(q);
        const phraseMatch = (item.highlightPhrase || '').toLowerCase().includes(q);
        const templateMatch = (item.patternTemplate || '').toLowerCase().includes(q);
        const noteMatch = (item.usageNote || '').toLowerCase().includes(q);
        const tagMatch = (item.tag || '').toLowerCase().includes(q);
        if (!wordMatch && !transMatch && !phraseMatch && !templateMatch && !noteMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [items, activeTab, cefrFilter, search, hideMastered, masteredWords]);

  // Reset display limit when filter criteria change
  useEffect(() => {
    setDisplayLimit(48);
  }, [activeTab, cefrFilter, search, hideMastered]);

  // Infinite Scroll IntersectionObserver to progressively render cards without jank
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => Math.min(prev + 48, 5000));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length]);

  if (items.length === 0) return null;

  const totalWordsForCefr = (stats.cefrA1 + stats.cefrA2 + stats.cefrB1 + stats.cefrB2 + stats.cefrC1C2) || 1;
  const pctA1 = Math.round((stats.cefrA1 / totalWordsForCefr) * 100);
  const pctA2 = Math.round((stats.cefrA2 / totalWordsForCefr) * 100);
  const pctB1 = Math.round((stats.cefrB1 / totalWordsForCefr) * 100);
  const pctB2 = Math.round((stats.cefrB2 / totalWordsForCefr) * 100);
  const pctC1C2 = Math.round((stats.cefrC1C2 / totalWordsForCefr) * 100);

  return (
    <div className="fx-vocab-section">
      {/* Stats Summary Strip (Tesla Dashboard KPIs) */}
      <div className="fx-stats-strip">
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.total}</span>
          <span className="fx-stat-name">Tổng Từ Vựng</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.nouns}</span>
          <span className="fx-stat-name">Danh Từ</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.verbs}</span>
          <span className="fx-stat-name">Động Từ</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.adjs}</span>
          <span className="fx-stat-name">Tính Từ</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.advs}</span>
          <span className="fx-stat-name">Trạng Từ</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.phrases}</span>
          <span className="fx-stat-name">Cụm Từ</span>
        </div>
        <div className="fx-stat-card">
          <span className="fx-stat-num">{stats.patterns}</span>
          <span className="fx-stat-name">Cấu Trúc Câu</span>
        </div>
      </div>

      {/* CEFR Vocabulary Stacked Distribution Bar */}
      <div className="fx-cefr-dist-bar-wrap">
        <div className="fx-cefr-dist-header">
          <span className="fx-cefr-dist-title">Phân bố cấp độ CEFR</span>
          <span className="fx-cefr-dist-stats">
            A1: {stats.cefrA1} · A2: {stats.cefrA2} · B1: {stats.cefrB1} · B2: {stats.cefrB2} · C1/C2: {stats.cefrC1C2}
          </span>
        </div>
        <div className="fx-cefr-stacked-bar">
          <div className="fx-cefr-seg fx-cefr-a1" style={{ width: `${pctA1}%` }} title={`A1: ${stats.cefrA1} (${pctA1}%)`} />
          <div className="fx-cefr-seg fx-cefr-a2" style={{ width: `${pctA2}%` }} title={`A2: ${stats.cefrA2} (${pctA2}%)`} />
          <div className="fx-cefr-seg fx-cefr-b1" style={{ width: `${pctB1}%` }} title={`B1: ${stats.cefrB1} (${pctB1}%)`} />
          <div className="fx-cefr-seg fx-cefr-b2" style={{ width: `${pctB2}%` }} title={`B2: ${stats.cefrB2} (${pctB2}%)`} />
          <div className="fx-cefr-seg fx-cefr-c1c2" style={{ width: `${pctC1C2}%` }} title={`C1/C2: ${stats.cefrC1C2} (${pctC1C2}%)`} />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="fx-filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* POS Tabs */}
          <div className="fx-tabs-group" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            {[
              { id: 'all', label: 'Tất cả', keyNum: '1', count: items.length },
              { id: 'noun', label: 'Danh từ', keyNum: '2', count: stats.nouns },
              { id: 'verb', label: 'Động từ', keyNum: '3', count: stats.verbs },
              { id: 'adjective', label: 'Tính từ', keyNum: '4', count: stats.adjs },
              { id: 'adverb', label: 'Trạng từ', keyNum: '5', count: stats.advs },
              { id: 'phrase', label: 'Cụm từ', keyNum: '6', count: stats.phrases },
              { id: 'pattern', label: 'Cấu trúc câu', keyNum: '7', count: stats.patterns }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`fx-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                title={`${tab.label} (phím tắt ${tab.keyNum})`}
              >
                <span>{tab.label}</span>
                <span className="fx-nav-pill-count" style={{ marginLeft: '4px' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, CEFR Dropdown & Hide Mastered Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Toggle Hide Mastered (Deduplication against Master List) */}
            <button
              type="button"
              onClick={() => setHideMastered(!hideMastered)}
              className={`fx-btn-tesla-ghost-sm ${hideMastered ? 'active' : ''}`}
              title={hideMastered ? 'Đang ẩn từ đã thuộc (phím tắt H để hiện)' : 'Ẩn các từ đã thuộc trong Master List (phím tắt H)'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: hideMastered ? 'rgba(16, 185, 129, 0.4)' : 'var(--fx-border-subtle)',
                backgroundColor: hideMastered ? 'rgba(16, 185, 129, 0.12)' : 'var(--fx-bg-surface)',
                color: hideMastered ? '#10B981' : 'var(--fx-text-secondary)',
                cursor: 'pointer',
                transition: 'var(--fx-transition-fast)'
              }}
            >
              <Check size={13} style={{ strokeWidth: hideMastered ? 2.5 : 1.8 }} />
              <span>Ẩn từ đã thuộc{masteredCountInMovie > 0 ? ` (${masteredCountInMovie})` : ''}</span>
            </button>

            <select
              value={cefrFilter}
              onChange={(e) => setCefrFilter(e.target.value)}
              className="fx-select-sm"
            >
              <option value="all">Mọi cấp độ CEFR</option>
              <option value="A1">A1 (Cơ bản)</option>
              <option value="A2">A2 (Sơ cấp)</option>
              <option value="B1">B1 (Trung cấp)</option>
              <option value="B2">B2 (Trung cao)</option>
              <option value="C1">C1 (Cao cấp)</option>
              <option value="C2">C2 (Thành thạo)</option>
            </select>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--fx-text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm... (/)"
                title="Tìm kiếm từ hoặc nghĩa (phím tắt /)"
                className="fx-input fx-search-field"
                style={{ paddingLeft: '30px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Cards Grid (Tesla 3-Line Hardware Look) */}
      <div key={activeTab} className="fx-cards-grid fx-tab-pane">
        {filtered.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '50px 20px',
              textAlign: 'center',
              background: 'var(--fx-bg-surface)',
              border: '1px solid var(--fx-border-subtle)',
              borderRadius: '8px'
            }}
          >
            <p style={{ color: 'var(--fx-text-secondary)', fontSize: '13.5px', marginBottom: '14px' }}>
              Không tìm thấy từ vựng, cụm từ hoặc cấu trúc nào phù hợp với bộ lọc hiện tại.
            </p>
            {(search || cefrFilter !== 'all' || activeTab !== 'all' || hideMastered) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCefrFilter('all');
                  setActiveTab('all');
                  setHideMastered(false);
                }}
                className="fx-btn-tesla-ghost-sm"
                style={{ margin: '0 auto', fontSize: '12px' }}
              >
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          filtered.slice(0, displayLimit).map((item, idx) => {
          const key = (item.word || item.sentence || '').trim().toLowerCase();
          const isMastered = masteredWords.has(key);
          const isStarred = starredWords.has(key);

          // 1. Sentence Pattern / Structure Card
          if (item.pos === 'pattern' || item.isPattern) {
            const example = item.sentence || item.contexts?.[0]?.text || '';
            return (
              <div key={idx} className="fx-sentence-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                <div className="fx-sent-top">
                  <div className="fx-sent-meta-left">
                    <span className="fx-sent-tag" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                      CẤU TRÚC CÂU
                    </span>
                    {item.cefr && <span className="fx-nav-pill-count">{item.cefr}</span>}
                  </div>
                  <div className="fx-sent-actions">
                    <button
                      type="button"
                      onClick={() => onToggleStar(key, item)}
                      className={`fx-btn-icon-raw ${isStarred ? 'fx-btn-star active' : ''}`}
                      title={isStarred ? 'Bỏ lưu' : 'Lưu cấu trúc'}
                    >
                      <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakWord(example || item.word, 0.9)}
                      className="fx-btn-icon-raw"
                      title="Phát âm câu ví dụ"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleMaster(item)}
                      className={`fx-btn-icon-raw ${isMastered ? 'fx-btn-check active' : ''}`}
                      title={isMastered ? 'Bỏ khỏi Master List' : 'Đánh dấu đã biết'}
                    >
                      <Check size={13} />
                    </button>
                  </div>
                </div>

                <div className="fx-sent-body">
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--fx-text-primary)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                    {item.patternTemplate || item.word}
                  </div>
                  <p className="fx-sent-trans" style={{ color: 'var(--fx-text-primary)', fontWeight: 500, fontSize: '13px', margin: '4px 0 6px' }}>
                    {item.vietnamese || item.meaningVi}
                  </p>
                  {example && (
                    <p className="fx-sent-quote" style={{ fontStyle: 'italic', color: 'var(--fx-text-secondary)', fontSize: '12px' }}>
                      "{cleanAndNormalizeSentence(example)}"
                    </p>
                  )}
                </div>

                {item.usageNote && (
                  <div className="fx-sent-footer">
                    <span className="fx-sent-note">{item.usageNote}</span>
                  </div>
                )}
              </div>
            );
          }

          // 2. Phrase Card (Collocation, Idiom, Phrasal Verb)
          if (item.pos === 'phrase' || item.isPhrase) {
            const quote = item.sentence || item.contexts?.[0]?.text || '';
            const phraseLabel = item.phraseCategory === 'phrasal_verb'
              ? 'ĐỘNG TỪ GHÉP'
              : item.phraseCategory === 'idiom'
              ? 'THÀNH NGỮ'
              : item.phraseCategory === 'slang'
              ? 'TIẾNG LÓNG'
              : 'CỤM TỪ';

            return (
              <div key={idx} className="fx-sentence-card" style={{ borderColor: 'rgba(234, 179, 8, 0.25)' }}>
                <div className="fx-sent-top">
                  <div className="fx-sent-meta-left">
                    <span className="fx-sent-tag" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#FACC15', borderColor: 'rgba(234, 179, 8, 0.25)' }}>
                      {phraseLabel}
                    </span>
                    {item.cefr && <span className="fx-nav-pill-count">{item.cefr}</span>}
                    {item.frequency > 1 && <span className="fx-nav-pill-count">{item.frequency}x</span>}
                  </div>
                  <div className="fx-sent-actions">
                    <button
                      type="button"
                      onClick={() => onToggleStar(key, item)}
                      className={`fx-btn-icon-raw ${isStarred ? 'fx-btn-star active' : ''}`}
                      title={isStarred ? 'Bỏ lưu' : 'Lưu cụm từ'}
                    >
                      <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakWord(item.word, 0.95)}
                      className="fx-btn-icon-raw"
                      title="Phát âm cụm từ"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleMaster(item)}
                      className={`fx-btn-icon-raw ${isMastered ? 'fx-btn-check active' : ''}`}
                      title={isMastered ? 'Bỏ khỏi Master List' : 'Đánh dấu đã biết'}
                    >
                      <Check size={13} />
                    </button>
                  </div>
                </div>

                <div className="fx-sent-body">
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--fx-text-primary)', marginBottom: '4px' }}>
                    {item.word}
                  </div>
                  <p className="fx-sent-trans" style={{ color: 'var(--fx-text-primary)', fontSize: '13px', margin: '4px 0 6px' }}>
                    {item.vietnamese || item.meaningVi}
                  </p>
                  {quote && (
                    <p className="fx-sent-quote" style={{ fontStyle: 'italic', color: 'var(--fx-text-secondary)', fontSize: '12px' }}>
                      "{renderHighlightedContext(quote, item.highlightPhrase || item.word)}"
                    </p>
                  )}
                </div>

                {item.usageNote && (
                  <div className="fx-sent-footer">
                    <span className="fx-sent-note">{item.usageNote}</span>
                  </div>
                )}
              </div>
            );
          }

          // Standard Vocabulary Word Card: pick richest context
          const contextCandidates = Array.isArray(item.contexts) ? [...item.contexts] : [];
          if (contextCandidates.length > 1) {
            contextCandidates.sort((a, b) => scoreContextSentence(b.text || '') - scoreContextSentence(a.text || ''));
          }
          const contextSentence = contextCandidates[0]?.text || '';

          return (
            <div key={idx} className="fx-word-card">
              {/* Line 1: Word + POS + CEFR + Frequency + Actions */}
              <div className="fx-card-line-1">
                <div className="fx-card-word-wrap">
                  <span className="fx-card-word">{item.word}</span>
                  <span className="fx-card-specs">
                    {item.posLabelVi || item.pos}
                    {item.cefr && ` · ${item.cefr}`}
                    {item.frequency > 1 && ` · ${item.frequency}x`}
                  </span>
                </div>

                <div className="fx-card-meta-actions">
                  <button
                    type="button"
                    onClick={() => speakWord(item.word, 1.0)}
                    className="fx-btn-icon-raw"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStar(key, item)}
                    className={`fx-btn-icon-raw ${isStarred ? 'fx-btn-star active' : ''}`}
                    title={isStarred ? 'Bỏ đánh dấu' : 'Lưu từ'}
                  >
                    <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleMaster(item)}
                    className={`fx-btn-icon-raw ${isMastered ? 'fx-btn-check active' : ''}`}
                    title={isMastered ? 'Bấm để bỏ khỏi Master List' : 'Đánh dấu đã biết'}
                  >
                    <Check size={13} />
                  </button>
                </div>
              </div>

              {/* Line 2: IPA + Vietnamese Translation */}
              <div className="fx-card-line-2">
                {item.ipa && (
                  <>
                    <span className="fx-card-ipa">{item.ipa}</span>
                    <span className="fx-card-dot-sep">·</span>
                  </>
                )}
                <span className="fx-card-trans">{item.vietnamese || item.meaningVi}</span>
              </div>

              {/* Line 3: Direct Quote from Subtitle */}
              {contextSentence && (
                <div className="fx-card-line-3">
                  <p className="fx-card-quote">"{renderHighlightedContext(contextSentence, item.word)}"</p>
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* Progressive Infinite Load Sentinel */}
      {filtered.length > displayLimit && (
        <div
          ref={sentinelRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 0 12px',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => Math.min(prev + 48, filtered.length))}
            className="fx-btn-tesla-ghost-sm"
            style={{ fontSize: '12px', padding: '6px 16px' }}
          >
            Đang hiển thị {Math.min(displayLimit, filtered.length)} / {filtered.length} mục · Tải thêm
          </button>
        </div>
      )}
    </div>
  );
}
