'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, RotateCw, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import { VocabItem } from '@/lib/types';
import { speakWord } from '@/lib/speech';

interface FlashcardModalProps {
  isOpen: boolean;
  items: VocabItem[];
  onClose: () => void;
  onToggleMaster: (item: VocabItem) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

export default function FlashcardModal({
  isOpen,
  items,
  onClose,
  onToggleMaster,
  onToast
}: FlashcardModalProps) {
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIdx(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key >= '1' && e.key <= '4') {
        handleRate(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, idx, isFlipped, items]);

  if (!isOpen || items.length === 0) return null;

  const current = items[idx];
  const isSentence = current.sentence || current.isCommunicative;
  const wordText = current.word || current.sentence || '';
  const contextSentence = current.contexts?.[0]?.text || '';

  const handleNext = () => {
    if (idx < items.length - 1) {
      setIdx((i) => i + 1);
      setIsFlipped(false);
    } else {
      onToast('Chúc mừng! Bạn đã hoàn thành lượt ôn tập tất cả các thẻ.', 'success');
      onClose();
    }
  };

  const handlePrev = () => {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setIsFlipped(false);
    }
  };

  const handleRate = (rating: number) => {
    if (rating === 4) {
      onToggleMaster(current);
    }
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-4 animate-in zoom-in-95 duration-150">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between px-2">
          <span className="text-[13px] font-mono text-[#A1A1AA]">
            {idx + 1} / {items.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#52525B] hidden sm:inline">Phím Space: lật thẻ · 1-4: đánh giá</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-white transition-colors"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D Card Box */}
        <div
          onClick={() => setIsFlipped((f) => !f)}
          className="perspective-1000 w-full h-[340px] cursor-pointer"
        >
          <div
            className={`preserve-3d relative w-full h-full transition-transform duration-500 rounded-2xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT FACE */}
            <div className="backface-hidden absolute inset-0 rounded-2xl bg-[#141416] border border-[rgba(255,255,255,0.08)] p-6 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                    {current.posLabelVi || current.pos || (isSentence ? 'GIAO TIẾP' : 'TỪ VỰNG')}
                  </span>
                  {current.cefr && (
                    <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-white font-mono font-bold">
                      {current.cefr}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(wordText, 1.0);
                  }}
                  className="p-1 text-[#71717A] hover:text-white transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Center Content */}
              <div className="flex flex-col items-center text-center my-auto px-4">
                <h3 className="text-[26px] font-bold text-[#F4F4F6] tracking-tight">
                  {wordText}
                </h3>
                {current.ipa && (
                  <p className="text-[14px] font-mono text-[#71717A] mt-1.5">{current.ipa}</p>
                )}
                {contextSentence && (
                  <p className="text-[13px] text-[#8E8E93] italic leading-relaxed mt-4 max-w-sm line-clamp-3">
                    "{contextSentence}"
                  </p>
                )}
              </div>

              {/* Bottom Hint */}
              <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#52525B]">
                <RotateCw size={12} />
                <span>Bấm vào thẻ hoặc phím Space để xem nghĩa</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 rounded-2xl bg-[#17171A] border border-[rgba(255,255,255,0.12)] p-6 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span className="font-mono text-[#A1A1AA] uppercase tracking-wider">NGHĨA TIẾNG VIỆT</span>
                <span className="text-[11px] font-medium text-[#10B981]">Mặt sau</span>
              </div>

              {/* Center Content */}
              <div className="flex flex-col items-center text-center my-auto px-4">
                <p className="text-[22px] font-bold text-[#10B981] leading-snug">
                  {current.vietnamese || current.meaningVi}
                </p>
                {current.lemma && current.lemma !== current.word && (
                  <p className="text-[13px] text-[#71717A] mt-2 font-mono">
                    Từ gốc: <span className="text-[#F4F4F6]">{current.lemma}</span>
                  </p>
                )}
                {current.usageNote && (
                  <p className="text-[12.5px] text-[#A1A1AA] mt-3 italic max-w-sm">
                    {current.usageNote}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>Phím 1-4 để đánh giá nhớ</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMaster(current);
                  }}
                  className="flex items-center gap-1 text-[#10B981] hover:underline"
                >
                  <Check size={12} />
                  <span>Đánh dấu đã thuộc</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SRS Rating Control Bar */}
        <div className="w-full flex items-center justify-between gap-2 mt-1">
          <button
            onClick={handlePrev}
            disabled={idx === 0}
            className="p-2.5 rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.08)] text-[#71717A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Thẻ trước"
          >
            <ChevronLeft size={16} />
          </button>

          {/* SRS 4 Levels */}
          <div className="flex-1 grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(1)}
              className="py-2.5 rounded-xl bg-[#141416] border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/20 text-red-400 text-[12px] font-semibold transition-all flex flex-col items-center"
            >
              <span>Quên (1)</span>
              <span className="text-[10px] text-red-400/60 font-mono">1 ngày</span>
            </button>
            <button
              onClick={() => handleRate(2)}
              className="py-2.5 rounded-xl bg-[#141416] border border-amber-900/30 hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-400 text-[12px] font-semibold transition-all flex flex-col items-center"
            >
              <span>Khó (2)</span>
              <span className="text-[10px] text-amber-400/60 font-mono">2 ngày</span>
            </button>
            <button
              onClick={() => handleRate(3)}
              className="py-2.5 rounded-xl bg-[#141416] border border-blue-900/30 hover:border-blue-500/50 hover:bg-blue-950/20 text-blue-400 text-[12px] font-semibold transition-all flex flex-col items-center"
            >
              <span>Nhớ (3)</span>
              <span className="text-[10px] text-blue-400/60 font-mono">3 ngày</span>
            </button>
            <button
              onClick={() => handleRate(4)}
              className="py-2.5 rounded-xl bg-[#141416] border border-emerald-900/30 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-400 text-[12px] font-semibold transition-all flex flex-col items-center"
            >
              <span>Dễ (4)</span>
              <span className="text-[10px] text-emerald-400/60 font-mono">4 ngày</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.08)] text-[#71717A] hover:text-white transition-all"
            title="Thẻ sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
