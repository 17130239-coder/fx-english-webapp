'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Volume2, Search, X } from 'lucide-react';
import { MasterItem } from '@/lib/types';
import { speakWord } from '@/lib/speech';

interface MasterListViewProps {
  items: MasterItem[];
  onAddWord: () => void;
  onRemoveWord: (text: string) => void;
  onAddMeaning: (text: string) => void;
  onRemoveMeaning: (text: string, meaning: string) => void;
  onClearAll: () => void;
  onExportAnki: () => void;
  onExportCsv: () => void;
}

export default function MasterListView({
  items,
  onAddWord,
  onRemoveWord,
  onAddMeaning,
  onRemoveMeaning,
  onClearAll,
  onExportAnki,
  onExportCsv
}: MasterListViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [cefrFilter, setCefrFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // CEFR Distribution Calculation
  const cefrStats = useMemo(() => {
    let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1c2 = 0;
    items.forEach((item) => {
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
    let nouns = 0, verbs = 0, adjs = 0, advs = 0, sentences = 0, polysemy = 0;
    items.forEach((item) => {
      const pos = (item.pos || '').toUpperCase();
      if (item.type === 'sentence' || pos === 'IDIOM') sentences++;
      else if (pos === 'N' || pos === 'NOUN') nouns++;
      else if (pos === 'V' || pos === 'VERB') verbs++;
      else if (pos === 'ADJ' || pos === 'ADJECTIVE') adjs++;
      else if (pos === 'ADV' || pos === 'ADVERB') advs++;

      if (Array.isArray(item.knownMeanings) && item.knownMeanings.length > 1) {
        polysemy++;
      }
    });
    return { all: items.length, nouns, verbs, adjs, advs, sentences, polysemy };
  }, [items]);

  // Filtered Items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const pos = (item.pos || '').toUpperCase();
      const isSentence = item.type === 'sentence' || pos === 'IDIOM';

      if (activeTab === 'noun') {
        if (pos !== 'N' && pos !== 'NOUN') return false;
      } else if (activeTab === 'verb') {
        if (pos !== 'V' && pos !== 'VERB') return false;
      } else if (activeTab === 'adj') {
        if (pos !== 'ADJ' && pos !== 'ADJECTIVE') return false;
      } else if (activeTab === 'adv') {
        if (pos !== 'ADV' && pos !== 'ADVERB') return false;
      } else if (activeTab === 'sentences') {
        if (!isSentence) return false;
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
          >
            <Plus size={13} />
            <span>Thêm từ</span>
          </button>
          <button
            type="button"
            onClick={onExportAnki}
            className="fx-btn-tesla-ghost-sm"
          >
            Xuất Anki
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="fx-btn-tesla-ghost-sm"
          >
            Xuất CSV
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="fx-btn-ghost-text"
            style={{ color: 'var(--fx-accent-netflix)' }}
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
              { id: 'all', label: 'Tất cả', count: tabCounts.all },
              { id: 'noun', label: 'Danh từ', count: tabCounts.nouns },
              { id: 'verb', label: 'Động từ', count: tabCounts.verbs },
              { id: 'adj', label: 'Tính từ', count: tabCounts.adjs },
              { id: 'adv', label: 'Trạng từ', count: tabCounts.advs },
              { id: 'sentences', label: 'Câu giao tiếp', count: tabCounts.sentences },
              { id: 'polysemy', label: 'Đa nghĩa', count: tabCounts.polysemy }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`fx-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--fx-text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm từ đã biết..."
                className="fx-input"
                style={{ paddingLeft: '30px', width: '200px', height: '34px', fontSize: '12.5px' }}
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
        <div className="fx-cards-grid">
          {filtered.map((item) => {
            const isPolysemy = Array.isArray(item.knownMeanings) && item.knownMeanings.length > 1;

            return (
              <div key={item.id || item.text} className="fx-word-card">
                {/* Line 1: Word + POS + CEFR (NO 26x frequency!) */}
                <div className="fx-card-line-1">
                  <div className="fx-card-word-wrap">
                    <span className="fx-card-word">{item.text}</span>
                    <span className="fx-card-specs">
                      {item.pos || 'N'}
                      {item.cefr && ` · ${item.cefr}`}
                    </span>
                    {isPolysemy && (
                      <span className="fx-badge-new-meaning" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        Đa nghĩa
                      </span>
                    )}
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
                      title="Xóa khỏi Master List"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Line 2: Accumulated Vietnamese Meanings Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {Array.isArray(item.knownMeanings) && item.knownMeanings.map((meaning, mIdx) => (
                    <span key={mIdx} className="fx-meaning-pill">
                      <span>{meaning}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveMeaning(item.text, meaning)}
                        className="fx-btn-remove-meaning"
                        title={`Xóa nghĩa "${meaning}"`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={() => onAddMeaning(item.text)}
                    className="fx-btn-add-meaning-inline"
                    title="Thêm nghĩa tiếng Việt mới cho từ này"
                  >
                    <Plus size={10} />
                    <span>Thêm nghĩa</span>
                  </button>
                </div>

                {/* Line 3: Direct Quote (Clean, NO timestamps!) */}
                {item.context && (
                  <div className="fx-card-line-3">
                    <p className="fx-card-quote">
                      "{item.context.replace(/\d{2}:\d{2}(:\d{2})?/g, '').trim()}"
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
