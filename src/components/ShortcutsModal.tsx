'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    {
      title: 'Điều Hướng Chung (Global)',
      shortcuts: [
        { keys: ['?'], label: 'Bật / Tắt bảng hướng dẫn phím tắt' },
        { keys: ['T'], label: 'Chuyển đổi giao diện Sáng / Tối' },
        { keys: ['1', '2'], label: 'Chuyển màn hình: [1] Phim · [2] Đã thuộc' },
        { keys: ['Esc'], label: 'Đóng cửa sổ modal / Hủy tìm kiếm' }
      ]
    },
    {
      title: 'Xem Từ Vựng Phim (Movie Detail)',
      shortcuts: [
        { keys: ['F'], label: 'Mở bộ thẻ ôn tập Flashcards 3D' },
        { keys: ['H'], label: 'Bật / Tắt ẩn từ vựng đã thuộc' },
        { keys: ['/', 'Ctrl+K'], label: 'Kích hoạt ô tìm kiếm từ vựng & nghĩa' },
        { keys: ['1', '...', '7'], label: 'Lọc loại từ: Tất cả (1), Danh (2), Động (3), Tính (4), Trạng (5), Cụm từ (6), Cấu trúc câu (7)' },
        { keys: ['O'], label: 'Mở xem video gốc trên Netflix hoặc YouTube' },
        { keys: ['B'], label: 'Quay lại danh sách toàn bộ phim' }
      ]
    },
    {
      title: 'Ôn Tập Flashcards 3D',
      shortcuts: [
        { keys: ['Space', 'Enter'], label: 'Lật thẻ (xem mặt trước / mặt sau)' },
        { keys: ['←', '→'], label: 'Chuyển sang thẻ trước / thẻ kế tiếp' },
        { keys: ['R', 'V'], label: 'Phát âm chuẩn (Text-to-Speech)' },
        { keys: ['M'], label: 'Đánh dấu từ đã thuộc vào Master List' },
        { keys: ['1', '2', '3', '4'], label: 'Chấm điểm nhớ SRS: Again (1), Hard (2), Good (3), Easy (4)' }
      ]
    },
    {
      title: 'Từ Vựng Đã Thuộc (Master List)',
      shortcuts: [
        { keys: ['N', 'A'], label: 'Mở cửa sổ thêm từ vựng mới' },
        { keys: ['/'], label: 'Tìm kiếm nhanh trong danh sách từ đã thuộc' },
        { keys: ['1', '...', '8'], label: 'Lọc: Tất cả (1), Danh (2), Động (3), Tính (4), Trạng (5), Cụm từ (6), Cấu trúc (7), Đa nghĩa (8)' }
      ]
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-shortcuts-title"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          background: 'var(--fx-bg-surface)',
          border: '1px solid var(--fx-border-medium)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--fx-border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--fx-bg-surface-hover)',
                border: '1px solid var(--fx-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--fx-text-primary)'
              }}
            >
              <Keyboard size={16} />
            </div>
            <div>
              <h2
                id="fx-shortcuts-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--fx-text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}
              >
                Phím Tắt Hệ Thống
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--fx-text-secondary)',
                  margin: 0,
                  marginTop: '2px'
                }}
              >
                Bấm các phím trên bàn phím để thao tác nhanh siêu tốc
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="fx-btn-icon-raw"
            title="Đóng (Esc)"
            aria-label="Đóng"
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--fx-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {categories.map((cat, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fx-text-muted)'
                }}
              >
                {cat.title}
              </div>

              <div
                style={{
                  background: 'var(--fx-bg-canvas)',
                  border: '1px solid var(--fx-border-subtle)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {cat.shortcuts.map((item, si) => (
                  <div
                    key={si}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: si < cat.shortcuts.length - 1 ? '1px solid var(--fx-border-subtle)' : 'none',
                      gap: '12px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--fx-text-secondary)',
                        lineHeight: 1.4
                      }}
                    >
                      {item.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {item.keys.map((k, ki) => (
                        <kbd key={ki} className="fx-kbd">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--fx-border-subtle)',
            background: 'var(--fx-bg-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--fx-text-muted)'
          }}
        >
          <span>Mẹo: Bấm <kbd className="fx-kbd" style={{ minWidth: '18px', height: '18px', fontSize: '10px', padding: '0 4px', margin: '0 2px' }}>?</kbd> bất kỳ lúc nào để xem lại</span>
          <button
            type="button"
            onClick={onClose}
            className="fx-btn-tesla-primary-sm"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
