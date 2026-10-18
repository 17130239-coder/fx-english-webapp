'use client';

import React, { useState, useMemo } from 'react';
import { Volume2, Check, Star, Search, Filter } from 'lucide-react';
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
    items.forEach((item) => {
      if (item.sentence || item.isCommunicative) comms++;
      else if (item.pos === 'noun') nouns++;
      else if (item.pos === 'verb') verbs++;
      else if (item.pos === 'adjective') adjs++;
      else if (item.pos === 'adverb') advs++;
    });
    return { total: items.length, nouns, verbs, adjs, advs, comms };
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

  return (
    <div className="w-full flex flex-col gap-5 pt-2">
      {/* Title & Stats Summary Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[17px] font-bold text-[#F4F4F6] tracking-tight">
            Từ vựng & Câu hội thoại: <span className="text-white font-semibold underline decoration-[rgba(255,255,255,0.2)]">{movieTitle}</span>
          </h2>
          <span className="text-[12px] font-mono text-[#71717A]">
            Hiển thị {filtered.length} / {items.length} mục
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">TỔNG TỪ</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.total}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">DANH TỪ</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.nouns}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">ĐỘNG TỪ</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.verbs}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">TÍNH TỪ</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.adjs}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">TRẠNG TỪ</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.advs}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)] flex flex-col">
            <span className="text-[11px] font-medium text-[#71717A]">GIAO TIẾP</span>
            <span className="text-[18px] font-bold text-[#F4F4F6] font-mono mt-0.5">{stats.comms}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141416] p-2 rounded-xl border border-[rgba(255,255,255,0.06)]">
        {/* POS Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#71717A] hover:text-[#F4F4F6] hover:bg-[#1C1C1F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Search & CEFR */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CEFR Select */}
          <div className="relative">
            <select
              value={cefrFilter}
              onChange={(e) => setCefrFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-[#0A0A0B] border border-[rgba(255,255,255,0.08)] text-[12px] text-[#A1A1AA] focus:outline-none focus:border-white"
            >
              <option value="all">Mọi cấp độ CEFR</option>
              <option value="A1">A1 (Cơ bản)</option>
              <option value="A2">A2 (Sơ cấp)</option>
              <option value="B1">B1 (Trung cấp)</option>
              <option value="B2">B2 (Trung cao)</option>
              <option value="C1">C1 (Cao cấp)</option>
              <option value="C2">C2 (Thành thạo)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-[#52525B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm từ hoặc nghĩa..."
              className="h-8 pl-8 pr-3 w-40 sm:w-52 rounded-lg bg-[#0A0A0B] border border-[rgba(255,255,255,0.08)] text-[12.5px] text-[#F4F4F6] placeholder:text-[#52525B] focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((item, idx) => {
          const key = (item.word || item.sentence || '').toLowerCase();
          const isMastered = masteredWords.has(key);
          const isStarred = starredWords.has(key);

          // Communicative Sentence Card
          if (item.sentence || item.isCommunicative) {
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-4 flex flex-col justify-between gap-3 hover:border-[rgba(255,255,255,0.14)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-2">
                    <span className="font-bold uppercase tracking-wider text-[#A1A1AA]">
                      {item.tag || 'CÂU GIAO TIẾP'}
                    </span>
                    <button
                      onClick={() => onToggleStar(key)}
                      className={`p-1 rounded transition-colors ${isStarred ? 'text-[#EAB308]' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
                    >
                      <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <p className="text-[15px] font-semibold text-[#F4F4F6] leading-snug">
                    "{item.sentence}"
                  </p>
                  <p className="text-[13.5px] font-medium text-[#10B981] mt-1.5">
                    {item.vietnamese}
                  </p>
                  {item.usageNote && (
                    <p className="text-[12px] text-[#71717A] italic mt-1">
                      {item.usageNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(255,255,255,0.04)]">
                  <button
                    onClick={() => speakWord(item.sentence || '', 0.9)}
                    className="flex items-center gap-1.5 text-[12px] text-[#71717A] hover:text-[#F4F4F6] transition-colors"
                  >
                    <Volume2 size={13} />
                    <span>Phát âm</span>
                  </button>

                  <button
                    onClick={() => onToggleMaster(item)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-medium transition-all ${
                      isMastered
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                        : 'bg-[#0A0A0B] text-[#71717A] hover:text-[#F4F4F6] border border-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    <Check size={12} />
                    <span>{isMastered ? 'Đã biết' : 'Đánh dấu đã biết'}</span>
                  </button>
                </div>
              </div>
            );
          }

          // Standard Vocabulary Word Card
          const contextSentence = item.contexts?.[0]?.text || '';

          return (
            <div
              key={idx}
              className="rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-4 flex flex-col justify-between gap-3 hover:border-[rgba(255,255,255,0.14)] transition-all"
            >
              <div>
                {/* Line 1: Word, POS, CEFR, IPA */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-[17px] font-bold text-[#F4F4F6] tracking-tight">
                      {item.word}
                    </h3>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#A1A1AA] uppercase">
                      {item.posLabelVi || item.pos}
                    </span>
                    {item.cefr && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#F4F4F6]">
                        {item.cefr}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onToggleStar(key)}
                    className={`p-1 rounded transition-colors ${isStarred ? 'text-[#EAB308]' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
                  >
                    <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* IPA & Frequency */}
                <div className="flex items-center gap-2 text-[12px] text-[#71717A] font-mono mt-0.5">
                  {item.ipa && <span>{item.ipa}</span>}
                  {item.frequency > 1 && <span>· {item.frequency}x</span>}
                </div>

                {/* Line 2: Vietnamese Definition */}
                <p className="text-[14px] font-semibold text-[#10B981] mt-2">
                  {item.vietnamese || item.meaningVi}
                </p>

                {/* Line 3: Movie Quote Context */}
                {contextSentence && (
                  <p className="text-[12.5px] text-[#8E8E93] italic leading-relaxed mt-1.5 line-clamp-2">
                    "{contextSentence}"
                  </p>
                )}
              </div>

              {/* Card Footer: Audio & Mastered Action */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(255,255,255,0.04)]">
                <button
                  onClick={() => speakWord(item.word, 1.0)}
                  className="flex items-center gap-1.5 text-[12px] text-[#71717A] hover:text-[#F4F4F6] transition-colors"
                >
                  <Volume2 size={13} />
                  <span>Nghe</span>
                </button>

                <button
                  onClick={() => onToggleMaster(item)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-medium transition-all ${
                    isMastered
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      : 'bg-[#0A0A0B] text-[#71717A] hover:text-[#F4F4F6] border border-[rgba(255,255,255,0.06)]'
                  }`}
                  title={isMastered ? 'Bấm để bỏ khỏi Master List' : 'Thêm vào Master List'}
                >
                  <Check size={12} />
                  <span>{isMastered ? 'Đã biết' : 'Đã biết'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
