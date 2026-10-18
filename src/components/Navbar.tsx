'use client';

import React from 'react';
import { Sun, Moon, Keyboard } from 'lucide-react';

interface NavbarProps {
  activeView: 'studio' | 'master';
  onViewChange: (view: 'studio' | 'master') => void;
  masterCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  dbConnected?: boolean;
  onOpenFlashcards?: () => void;
  onExportAnki?: () => void;
  onExportCsv?: () => void;
  onOpenShortcuts?: () => void;
}

export default function Navbar({
  activeView,
  onViewChange,
  masterCount,
  theme,
  onToggleTheme,
  dbConnected = false,
  onOpenShortcuts
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
          <span className="fx-nav-title">FX English</span>
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
        </nav>
      </div>

      <div className="fx-nav-actions">
        {/* Keyboard Shortcuts Trigger */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="fx-btn-tesla-ghost-sm"
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

