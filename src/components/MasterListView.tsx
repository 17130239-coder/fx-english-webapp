'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Volume2, Search } from 'lucide-react';
import { MasterItem } from '@/lib/types';
import { speakWord } from '@/lib/speech';
import { MasterListSkeleton } from './Skeletons';

function cleanAndNormalizeSentence(text: string): string {
  if (!text) return '';
  let str = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  str = str.replace(/^[-–—]\s*/, '');
  str = str.replace(/\[.*?\]|\(.*?\)/g, '').trim();

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

const POS_LABELS_MAP: Record<string, string> = {
  n: 'Danh từ',
  noun: 'Danh từ',
  v: 'Động từ',
  verb: 'Động từ',
  adj: 'Tính từ',
  adjective: 'Tính từ',
  adv: 'Trạng từ',
  adverb: 'Trạng từ',
  phrase: 'Cụm từ',
  pattern: 'Cấu trúc câu',
  sentence: 'Câu giao tiếp'
};

function formatPosLabel(pos?: string, type?: string): string {
  if (type === 'pattern' || (pos && pos.toLowerCase() === 'pattern')) return 'Cấu trúc câu';
  if (type === 'phrase' || (pos && (pos.toLowerCase() === 'phrase' || pos.toLowerCase() === 'idiom'))) return 'Cụm từ';
  if (type === 'sentence') return 'Câu giao tiếp';
  const clean = (pos || '').toLowerCase().trim();
  return POS_LABELS_MAP[clean] || (pos ? pos.toUpperCase() : 'Danh từ');
}

interface MasterListViewProps {
  items: MasterItem[];
  onAddWord: () => void;
  onRemoveWord: (text: string) => void;
  onAddMeaning: (text: string) => void;
  onRemoveMeaning: (text: string, meaning: string) => void;
  onClearAll: () => void;
  onExportAnki?: () => void;
  onExportCsv?: () => void;
  onImportItems?: (items: Array<{ text: string; meanings?: string[]; pos?: string; type?: string }>) => void;
  loading?: boolean;
}

export default function MasterListView({
  items,
  onAddWord,
  onRemoveWord,
  onAddMeaning,
  onRemoveMeaning,
  onClearAll,
  loading = false
}: MasterListViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [cefrFilter, setCefrFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts for Master List View
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

      // If typing in input, do not intercept single-letter shortcuts
      if (isInput) return;

      // 'N' or 'A': Add word
      if (e.key === 'n' || e.key === 'N' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onAddWord();
        return;
      }

      // 1-8: POS, Phrase, Pattern, Polysemy tabs
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
        setActiveTab('adj');
      } else if (e.key === '5') {
        e.preventDefault();
        setActiveTab('adv');
      } else if (e.key === '6') {
        e.preventDefault();
        setActiveTab('phrase');
      } else if (e.key === '7') {
        e.preventDefault();
        setActiveTab('pattern');
      } else if (e.key === '8') {
        e.preventDefault();
        setActiveTab('polysemy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddWord]);

  // CEFR Distribution Calculation
  const cefrStats = useMemo(() => {
    let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1c2 = 0;
    (items || []).forEach((item) => {
      if (!item) return;
      const c = (item.cefr || '').toUpperCase();
      if (c === 'A1') a1++;
      else if (c === 'A2') a2++;
      else if (c === 'B1') b1++;
      else if (c === 'B2') b2++;
      else if (c === 'C1' || c === 'C2') c1c2++;
    });

    const total = (a1 + a2 + b1 + b2 + c1c2) || 1;
    return {
      total: items.length,
      a1,
      a2,
      b1,
      b2,
      c1c2,
      pA1: Math.round((a1 / total) * 100),
      pA2: Math.round((a2 / total) * 100),
      pB1: Math.round((b1 / total) * 100),
      pB2: Math.round((b2 / total) * 100),
      pC1C2: Math.round((c1c2 / total) * 100)
    };
  }, [items]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    let nouns = 0, verbs = 0, adjs = 0, advs = 0, phrases = 0, patterns = 0, polysemy = 0;
    (items || []).forEach((item) => {
      if (!item) return;
      const pos = (item.pos || '').toUpperCase();
      const isPat = item.type === 'pattern' || pos === 'PATTERN' || Boolean(item.patternTemplate);
      const isPhr = item.type === 'phrase' || pos === 'PHRASE' || pos === 'IDIOM' || item.type === 'sentence';

      if (isPat) patterns++;
      else if (isPhr) phrases++;
      else if (pos === 'N' || pos === 'NOUN') nouns++;
      else if (pos === 'V' || pos === 'VERB') verbs++;
      else if (pos === 'ADJ' || pos === 'ADJECTIVE') adjs++;
      else if (pos === 'ADV' || pos === 'ADVERB') advs++;

      if (Array.isArray(item.knownMeanings) && item.knownMeanings.length > 1) {
        polysemy++;
      }
    });
    return { all: items.length, nouns, verbs, adjs, advs, phrases, patterns, polysemy };
  }, [items]);

  // Filtered Items
  const filtered = useMemo(() => {
    return (items || []).filter((item) => {
      if (!item) return false;
      const pos = (item.pos || '').toUpperCase();
      const isPat = item.type === 'pattern' || pos === 'PATTERN' || Boolean(item.patternTemplate);
      const isPhr = item.type === 'phrase' || pos === 'PHRASE' || pos === 'IDIOM' || (item.type === 'sentence' && !item.patternTemplate);

      if (activeTab === 'noun') {
        if (pos !== 'N' && pos !== 'NOUN') return false;
      } else if (activeTab === 'verb') {
        if (pos !== 'V' && pos !== 'VERB') return false;
      } else if (activeTab === 'adj') {
        if (pos !== 'ADJ' && pos !== 'ADJECTIVE') return false;
      } else if (activeTab === 'adv') {
        if (pos !== 'ADV' && pos !== 'ADVERB') return false;
      } else if (activeTab === 'phrase') {
        if (!isPhr) return false;
      } else if (activeTab === 'pattern') {
        if (!isPat) return false;
      } else if (activeTab === 'polysemy') {
        if (!Array.isArray(item.knownMeanings) || item.knownMeanings.length < 2) return false;
      }

      // CEFR Filter
      if (cefrFilter !== 'all') {
        if ((item.cefr || '').toUpperCase() !== cefrFilter.toUpperCase()) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const textMatch = (item.text || '').toLowerCase().includes(q);
        const meaningsMatch = Array.isArray(item.knownMeanings)
          ? item.knownMeanings.some((m) => m.toLowerCase().includes(q))
          : false;
        if (!textMatch && !meaningsMatch) return false;
      }

      return true;
    });
  }, [items, activeTab, cefrFilter, search]);

  if (loading) {
    return <MasterListSkeleton count={8} />;
  }

  return (
    <div className="fx-master-view">
      {/* Top Header Row */}
      <div className="fx-master-header-row">
        <div className="fx-master-title-wrap">
          <h2 className="fx-master-title">Từ vựng đã thuộc</h2>
          <p className="fx-master-desc">
            Danh sách toàn bộ từ vựng và câu bạn đã thuộc. Dữ liệu được đồng bộ qua Neon Serverless Postgres và dùng để tự động lọc bỏ từ trùng lặp khi quét phim mới.
          </p>
        </div>

        <div className="fx-master-actions">
          <button
            type="button"
            onClick={onAddWord}
            className="fx-btn-tesla-primary-sm"
            title="Thêm từ mới vào Master List (phím tắt N hoặc A)"
          >
            <Plus size={13} />
            <span>Thêm từ</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="fx-btn-ghost-text"
            style={{ color: 'var(--fx-accent-netflix)' }}
            title="Xóa toàn bộ từ vựng trong Master List"
          >
            Xóa toàn bộ
          </button>
        </div>
      </div>

      {/* CEFR Distribution Bar */}
      {items.length > 0 && (
        <div className="fx-cefr-dist-bar-wrap">
          <div className="fx-cefr-dist-header">
            <span className="fx-cefr-dist-title">Phân bổ cấp độ từ vựng (CEFR Distribution)</span>
            <span className="fx-cefr-dist-stats">
              A1: {cefrStats.a1} · A2: {cefrStats.a2} · B1: {cefrStats.b1} · B2: {cefrStats.b2} · C1/C2: {cefrStats.c1c2}
            </span>
          </div>
          <div className="fx-cefr-stacked-bar">
            <div className="fx-cefr-seg fx-cefr-a1" style={{ width: `${cefrStats.pA1}%` }} title={`A1: ${cefrStats.a1}`} />
            <div className="fx-cefr-seg fx-cefr-a2" style={{ width: `${cefrStats.pA2}%` }} title={`A2: ${cefrStats.a2}`} />
            <div className="fx-cefr-seg fx-cefr-b1" style={{ width: `${cefrStats.pB1}%` }} title={`B1: ${cefrStats.b1}`} />
            <div className="fx-cefr-seg fx-cefr-b2" style={{ width: `${cefrStats.pB2}%` }} title={`B2: ${cefrStats.b2}`} />
            <div className="fx-cefr-seg fx-cefr-c1c2" style={{ width: `${cefrStats.pC1C2}%` }} title={`C1/C2: ${cefrStats.c1c2}`} />
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="fx-filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* POS Tabs */}
          <div className="fx-tabs-group" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            {[
              { id: 'all', label: 'Tất cả', keyNum: '1', count: tabCounts.all },
              { id: 'noun', label: 'Danh từ', keyNum: '2', count: tabCounts.nouns },
              { id: 'verb', label: 'Động từ', keyNum: '3', count: tabCounts.verbs },
              { id: 'adj', label: 'Tính từ', keyNum: '4', count: tabCounts.adjs },
              { id: 'adv', label: 'Trạng từ', keyNum: '5', count: tabCounts.advs },
              { id: 'phrase', label: 'Cụm từ', keyNum: '6', count: tabCounts.phrases },
              { id: 'pattern', label: 'Cấu trúc câu', keyNum: '7', count: tabCounts.patterns },
              { id: 'polysemy', label: 'Đa nghĩa', keyNum: '8', count: tabCounts.polysemy }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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

          {/* Search & CEFR Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={cefrFilter}
              onChange={(e) => setCefrFilter(e.target.value)}
              className="fx-select-sm"
            >
              <option value="all">Mọi cấp độ</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--fx-text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm... (/)"
                title="Tìm kiếm trong danh sách đã thuộc (phím tắt /)"
                className="fx-input fx-search-field"
                style={{ paddingLeft: '30px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="fx-history-empty" style={{ textAlign: 'center', padding: '40px 0' }}>
          Không tìm thấy từ vựng nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div key={activeTab} className="fx-cards-grid fx-tab-pane">
          {filtered.map((item) => {
            const posLabel = formatPosLabel(item.pos, item.type);
            const cefrLevel = item.cefr || '';
            const meanings = Array.isArray(item.knownMeanings)
              ? item.knownMeanings.filter(Boolean).join(', ')
              : (typeof item.knownMeanings === 'string' ? item.knownMeanings : '');
            const rawContext = item.context
              ? cleanAndNormalizeSentence(item.context.replace(/\d{2}:\d{2}(:\d{2})?/g, '').trim())
              : '';

            return (
              <div key={item.id || item.text} className="fx-word-card">
                {/* Line 1: Word + POS + CEFR + Actions */}
                <div className="fx-card-line-1">
                  <div className="fx-card-word-wrap">
                    <span className="fx-card-word">{item.text}</span>
                    <span className="fx-card-specs">
                      {posLabel}
                      {cefrLevel && ` · ${cefrLevel}`}
                    </span>
                  </div>

                  <div className="fx-card-meta-actions">
                    <button
                      type="button"
                      onClick={() => speakWord(item.text, 1.0)}
                      className="fx-btn-icon-raw"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveWord(item.text)}
                      className="fx-btn-icon-raw"
                      style={{ color: 'var(--fx-text-muted)' }}
                      title="Xóa khỏi danh sách đã thuộc"
                    >
                      <Trash2 size={13} />
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
                  <span className="fx-card-trans">{meanings || 'Chưa có nghĩa'}</span>
                </div>

                {/* Line 3: Direct Quote from Subtitle */}
                {rawContext && (
                  <div className="fx-card-line-3">
                    <p className="fx-card-quote">
                      "{renderHighlightedContext(rawContext, item.text)}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
