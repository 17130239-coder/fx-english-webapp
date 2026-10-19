'use client';

import React from 'react';
import { Sun, Moon, Keyboard, Download } from 'lucide-react';

interface NavbarProps {
  activeView: 'studio' | 'master' | 'starred';
  onViewChange: (view: 'studio' | 'master' | 'starred') => void;
  masterCount: number;
  starredCount?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  dbConnected?: boolean;
  onOpenFlashcards?: () => void;
  onExportAnki?: () => void;
  onExportCsv?: () => void;
  onOpenShortcuts?: () => void;
  onExportJson?: () => void;
  exportJsonTitle?: string;
}

export default function Navbar({
  activeView,
  onViewChange,
  masterCount,
  starredCount = 0,
  theme,
  onToggleTheme,
  dbConnected = false,
  onOpenShortcuts,
  onExportJson,
  exportJsonTitle
}: NavbarProps) {
  return (
    <header className="fx-navbar">
      <div className="fx-nav-brand-group">
        <button
          type="button"
          onClick={() => onViewChange('studio')}
          className="fx-nav-brand-btn"
          title="FX English Studio"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="FX English Logo"
            width={24}
            height={24}
            className="fx-nav-brand-logo"
          />
        </button>

        <nav className="fx-nav-switcher">
          <button
            type="button"
            onClick={() => onViewChange('studio')}
            className={`fx-nav-tab ${activeView === 'studio' ? 'active' : ''}`}
            title="Danh sách phim và video đã quét"
          >
            <span>Phim</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('master')}
            className={`fx-nav-tab ${activeView === 'master' ? 'active' : ''}`}
            title="Danh sách từ vựng đã thuộc"
          >
            <span>Đã thuộc</span>
            <span className="fx-nav-pill-count">{masterCount}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('starred')}
            className={`fx-nav-tab ${activeView === 'starred' ? 'active' : ''}`}
            title="Từ vựng khó & nâng cao đã lưu dấu sao"
          >
            <span>Đã lưu</span>
            <span className="fx-nav-pill-count">{starredCount}</span>
          </button>
        </nav>
      </div>

      <div className="fx-nav-actions">
        {/* Export JSON Button (Icon only) */}
        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            className="fx-btn-tesla-ghost-sm"
            title={exportJsonTitle || "Xuất dữ liệu JSON"}
            aria-label={exportJsonTitle || "Xuất dữ liệu JSON"}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}
          >
            <Download size={14} />
          </button>
        )}

        {/* Keyboard Shortcuts Trigger */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="fx-btn-tesla-ghost-sm fx-nav-keyboard-btn"
            title="Phím tắt bàn phím (?)"
            aria-label="Phím tắt bàn phím (?)"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}
          >
            <Keyboard size={14} />
          </button>
        )}

        {/* Light / Dark Mode Toggle (Icon only) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="fx-btn-tesla-ghost-sm"
          title={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
          aria-label={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Minimal Connection Status Dot */}
        <span
          className={`fx-neon-dot-wrap ${dbConnected ? '' : 'offline'}`}
          title={dbConnected ? 'Trực tuyến (Đã kết nối Neon DB)' : 'Ngoại tuyến (Đang dùng bộ nhớ cục bộ PWA)'}
        >
          <span className="fx-neon-dot" />
        </span>
      </div>
    </header>
  );
}

