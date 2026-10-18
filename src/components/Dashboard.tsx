'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import ScannedHistory from './ScannedHistory';
import VocabularyGrid from './VocabularyGrid';
import MasterListView from './MasterListView';
import FlashcardModal from './FlashcardModal';
import TeslaModal from './TeslaModal';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem } from '@/lib/types';
import {
  exportVocabToAnki,
  exportVocabToCsv,
  exportMasterToAnki,
  exportMasterToCsv,
  triggerDownload
} from '@/lib/export';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'studio' | 'master'>('studio');
  const [movies, setMovies] = useState<ScannedMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<ScannedMovie | null>(null);
  const [currentVocab, setCurrentVocab] = useState<VocabItem[]>([]);
  const [currentMovieTitle, setCurrentMovieTitle] = useState<string>('Phim mẫu');

  // Master List & States
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set());
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fx-theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }
    } catch (e) {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      if (nextTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('fx-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('fx-theme', 'dark');
      }
    } catch (e) {}
  };

  // Flashcards State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isPrompt?: boolean;
    promptLabel?: string;
    promptPlaceholder?: string;
    defaultPromptValue?: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Toasts State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // 1. Fetch Movies from Neon Serverless
  const fetchMovies = useCallback(async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (data.success && Array.isArray(data.movies)) {
        setMovies(data.movies);
        setDbConnected(true);

        // If no movie is currently selected, select the latest one
        if (!selectedMovie && data.movies.length > 0) {
          loadMovieDetails(data.movies[0]);
        }
      }
    } catch (e) {
      console.warn('Could not connect to /api/movies:', e);
      setDbConnected(false);
    }
  }, [selectedMovie]);

  // 2. Fetch Master List from Neon Serverless
  const fetchMasterList = useCallback(async () => {
    try {
      const res = await fetch('/api/master-list');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setMasterItems(data.items);
        const set = new Set<string>();
        data.items.forEach((item: MasterItem) => {
          if (item && item.text) set.add(item.text.toLowerCase());
        });
        setMasteredWords(set);
      }
    } catch (e) {
      console.warn('Could not connect to /api/master-list:', e);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
    fetchMasterList();
  }, [fetchMovies, fetchMasterList]);

  // Load Full Movie Details (including heavy analysis JSONB)
  const loadMovieDetails = async (movie: ScannedMovie) => {
    setSelectedMovie(movie);
    setCurrentMovieTitle(movie.title);

    try {
      const res = await fetch(`/api/movies/${movie.id}`);
      const data = await res.json();
      if (data.success && data.movie && data.movie.analysis) {
        const vocab = extractVocabFromAnalysis(data.movie.analysis);
        setCurrentVocab(vocab);
      } else {
        // Empty or lightweight fallback
        setCurrentVocab([]);
      }
    } catch (err) {
      console.error('Error loading movie details:', err);
    }
  };

  // Convert raw analysis JSON into flattened VocabItem list
  const extractVocabFromAnalysis = (analysis: any): VocabItem[] => {
    if (!analysis) return [];
    const list: VocabItem[] = [];

    // Categories
    const categories = ['noun', 'verb', 'adjective', 'adverb'];
    categories.forEach((posKey) => {
      const cat = analysis.categories?.[posKey];
      if (cat && Array.isArray(cat.words)) {
        cat.words.forEach((w: any) => {
          list.push({
            word: w.word,
            pos: posKey,
            posLabelVi: cat.labelVi || posKey,
            cefr: w.cefr || 'B1',
            ipa: w.ipa || '',
            vietnamese: w.vietnamese || '',
            meaningVi: w.vietnamese || '',
            frequency: w.frequency || 1,
            contexts: Array.isArray(w.contexts) ? w.contexts : [],
            mastered: false
          });
        });
      }
    });

    // Communicative Sentences
    if (Array.isArray(analysis.sentences)) {
      analysis.sentences.forEach((s: any) => {
        list.push({
          word: s.cleanSentence || s.sentence || '',
          sentence: s.cleanSentence || s.sentence || '',
          cleanSentence: s.cleanSentence || s.sentence || '',
          pos: 'communicative',
          cefr: 'B1',
          ipa: '',
          vietnamese: s.vietnamese || '',
          meaningVi: s.vietnamese || '',
          frequency: 1,
          contexts: [{ text: s.cleanSentence || s.sentence || '' }],
          highlightPhrase: s.highlightPhrase,
          usageNote: s.usageNote,
          tag: s.tag || 'Giao tiếp'
        });
      });
    }

    return list;
  };

  // Handle Offline Subtitle Analysis from UnifiedInput

  // Toggle Mastered Word (Sync with Neon)
  const handleToggleMaster = async (item: VocabItem) => {
    const clean = (item.word || item.sentence || '').trim().toLowerCase();
    const isCurrentlyMastered = masteredWords.has(clean);

    if (isCurrentlyMastered) {
      // Remove
      setMasteredWords((prev) => {
        const next = new Set(prev);
        next.delete(clean);
        return next;
      });
      setMasterItems((prev) => prev.filter((m) => m.text.toLowerCase() !== clean));

      try {
        await fetch(`/api/master-list?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
        showToast(`Đã bỏ "${clean}" khỏi Master List`, 'info');
      } catch (e) {
        console.error(e);
      }
    } else {
      // Add
      setMasteredWords((prev) => new Set(prev).add(clean));
      const meaning = item.vietnamese || item.meaningVi || '';
      const newItem: MasterItem = {
        id: `m_${Date.now()}`,
        text: clean,
        type: item.sentence ? 'sentence' : 'word',
        pos: item.posLabelVi || item.pos || 'N',
        cefr: item.cefr,
        ipa: item.ipa,
        knownMeanings: meaning ? [meaning] : [],
        context: item.contexts?.[0]?.text || item.sentence || ''
      };
      setMasterItems((prev) => [newItem, ...prev]);

      try {
        await fetch('/api/master-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            type: newItem.type,
            pos: newItem.pos,
            meanings: newItem.knownMeanings
          })
        });
        showToast(`Đã thêm "${clean}" vào Master List`, 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Toggle Star
  const handleToggleStar = (word: string) => {
    const clean = word.trim().toLowerCase();
    setStarredWords((prev) => {
      const next = new Set(prev);
      if (next.has(clean)) next.delete(clean);
      else next.add(clean);
      return next;
    });
  };

  // Delete Movie (Immediate optimistic deletion + background cloud sync)
  const handleDeleteMovie = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistically update UI
    setMovies((prev) => prev.filter((m) => m.id !== id));
    if (selectedMovie?.id === id) {
      setSelectedMovie(null);
      setCurrentVocab([]);
    }

    try {
      const res = await fetch(`/api/movies/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa phim thành công', 'info');
      } else {
        showToast(`Không thể xóa phim: ${data.error || 'Lỗi server'}`, 'error');
        fetchMovies();
      }
    } catch (err: any) {
      showToast(`Lỗi kết nối khi xóa: ${err.message}`, 'error');
      fetchMovies();
    }
  };

  // Clear All Movies
  const handleClearAllMovies = () => {
    setModalConfig({
      isOpen: true,
      title: 'Xóa toàn bộ lịch sử',
      message: 'Bạn có chắc chắn muốn xóa TOÀN BỘ phim đã quét trên Neon Cloud? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        setModalConfig((m) => ({ ...m, isOpen: false }));
        try {
          await fetch('/api/movies', { method: 'DELETE' });
          setMovies([]);
          setSelectedMovie(null);
          setCurrentVocab([]);
          showToast('Đã xóa sạch lịch sử quét trên Cloud', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      }
    });
  };

  // Add Master Word Manually
  const handleAddMasterWord = () => {
    setModalConfig({
      isOpen: true,
      title: 'Thêm từ vào Master List',
      message: 'Nhập từ vựng hoặc câu tiếng Anh bạn đã biết:',
      isPrompt: true,
      promptLabel: 'Từ hoặc câu tiếng Anh',
      promptPlaceholder: 'ví dụ: artificial intelligence, take off...',
      confirmText: 'Tiếp tục',
      cancelText: 'Hủy',
      onConfirm: (val) => {
        const text = (val || '').trim().toLowerCase();
        if (!text) return;
        setModalConfig((m) => ({ ...m, isOpen: false }));

        // Step 2: Prompt for Meaning
        setTimeout(() => {
          setModalConfig({
            isOpen: true,
            title: `Nghĩa tiếng Việt cho "${text}"`,
            message: 'Nhập nghĩa tiếng Việt (ngăn cách bằng dấu phẩy nếu có nhiều nghĩa):',
            isPrompt: true,
            promptLabel: 'Nghĩa tiếng Việt',
            promptPlaceholder: 'ví dụ: trí tuệ nhân tạo, thông minh...',
            confirmText: 'Lưu vào Cloud',
            cancelText: 'Hủy',
            onConfirm: async (meaningVal) => {
              setModalConfig((m) => ({ ...m, isOpen: false }));
              const meanings = (meaningVal || '').split(',').map((s) => s.trim()).filter(Boolean);

              try {
                const res = await fetch('/api/master-list', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text,
                    type: 'word',
                    pos: 'N',
                    meanings
                  })
                });
                const data = await res.json();
                if (data.success && data.item) {
                  setMasterItems((prev) => [data.item, ...prev.filter((x) => x.text !== text)]);
                  setMasteredWords((prev) => new Set(prev).add(text));
                  showToast(`Đã lưu "${text}" vào Master List`, 'success');
                }
              } catch (err: any) {
                showToast(`Lỗi: ${err.message}`, 'error');
              }
            }
          });
        }, 150);
      }
    });
  };

  // Remove Word from Master List
  const handleRemoveMasterWord = (text: string) => {
    const clean = text.trim().toLowerCase();
    setModalConfig({
      isOpen: true,
      title: 'Xóa khỏi Master List',
      message: `Bạn có chắc muốn xóa "${clean}" khỏi danh sách từ đã biết?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        setModalConfig((m) => ({ ...m, isOpen: false }));
        try {
          await fetch(`/api/master-list?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
          setMasterItems((prev) => prev.filter((m) => m.text.toLowerCase() !== clean));
          setMasteredWords((prev) => {
            const next = new Set(prev);
            next.delete(clean);
            return next;
          });
          showToast(`Đã xóa "${clean}" khỏi Master List`, 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      }
    });
  };

  // Add Meaning Inline
  const handleAddMeaningInline = (text: string) => {
    const clean = text.trim().toLowerCase();
    setModalConfig({
      isOpen: true,
      title: 'Thêm nghĩa tiếng Việt',
      message: `Nhập nghĩa tiếng Việt mới cho từ "${clean}":`,
      isPrompt: true,
      promptLabel: 'Nghĩa tiếng Việt',
      promptPlaceholder: 'ví dụ: cất cánh, cởi đồ...',
      confirmText: 'Thêm nghĩa',
      cancelText: 'Hủy',
      onConfirm: async (val) => {
        const newMeaning = (val || '').trim();
        if (!newMeaning) return;
        setModalConfig((m) => ({ ...m, isOpen: false }));

        try {
          const res = await fetch('/api/master-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: clean,
              meanings: [newMeaning]
            })
          });
          const data = await res.json();
          if (data.success && data.item) {
            setMasterItems((prev) => prev.map((item) => (item.text.toLowerCase() === clean ? data.item : item)));
            showToast(`Đã thêm nghĩa cho "${clean}"`, 'success');
          }
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      }
    });
  };

  // Remove Meaning from Word
  const handleRemoveMeaning = async (text: string, meaning: string) => {
    const clean = text.trim().toLowerCase();
    const item = masterItems.find((m) => m.text.toLowerCase() === clean);
    if (!item) return;

    const remainingMeanings = item.knownMeanings.filter((m) => m !== meaning);
    try {
      const res = await fetch('/api/master-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          type: item.type,
          pos: item.pos,
          meanings: remainingMeanings
        })
      });
      const data = await res.json();
      if (data.success && data.item) {
        setMasterItems((prev) => prev.map((x) => (x.text.toLowerCase() === clean ? data.item : x)));
        showToast(`Đã xóa nghĩa "${meaning}"`, 'info');
      }
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`, 'error');
    }
  };

  // Clear All Master List
  const handleClearAllMaster = () => {
    setModalConfig({
      isOpen: true,
      title: 'Xóa toàn bộ Master List',
      message: 'Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách từ đã biết trên Neon Cloud? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        setModalConfig((m) => ({ ...m, isOpen: false }));
        try {
          await fetch('/api/master-list', { method: 'DELETE' });
          setMasterItems([]);
          setMasteredWords(new Set());
          showToast('Đã xóa sạch Master List trên Cloud', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      }
    });
  };

  // Exports
  const handleExportAnki = () => {
    if (activeView === 'master') {
      if (masterItems.length === 0) {
        showToast('Master List hiện đang trống, chưa có từ vựng nào để xuất.', 'warning');
        return;
      }
      const content = exportMasterToAnki(masterItems);
      triggerDownload(content, 'fx_master_known_list_anki.txt', 'text/plain;charset=utf-8');
      showToast('Đã xuất Anki Master List thành công', 'success');
    } else {
      if (currentVocab.length === 0) {
        showToast('Chưa có từ vựng nào để xuất.', 'warning');
        return;
      }
      const content = exportVocabToAnki(currentVocab, currentMovieTitle);
      triggerDownload(content, `${currentMovieTitle.replace(/\s+/g, '_')}_anki.txt`, 'text/plain;charset=utf-8');
      showToast('Đã xuất Anki từ vựng phim thành công', 'success');
    }
  };

  const handleExportCsv = () => {
    if (activeView === 'master') {
      if (masterItems.length === 0) {
        showToast('Master List hiện đang trống, chưa có từ vựng nào để xuất.', 'warning');
        return;
      }
      const content = exportMasterToCsv(masterItems);
      triggerDownload(content, 'fx_master_known_list.csv', 'text/csv;charset=utf-8');
      showToast('Đã xuất CSV Master List thành công', 'success');
    } else {
      if (currentVocab.length === 0) {
        showToast('Chưa có từ vựng nào để xuất.', 'warning');
        return;
      }
      const content = exportVocabToCsv(currentVocab);
      triggerDownload(content, `${currentMovieTitle.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8');
      showToast('Đã xuất CSV từ vựng phim thành công', 'success');
    }
  };

  // Open Flashcards
  const handleOpenFlashcards = () => {
    if (activeView === 'master') {
      if (masterItems.length === 0) {
        showToast('Master List chưa có từ vựng nào để luyện.', 'warning');
        return;
      }
      const fcItems: VocabItem[] = masterItems.map((m) => ({
        word: m.text,
        pos: m.pos || 'noun',
        cefr: m.cefr || 'B1',
        ipa: m.ipa || '',
        vietnamese: m.knownMeanings.join(', '),
        meaningVi: m.knownMeanings.join(', '),
        frequency: 1,
        contexts: m.context ? [{ text: m.context }] : []
      }));
      setCurrentVocab(fcItems);
      setIsFlashcardOpen(true);
    } else {
      if (currentVocab.length === 0) {
        showToast('Không có từ vựng nào để tạo thẻ ghi nhớ.', 'warning');
        return;
      }
      setIsFlashcardOpen(true);
    }
  };

  return (
    <div className="fx-studio-layout">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        masterCount={masterItems.length}
        dbConnected={dbConnected}
        onOpenFlashcards={handleOpenFlashcards}
        onExportAnki={handleExportAnki}
        onExportCsv={handleExportCsv}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {activeView === 'studio' ? (
          <>
            {/* Cloud Scanned Movies History */}
            <ScannedHistory
              movies={movies}
              selectedMovieId={selectedMovie?.id || null}
              onSelectMovie={(m) => loadMovieDetails(m)}
              onDeleteMovie={handleDeleteMovie}
              onClearAll={handleClearAllMovies}
            />

            {/* Vocabulary Grid */}
            {currentVocab.length > 0 ? (
              <VocabularyGrid
                movieTitle={currentMovieTitle}
                items={currentVocab}
                masteredWords={masteredWords}
                starredWords={starredWords}
                onToggleMaster={handleToggleMaster}
                onToggleStar={handleToggleStar}
              />
            ) : movies.length > 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--fx-text-secondary)',
                fontSize: '13px',
                border: '1px dashed var(--fx-border-subtle)',
                borderRadius: '8px',
                background: 'var(--fx-bg-surface)'
              }}>
                Chọn một phim từ danh sách bên trên để xem toàn bộ từ vựng đã phân tích.
              </div>
            ) : null}
          </>
        ) : (
          /* Master Known List Management View */
          <MasterListView
            items={masterItems}
            onAddWord={handleAddMasterWord}
            onRemoveWord={handleRemoveMasterWord}
            onAddMeaning={handleAddMeaningInline}
            onRemoveMeaning={handleRemoveMeaning}
            onClearAll={handleClearAllMaster}
            onExportAnki={handleExportAnki}
            onExportCsv={handleExportCsv}
          />
        )}
      </main>

      {/* 3D Flashcards Modal */}
      <FlashcardModal
        isOpen={isFlashcardOpen}
        items={currentVocab}
        onClose={() => setIsFlashcardOpen(false)}
        onToggleMaster={handleToggleMaster}
        onToast={showToast}
      />

      {/* Reusable Confirmation / Prompt Modal */}
      <TeslaModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isDanger={modalConfig.isDanger}
        isPrompt={modalConfig.isPrompt}
        promptLabel={modalConfig.promptLabel}
        promptPlaceholder={modalConfig.promptPlaceholder}
        defaultPromptValue={modalConfig.defaultPromptValue}
        onConfirm={(val) => modalConfig.onConfirm(val)}
        onCancel={() => setModalConfig((m) => ({ ...m, isOpen: false }))}
      />

      {/* Tesla Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
