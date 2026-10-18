'use client';

import React from 'react';
import { Layers, Download, FileSpreadsheet, Database } from 'lucide-react';

interface NavbarProps {
  activeView: 'studio' | 'master';
  onViewChange: (view: 'studio' | 'master') => void;
  masterCount: number;
  dbConnected: boolean;
  onOpenFlashcards: () => void;
  onExportAnki: () => void;
  onExportCsv: () => void;
}

export default function Navbar({
  activeView,
  onViewChange,
  masterCount,
  dbConnected,
  onOpenFlashcards,
  onExportAnki,
  onExportCsv
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold text-[#F4F4F6] tracking-tight">FX Studio</h1>
            <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[#71717A] border border-[rgba(255,255,255,0.06)]">
              Web Dashboard
            </span>
          </div>

          <div className="flex items-center p-1 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => onViewChange('studio')}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${
                activeView === 'studio'
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#71717A] hover:text-[#F4F4F6]'
              }`}
            >
              Phân tích & Lịch sử
            </button>
            <button
              onClick={() => onViewChange('master')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${
                activeView === 'master'
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#71717A] hover:text-[#F4F4F6]'
              }`}
            >
              <span>Master Known List</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeView === 'master'
                  ? 'bg-black/10 text-black font-bold'
                  : 'bg-[rgba(255,255,255,0.08)] text-[#A1A1AA]'
              }`}>
                {masterCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Neon DB Status */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#141416] border border-[rgba(255,255,255,0.06)] text-[12px] text-[#A1A1AA]"
            title={dbConnected ? 'Đã kết nối Neon Serverless Postgres' : 'Đang kết nối Neon DB...'}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${dbConnected ? 'bg-[#10B981]' : 'bg-[#EAB308] animate-pulse'}`} />
            <Database size={13} className="text-[#71717A]" />
            <span className="hidden sm:inline">Neon Cloud</span>
          </div>

          {/* Flashcards */}
          <button
            onClick={onOpenFlashcards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-[#F4F4F6] border border-[rgba(255,255,255,0.1)] hover:bg-[#1C1C1F] hover:border-[rgba(255,255,255,0.2)] transition-all"
          >
            <Layers size={14} />
            <span>Ôn Flashcard 3D</span>
          </button>

          {/* Exports */}
          <div className="flex items-center gap-1">
            <button
              onClick={onExportAnki}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#71717A] hover:text-[#F4F4F6] hover:bg-[#141416] transition-colors"
              title="Xuất thẻ Anki (.txt)"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Anki</span>
            </button>
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#71717A] hover:text-[#F4F4F6] hover:bg-[#141416] transition-colors"
              title="Xuất bảng tính (.csv)"
            >
              <FileSpreadsheet size={13} />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
