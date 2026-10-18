'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Volume2, Search, X, Check } from 'lucide-react';
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

    const total = items.length || 1;
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
    <div className="w-full flex flex-col gap-6">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <h2 className="text-[20px] font-bold text-[#F4F4F6] tracking-tight">
            Master Known List
          </h2>
          <p className="text-[13px] text-[#71717A] max-w-2xl mt-1 leading-relaxed">
            Danh sách toàn bộ từ vựng và câu bạn đã thuộc. Dữ liệu được đồng bộ trực tiếp lên Neon Postgres Cloud và dùng để tự động lọc bỏ từ trùng lặp khi quét phim mới.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-[#E4E4E7] transition-all"
          >
            <Plus size={14} />
            <span>Thêm từ</span>
          </button>
          <button
            onClick={onExportAnki}
            className="px-3 py-2 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.08)] text-[12.5px] font-medium text-[#F4F4F6] hover:bg-[#1C1C1F] transition-all"
          >
            Xuất Anki
          </button>
          <button
            onClick={onExportCsv}
            className="px-3 py-2 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.08)] text-[12.5px] font-medium text-[#F4F4F6] hover:bg-[#1C1C1F] transition-all"
          >
            Xuất CSV
          </button>
          <button
            onClick={onClearAll}
            className="px-3 py-2 rounded-lg bg-transparent border border-red-900/40 text-[12.5px] font-medium text-red-400 hover:bg-red-950/30 transition-all"
          >
            Xóa toàn bộ
          </button>
        </div>
      </div>

      {/* CEFR Distribution Bar */}
      {items.length > 0 && (
        <div className="rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-[#F4F4F6]">Phân bổ cấp độ từ vựng (CEFR Distribution)</span>
            <span className="font-mono text-[#71717A]">
              A1: {cefrStats.a1} · A2: {cefrStats.a2} · B1: {cefrStats.b1} · B2: {cefrStats.b2} · C1/C2: {cefrStats.c1c2}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#0A0A0B]">
            {cefrStats.pA1 > 0 && (
              <div style={{ width: `${cefrStats.pA1}%` }} className="h-full bg-[#10B981]" title={`A1: ${cefrStats.a1}`} />
            )}
            {cefrStats.pA2 > 0 && (
              <div style={{ width: `${cefrStats.pA2}%` }} className="h-full bg-[#06B6D4]" title={`A2: ${cefrStats.a2}`} />
            )}
            {cefrStats.pB1 > 0 && (
              <div style={{ width: `${cefrStats.pB1}%` }} className="h-full bg-[#3B82F6]" title={`B1: ${cefrStats.b1}`} />
            )}
            {cefrStats.pB2 > 0 && (
              <div style={{ width: `${cefrStats.pB2}%` }} className="h-full bg-[#8B5CF6]" title={`B2: ${cefrStats.b2}`} />
            )}
            {cefrStats.pC1C2 > 0 && (
              <div style={{ width: `${cefrStats.pC1C2}%` }} className="h-full bg-[#EC4899]" title={`C1/C2: ${cefrStats.c1c2}`} />
            )}
          </div>
        </div>
      )}

      {/* Filters & POS Tabs Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141416] p-2 rounded-xl border border-[rgba(255,255,255,0.06)]">
        {/* POS Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
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
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#71717A] hover:text-[#F4F4F6] hover:bg-[#1C1C1F]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-black/10 text-black font-bold' : 'bg-[rgba(255,255,255,0.06)] text-[#A1A1AA]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Search & CEFR */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={cefrFilter}
            onChange={(e) => setCefrFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-[#0A0A0B] border border-[rgba(255,255,255,0.08)] text-[12px] text-[#A1A1AA] focus:outline-none focus:border-white"
          >
            <option value="all">Mọi cấp độ</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>

          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-[#52525B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ đã biết..."
              className="h-8 pl-8 pr-3 w-40 sm:w-52 rounded-lg bg-[#0A0A0B] border border-[rgba(255,255,255,0.08)] text-[12.5px] text-[#F4F4F6] placeholder:text-[#52525B] focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-12 text-center text-[#71717A]">
          Không tìm thấy từ vựng nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => {
            const isPolysemy = Array.isArray(item.knownMeanings) && item.knownMeanings.length > 1;

            return (
              <div
                key={item.id || item.text}
                className="rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-4 flex flex-col justify-between gap-3 hover:border-[rgba(255,255,255,0.14)] transition-all"
              >
                <div>
                  {/* Line 1: Word, POS, CEFR (STRICTLY NO 26x frequency!) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-[17px] font-bold text-[#F4F4F6] tracking-tight">
                        {item.text}
                      </h3>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#A1A1AA] uppercase">
                        {item.pos || 'N'}
                      </span>
                      {item.cefr && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#F4F4F6]">
                          {item.cefr}
                        </span>
                      )}
                      {isPolysemy && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Đa nghĩa
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveWord(item.text)}
                      className="p-1 text-[#52525B] hover:text-[#E50914] transition-colors rounded"
                      title="Xóa khỏi Master List"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Line 2: Accumulated Vietnamese Meanings Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    {Array.isArray(item.knownMeanings) && item.knownMeanings.map((meaning, mIdx) => (
                      <span
                        key={mIdx}
                        className="group inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.8 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25"
                      >
                        <span>{meaning}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveMeaning(item.text, meaning)}
                          className="opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity"
                          title={`Xóa nghĩa "${meaning}"`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}

                    {/* Inline Add Meaning Button */}
                    <button
                      type="button"
                      onClick={() => onAddMeaning(item.text)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.8 rounded-md border border-dashed border-[rgba(255,255,255,0.15)] text-[#71717A] hover:text-[#F4F4F6] hover:border-[rgba(255,255,255,0.3)] transition-all"
                    >
                      <Plus size={10} />
                      <span>Thêm nghĩa</span>
                    </button>
                  </div>

                  {/* Line 3: Context Quote (STRICTLY NO timestamps / seconds!) */}
                  {item.context && (
                    <p className="text-[12.5px] text-[#8E8E93] italic leading-relaxed mt-2.5 line-clamp-2 border-t border-[rgba(255,255,255,0.03)] pt-2">
                      "{item.context.replace(/\d{2}:\d{2}(:\d{2})?/g, '').trim()}"
                    </p>
                  )}
                </div>

                {/* Footer Audio Pronunciation */}
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)] text-[12px] text-[#71717A]">
                  <button
                    onClick={() => speakWord(item.text, 1.0)}
                    className="flex items-center gap-1.5 text-[#71717A] hover:text-[#F4F4F6] transition-colors"
                  >
                    <Volume2 size={13} />
                    <span>Nghe</span>
                  </button>

                  <span className="text-[11px] text-[#52525B]">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Đã thuộc'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
