'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

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
}

export default function Navbar({
  activeView,
  onViewChange,
  masterCount,
  theme,
  onToggleTheme,
  dbConnected = false
}: NavbarProps) {
  return (
    <header className="fx-navbar">
      <div className="fx-nav-brand-group">
        <h1 className="fx-nav-title">FX English</h1>

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
        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="fx-btn-tesla-ghost-sm"
          title={theme === 'light' ? 'Chuyển sang giao diện Tối (Dark Mode)' : 'Chuyển sang giao diện Sáng (Light Mode)'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          <span>{theme === 'light' ? 'Tối' : 'Sáng'}</span>
        </button>

        {/* Minimal Neon DB Connection Dot */}
        <span
          className={`fx-neon-dot-wrap ${dbConnected ? '' : 'syncing'}`}
          title={dbConnected ? 'Neon Serverless Postgres: Đã kết nối' : 'Đang kết nối cơ sở dữ liệu...'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span
            className="fx-neon-dot"
            style={{
              backgroundColor: dbConnected ? '#10B981' : '#F59E0B',
              boxShadow: dbConnected ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--fx-text-secondary)', fontWeight: 500 }}>
            {dbConnected ? 'Neon DB' : 'Đang kết nối...'}
          </span>
        </span>
      </div>
    </header>
  );
}

