'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, RotateCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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

  const current = items[idx];
  const isSentence = current?.sentence || current?.isCommunicative;
  const wordText = current?.word || current?.sentence || '';
  const contextSentence = current?.contexts?.[0]?.text || '';

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
    if (rating === 4 && current) {
      onToggleMaster(current);
    }
    handleNext();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

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
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (wordText) speakWord(wordText);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (current) {
          onToggleMaster(current);
          onToast(`Đã lưu "${wordText}" vào danh sách đã thuộc`, 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, idx, isFlipped, items, current, wordText]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fx-flashcard-modal">
      {/* Backdrop */}
      <div className="fx-fc-backdrop" onClick={onClose} />

      {/* Main Container */}
      <div className="fx-fc-container">
        {/* Top Bar */}
        <div className="fx-fc-topbar">
          <span className="fx-fc-counter">
            {idx + 1} / {items.length}
          </span>
          <span className="fx-fc-tip">
            Phím tắt: [Space/Enter] Lật thẻ · [R/V] Phát âm · [M] Đã thuộc · [1-4] SRS · [←/→] Chuyển
          </span>
          <button
            type="button"
            onClick={onClose}
            className="fx-fc-close"
            title="Đóng (Esc)"
          >
            ×
          </button>
        </div>

        {/* 3D Scene */}
        <div className="fx-fc-scene" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`fx-fc-card ${isFlipped ? 'is-flipped' : ''}`}>
            {/* FRONT FACE */}
            <div className="fx-fc-face fx-fc-front">
              <div className="fx-fc-meta-specs">
                <span>{current.posLabelVi || current.pos || 'TỪ VỰNG'}</span>
                {current.cefr && <span>· {current.cefr}</span>}
              </div>

              <div className="fx-fc-word" style={{ fontSize: isSentence ? '20px' : '30px' }}>
                {wordText}
              </div>

              {current.ipa && (
                <div className="fx-fc-phonetic-row">
                  <span>{current.ipa}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(wordText, 1.0);
                    }}
                    className="fx-btn-icon-raw"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              )}

              {contextSentence && (
                <div className="fx-fc-context-box">
                  "{contextSentence}"
                </div>
              )}

              <div className="fx-fc-flip-hint">
                <RotateCw size={11} style={{ display: 'inline', marginRight: '4px' }} />
                <span>Nhấp chuột hoặc bấm Phím Cách để lật mặt sau</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="fx-fc-face fx-fc-back">
              <span className="fx-fc-back-label">Nghĩa tiếng Việt</span>
              <div className="fx-fc-trans">
                {current.vietnamese || current.meaningVi || 'Đang cập nhật...'}
              </div>

              {contextSentence && (
                <div className="fx-fc-context-box" style={{ marginTop: '10px' }}>
                  "{contextSentence}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="fx-fc-controls">
          <button
            type="button"
            disabled={idx === 0}
            onClick={handlePrev}
            className="fx-btn-tesla-ghost-sm"
            style={{ opacity: idx === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={14} />
            <span>Trước</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="fx-btn-tesla-ghost-sm"
          >
            <RotateCw size={13} />
            <span>Lật thẻ</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="fx-btn-tesla-ghost-sm"
          >
            <span>Tiếp theo</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* SRS Rating Bar */}
        <div className="fx-fc-srs-bar">
          <button
            type="button"
            onClick={() => handleRate(1)}
            className="fx-srs-btn fx-srs-again"
            title="Bấm phím 1: Chưa nhớ, cần ôn lại ngay"
          >
            <span className="fx-srs-name">Chưa nhớ</span>
            <span className="fx-srs-time">[1] &lt;1m</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate(2)}
            className="fx-srs-btn fx-srs-hard"
            title="Bấm phím 2: Khó nhớ"
          >
            <span className="fx-srs-name">Khó</span>
            <span className="fx-srs-time">[2] 10m</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate(3)}
            className="fx-srs-btn fx-srs-good"
            title="Bấm phím 3: Nhớ tốt"
          >
            <span className="fx-srs-name">Nhớ tốt</span>
            <span className="fx-srs-time">[3] 1d</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate(4)}
            className="fx-srs-btn fx-srs-easy"
            title="Bấm phím 4: Rất dễ, thêm ngay vào Master List"
          >
            <span className="fx-srs-name">Rất dễ</span>
            <span className="fx-srs-time">[4] Đã thuộc</span>
          </button>
        </div>
      </div>
    </div>
  );
}
