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
          <svg
            width="28"
            height="28"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="fx-nav-brand-logo"
            aria-label="FX English Logo"
          >
            <defs>
              <linearGradient id="fxRedNav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF333E" />
                <stop offset="100%" stopColor="#E50914" />
              </linearGradient>
              <filter id="fxRedGlowNav" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#E50914" floodOpacity="0.45" />
              </filter>
              <mask id="slashGapNav">
                <rect x="0" y="0" width="512" height="512" fill="white" />
                <line x1="436" y1="116" x2="236" y2="396" stroke="black" strokeWidth="80" strokeLinecap="round" />
              </mask>
            </defs>
            {/* Letter F */}
            <path
              d="M80 104 H224 C235 104 242 111 242 120 V148 C242 157 235 164 224 164 H142 C135 164 130 169 130 176 V224 C130 231 135 236 142 236 H204 C215 236 222 243 222 252 V280 C222 289 215 296 204 296 H142 C135 296 130 301 130 308 V392 C130 401 123 408 114 408 H80 C71 408 64 401 64 392 V120 C64 111 71 104 80 104 Z"
              fill="currentColor"
            />
            {/* Letter X: White / Dark Diagonal Arm 1 with mask gap */}
            <line
              x1="236"
              y1="116"
              x2="436"
              y2="396"
              stroke="currentColor"
              strokeWidth="58"
              strokeLinecap="round"
              mask="url(#slashGapNav)"
            />
            {/* Letter X: Dynamic Netflix Red Diagonal Arm 2 */}
            <line
              x1="436"
              y1="116"
              x2="236"
              y2="396"
              stroke="url(#fxRedNav)"
              strokeWidth="58"
              strokeLinecap="round"
              filter="url(#fxRedGlowNav)"
            />
          </svg>
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

