'use client';

import React from 'react';
import { Layers, Download, FileSpreadsheet, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeView: 'studio' | 'master';
  onViewChange: (view: 'studio' | 'master') => void;
  masterCount: number;
  dbConnected: boolean;
  onOpenFlashcards: () => void;
  onExportAnki: () => void;
  onExportCsv: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Navbar({
  activeView,
  onViewChange,
  masterCount,
  dbConnected,
  onOpenFlashcards,
  onExportAnki,
  onExportCsv,
  theme,
  onToggleTheme
}: NavbarProps) {
  return (
    <header className="fx-navbar">
      <div className="fx-nav-brand-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="fx-nav-title">FX English</h1>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--fx-bg-surface-hover)',
            color: 'var(--fx-text-secondary)',
            border: '1px solid var(--fx-border-subtle)'
          }}>
            Web Dashboard
          </span>
        </div>

        <nav className="fx-nav-switcher">
          <button
            type="button"
            onClick={() => onViewChange('studio')}
            className={`fx-nav-tab ${activeView === 'studio' ? 'active' : ''}`}
            title="Màn hình phân tích từ vựng & phụ đề"
          >
            <span>Phim & Phụ đề</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('master')}
            className={`fx-nav-tab ${activeView === 'master' ? 'active' : ''}`}
            title="Danh sách từ & câu đã biết (Master List)"
          >
            <span>Master List</span>
            <span className="fx-nav-pill-count">{masterCount}</span>
          </button>
        </nav>
      </div>

      <div className="fx-nav-actions">
        {/* Flashcards */}
        <button
          type="button"
          onClick={onOpenFlashcards}
          className="fx-btn-tesla-primary-sm"
          title="Ôn tập từ vựng bằng Flashcards 3D"
        >
          <Layers size={13} />
          <span>Flashcards</span>
        </button>

        {/* Anki Export */}
        <button
          type="button"
          onClick={onExportAnki}
          className="fx-btn-tesla-ghost-sm"
          title="Xuất bộ thẻ Anki (.txt)"
        >
          <Download size={13} />
          <span>Anki</span>
        </button>

        {/* CSV Export */}
        <button
          type="button"
          onClick={onExportCsv}
          className="fx-btn-tesla-ghost-sm"
          title="Xuất file CSV"
        >
          <FileSpreadsheet size={13} />
          <span>CSV</span>
        </button>

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

        {/* Minimal Neon Status Dot (6px circle) */}
        <span
          className={`fx-neon-dot-wrap ${dbConnected ? '' : 'syncing'}`}
          title={dbConnected ? 'Neon Serverless Postgres: Đã kết nối' : 'Đang kết nối cơ sở dữ liệu...'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="fx-neon-dot" />
          <span style={{ fontSize: '11px', color: 'var(--fx-text-secondary)', fontWeight: 500 }}>
            Neon Cloud
          </span>
        </span>
      </div>
    </header>
  );
}
