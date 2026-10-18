'use client';

import React, { useState, useMemo } from 'react';
import { Volume2, Check, Star, Search } from 'lucide-react';
import { VocabItem } from '@/lib/types';
import { speakWord } from '@/lib/speech';

interface VocabularyGridProps {
  movieTitle: string;
  items: VocabItem[];
  masteredWords: Set<string>;
  starredWords: Set<string>;
  onToggleMaster: (item: VocabItem) => void;
  onToggleStar: (word: string) => void;
}

export default function VocabularyGrid({
  movieTitle,
  items,
  masteredWords,
  starredWords,
  onToggleMaster,
  onToggleStar
}: VocabularyGridProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'noun' | 'verb' | 'adjective' | 'adverb' | 'communicative'>('all');
  const [cefrFilter, setCefrFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Stats
  const stats = useMemo(() => {
    let nouns = 0, verbs = 0, adjs = 0, advs = 0, comms = 0;
    let cefrA1 = 0, cefrA2 = 0, cefrB1 = 0, cefrB2 = 0, cefrC1C2 = 0;

    items.forEach((item) => {
      if (item.sentence || item.isCommunicative) comms++;
      else if (item.pos === 'noun') nouns++;
      else if (item.pos === 'verb') verbs++;
      else if (item.pos === 'adjective') adjs++;
      else if (item.pos === 'adverb') advs++;

      const c = (item.cefr || '').toUpperCase();
      if (c === 'A1') cefrA1++;
      else if (c === 'A2') cefrA2++;
      else if (c === 'B1') cefrB1++;
      else if (c === 'B2') cefrB2++;
      else if (c === 'C1' || c === 'C2') cefrC1C2++;
    });

    return { total: items.length, nouns, verbs, adjs, advs, comms, cefrA1, cefrA2, cefrB1, cefrB2, cefrC1C2 };
  }, [items]);

  // Filtered Items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // POS Tab
      if (activeTab === 'communicative') {
        if (!item.sentence && !item.isCommunicative) return false;
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
        const wordMatch = (item.word || item.sentence || '').toLowerCase().includes(q);
        const transMatch = (item.vietnamese || item.meaningVi || '').toLowerCase().includes(q);
        if (!wordMatch && !transMatch) return false;
      }

      return true;
    });
  }, [items, activeTab, cefrFilter, search]);

  if (items.length === 0) return null;

  const totalWordsForCefr = (stats.cefrA1 + stats.cefrA2 + stats.cefrB1 + stats.cefrB2 + stats.cefrC1C2) || 1;
  const pctA1 = Math.round((stats.cefrA1 / totalWordsForCefr) * 100);
  const pctA2 = Math.round((stats.cefrA2 / totalWordsForCefr) * 100);
  const pctB1 = Math.round((stats.cefrB1 / totalWordsForCefr) * 100);
  const pctB2 = Math.round((stats.cefrB2 / totalWordsForCefr) * 100);
  const pctC1C2 = Math.round((stats.cefrC1C2 / totalWordsForCefr) * 100);

  return (
    <div className="fx-vocab-section">
      {/* Header Title */}
      <div className="fx-section-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2>Từ vựng: <span style={{ color: 'var(--fx-text-primary)', fontWeight: 600 }}>{movieTitle}</span></h2>
          <span className="fx-nav-pill-count">{filtered.length} / {items.length} mục</span>
        </div>
      </div>

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
          <span className="fx-stat-num">{stats.comms}</span>
          <span className="fx-stat-name">Câu Giao Tiếp</span>
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
              { id: 'all', label: 'Tất cả' },
              { id: 'noun', label: 'Danh từ' },
              { id: 'verb', label: 'Động từ' },
              { id: 'adjective', label: 'Tính từ' },
              { id: 'adverb', label: 'Trạng từ' },
              { id: 'communicative', label: 'Giao tiếp' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`fx-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
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
              <option value="all">Mọi cấp độ CEFR</option>
              <option value="A1">A1 (Cơ bản)</option>
              <option value="A2">A2 (Sơ cấp)</option>
              <option value="B1">B1 (Trung cấp)</option>
              <option value="B2">B2 (Trung cao)</option>
              <option value="C1">C1 (Cao cấp)</option>
              <option value="C2">C2 (Thành thạo)</option>
            </select>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--fx-text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm từ hoặc nghĩa..."
                className="fx-input"
                style={{ paddingLeft: '30px', width: '200px', height: '34px', fontSize: '12.5px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Cards Grid (Tesla 3-Line Hardware Look) */}
      <div className="fx-cards-grid">
        {filtered.map((item, idx) => {
          const key = (item.word || item.sentence || '').toLowerCase();
          const isMastered = masteredWords.has(key);
          const isStarred = starredWords.has(key);

          // Communicative Sentence Card
          if (item.sentence || item.isCommunicative) {
            return (
              <div key={idx} className="fx-sentence-card">
                <div className="fx-sent-top">
                  <div className="fx-sent-meta-left">
                    <span className="fx-sent-tag">{item.tag || 'CÂU GIAO TIẾP'}</span>
                  </div>
                  <div className="fx-sent-actions">
                    <button
                      type="button"
                      onClick={() => onToggleStar(key)}
                      className={`fx-btn-icon-raw ${isStarred ? 'fx-btn-star active' : ''}`}
                      title={isStarred ? 'Bỏ lưu' : 'Lưu câu'}
                    >
                      <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakWord(item.sentence || '', 0.9)}
                      className="fx-btn-icon-raw"
                      title="Phát âm"
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
                  <p className="fx-sent-quote">"{item.sentence}"</p>
                  <p className="fx-sent-trans">{item.vietnamese || item.meaningVi}</p>
                </div>

                {item.usageNote && (
                  <div className="fx-sent-footer">
                    <span className="fx-sent-note">{item.usageNote}</span>
                  </div>
                )}
              </div>
            );
          }

          // Standard Vocabulary Word Card
          const contextSentence = item.contexts?.[0]?.text || '';

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
                    onClick={() => onToggleStar(key)}
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

              {/* Line 3: Direct Quote from Subtitle (No 26x, No timestamps) */}
              {contextSentence && (
                <div className="fx-card-line-3">
                  <p className="fx-card-quote">"{contextSentence}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
