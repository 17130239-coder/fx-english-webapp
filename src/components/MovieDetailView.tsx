'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2, Layers } from 'lucide-react';
import Navbar from './Navbar';
import VocabularyGrid from './VocabularyGrid';
import FlashcardModal from './FlashcardModal';
import ShortcutsModal from './ShortcutsModal';
import TeslaModal from './TeslaModal';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem } from '@/lib/types';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';
import { triggerDownload } from '@/lib/export';
import { MovieDetailSkeleton } from './Skeletons';

interface MovieDetailViewProps {
  movieId: string;
}

export default function MovieDetailView({ movieId }: MovieDetailViewProps) {
  const router = useRouter();
  const [movie, setMovie] = useState<ScannedMovie | null>(null);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Master List & States
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set());
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Flashcards & Shortcuts Modal State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
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

  // Sync Theme
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

      // '?' toggles shortcuts modal even if not in input
      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
          return;
        }
        if (isInput) {
          (active as HTMLElement).blur();
          return;
        }
      }

      // If typing in input or any modal is open, skip single-letter shortcuts
      if (isInput || isShortcutsOpen || isFlashcardOpen || modalConfig.isOpen) {
        return;
      }

      // Theme toggle
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      // Open Flashcards
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (vocab.length > 0) {
          setIsFlashcardOpen(true);
        }
        return;
      }

      // Open Original Video
      if (e.key === 'o' || e.key === 'O') {
        if (movie?.url) {
          e.preventDefault();
          window.open(movie.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // Back to all movies
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        router.push('/');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isFlashcardOpen, modalConfig.isOpen, theme, vocab, movie, router]);

  // Fetch Movie Details (Instant Cache Hydration + Silent Background Revalidation)
  const fetchMovie = useCallback(async () => {
    let hasCached = false;
    try {
      const cached = sessionStorage.getItem(`fx_movie_${movieId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setMovie(parsed);
          const extracted = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : extractVocabFromAnalysis(parsed.analysis);
          setVocab(extracted);
          setLoading(false);
          hasCached = true;
        }
      }
    } catch (e) {}

    if (!hasCached) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/movies/${encodeURIComponent(movieId)}`);
      const data = await res.json();
      if (data.success && data.movie) {
        setMovie(data.movie);
        const extracted = Array.isArray(data.movie.vocabulary)
          ? data.movie.vocabulary
          : extractVocabFromAnalysis(data.movie.analysis);
        setVocab(extracted);
        try {
          sessionStorage.setItem(`fx_movie_${movieId}`, JSON.stringify(data.movie));
        } catch (e) {}
      } else {
        if (!hasCached) {
          setError(data.error || 'Không tìm thấy dữ liệu cho phim này.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching movie:', err);
      if (!hasCached) {
        setError('Lỗi kết nối cơ sở dữ liệu.');
      }
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  // Fetch Master List (Hydrated instantly from local cache)
  const fetchMasterList = useCallback(async () => {
    try {
      const cachedMasterRaw = localStorage.getItem('fx_cached_master');
      if (cachedMasterRaw) {
        const parsed = JSON.parse(cachedMasterRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMasterItems(parsed);
          const set = new Set<string>();
          parsed.forEach((item: MasterItem) => {
            if (item && item.text) set.add(item.text.toLowerCase());
          });
          setMasteredWords(set);
          setDbConnected(true);
        }
      }
    } catch (e) {}

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
        setDbConnected(true);
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(data.items));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not connect to /api/master-list:', e);
      setDbConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchMovie();
    fetchMasterList();
  }, [fetchMovie, fetchMasterList]);

  // Toggle Mastered Word (Optimistic Update with instant 0ms UI response & silent rollback, zero popup)
  const handleToggleMaster = async (item: VocabItem) => {
    const clean = (item.word || item.sentence || '').trim().toLowerCase();
    if (!clean) return;

    const wasMastered = masteredWords.has(clean);
    const prevMasteredWords = new Set(masteredWords);
    const prevMasterItems = [...masterItems];

    const meaning = item.vietnamese || item.meaningVi || '';
    const optimisticNewItem: MasterItem = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: clean,
      type: item.sentence ? 'sentence' : (clean.includes(' ') ? 'phrase' : 'word'),
      pos: item.posLabelVi || item.pos || 'N',
      cefr: item.cefr || '',
      ipa: item.ipa || '',
      knownMeanings: meaning ? [meaning] : ['Đã thuộc'],
      context: item.contexts?.[0]?.text || item.sentence || ''
    };

    // 1. Instant 0ms Optimistic UI Update
    if (wasMastered) {
      setMasteredWords((prev) => {
        const next = new Set(prev);
        next.delete(clean);
        return next;
      });
      setMasterItems((prev) => {
        const next = prev.filter((m) => m.text.toLowerCase() !== clean);
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } else {
      setMasteredWords((prev) => new Set(prev).add(clean));
      setMasterItems((prev) => {
        const next = [optimisticNewItem, ...prev.filter((m) => m.text.toLowerCase() !== clean)];
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // 2. Background sync to Neon Database (Silent, NO popup)
    try {
      let res: Response;
      if (wasMastered) {
        res = await fetch(`/api/master-list?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
      } else {
        res = await fetch('/api/master-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            type: optimisticNewItem.type,
            pos: optimisticNewItem.pos,
            cefr: optimisticNewItem.cefr,
            ipa: optimisticNewItem.ipa,
            context: optimisticNewItem.context,
            meanings: optimisticNewItem.knownMeanings
          })
        });
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server sync error');
      }
    } catch (e: any) {
      console.error('Error syncing master list, rolling back optimistic update:', e);
      // Rollback to previous state on failure
      setMasteredWords(prevMasteredWords);
      setMasterItems(prevMasterItems);
      try {
        localStorage.setItem('fx_cached_master', JSON.stringify(prevMasterItems));
      } catch (err) {}
      showToast(`Không thể đồng bộ "${clean}", đã khôi phục trạng thái.`, 'error');
    }
  };

  // Toggle Starred Word
  const handleToggleStar = (word: string) => {
    const clean = (word || '').trim().toLowerCase();
    setStarredWords((prev) => {
      const next = new Set(prev);
      if (next.has(clean)) {
        next.delete(clean);
        showToast(`Đã bỏ đánh dấu sao "${clean}".`, 'info');
      } else {
        next.add(clean);
        showToast(`Đã đánh dấu sao "${clean}".`, 'success');
      }
      return next;
    });
  };

  // Open Flashcards
  const handleOpenFlashcards = () => {
    if (vocab.length === 0) {
      showToast('Không có từ vựng nào để tạo thẻ Flashcards.', 'warning');
      return;
    }
    setIsFlashcardOpen(true);
  };

  // Delete Current Movie
  const handleDeleteMovie = () => {
    if (!movie) return;
    setModalConfig({
      isOpen: true,
      title: 'Xóa phim khỏi Cloud?',
      message: `Bạn có chắc chắn muốn xóa "${movie.title}" khỏi cơ sở dữ liệu đám mây? Dữ liệu từ vựng đã phân tích của phim này sẽ bị xóa vĩnh viễn.`,
      confirmText: 'Xóa phim',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/movies/${encodeURIComponent(movie.id)}`, { method: 'DELETE' });
          router.push('/');
        } catch (e) {
          console.error('Error deleting movie:', e);
          showToast('Không thể xóa phim, vui lòng thử lại.', 'error');
        } finally {
          setModalConfig((c) => ({ ...c, isOpen: false }));
        }
      }
    });
  };

  // Export this specific movie episode vocabulary as JSON
  const handleExportMovieDetailJson = async () => {
    if (!movie) {
      showToast('Dữ liệu phim chưa sẵn sàng để xuất.', 'warning');
      return;
    }

    try {
      let fullCues = movie.cues || [];
      if (fullCues.length === 0) {
        try {
          const res = await fetch(`/api/movies/${encodeURIComponent(movie.id)}?cues=true`);
          const d = await res.json();
          if (d.success && d.movie && Array.isArray(d.movie.cues)) {
            fullCues = d.movie.cues;
          }
        } catch (e) {}
      }

      const safeTitle = (movie.title || 'movie').replace(/[^\w\s\-_]/g, '_').trim();
      const exportPayload = {
        exportType: 'single_movie_vocabulary',
        exportedAt: new Date().toISOString(),
        movie: {
          id: movie.id,
          title: movie.title,
          platform: movie.platform,
          url: movie.url,
          timestamp: movie.timestamp,
          dateFormatted: movie.dateFormatted,
          wordCount: movie.wordCount,
          nounCount: movie.nounCount,
          verbCount: movie.verbCount,
          adjCount: movie.adjCount,
          advCount: movie.advCount,
          phraseCount: movie.phraseCount,
          patternCount: movie.patternCount
        },
        vocabularyCount: vocab.length,
        vocabulary: vocab,
        cues: fullCues
      };

      triggerDownload(
        JSON.stringify(exportPayload, null, 2),
        `${safeTitle}_vocab.json`,
        'application/json;charset=utf-8'
      );
      showToast(`Đã xuất dữ liệu phim "${movie.title}" thành file JSON thành công`, 'success');
    } catch (err: any) {
      console.error('Error exporting movie JSON:', err);
      showToast(`Lỗi xuất JSON: ${err.message || 'Lỗi xử lý'}`, 'error');
    }
  };

  const isNetflix = movie?.platform === 'netflix' || Boolean(movie?.url && movie.url.includes('netflix.com'));
  const isYouTube = !isNetflix && (movie?.platform === 'youtube' || Boolean(movie?.url && (movie.url.includes('youtube.com') || movie.url.includes('youtu.be'))));
  const platformLabel = isNetflix ? 'netflix' : isYouTube ? 'youtube' : (movie?.platform || 'file');

  return (
    <div className="fx-studio-layout">
      {/* Top Navbar */}
      <Navbar
        activeView="studio"
        onViewChange={(v) => {
          if (v === 'master') {
            router.push('/?view=master');
          } else {
            router.push('/');
          }
        }}
        masterCount={masterItems.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        dbConnected={true}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportJson={handleExportMovieDetailJson}
        exportJsonTitle={`Xuất dữ liệu phim ${movie?.title || ''} (JSON)`}
      />

      {/* Main Content Area */}
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Loading State with Tesla Shimmer Skeleton */}
        {loading && <MovieDetailSkeleton count={9} />}

        {/* Navigation Breadcrumb Bar */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <Link
              href="/"
              className="fx-btn-tesla-ghost-sm"
              style={{ textDecoration: 'none', gap: '6px' }}
              title="Quay lại danh sách phim (phím tắt B)"
            >
              <ArrowLeft size={13} />
              <span>Tất cả phim</span>
            </Link>

            {movie && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenFlashcards}
                  className="fx-btn-tesla-primary-sm"
                  title="Ôn tập từ vựng phim bằng Flashcards 3D (phím tắt F)"
                >
                  <Layers size={13} />
                  <span>Flashcards</span>
                </button>

                {movie.url && (
                  <a
                    href={movie.url}
                    target="_blank"
                    rel="noreferrer"
                    className="fx-btn-tesla-ghost-sm"
                    style={{ textDecoration: 'none', gap: '6px' }}
                    title="Mở video gốc trên trình duyệt (phím tắt O)"
                  >
                    <ExternalLink size={13} />
                    <span>Xem video gốc</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleDeleteMovie}
                  className="fx-btn-tesla-ghost-sm"
                  style={{ color: 'var(--fx-accent-netflix)', gap: '6px' }}
                  title="Xóa phim này khỏi Cloud"
                >
                  <Trash2 size={13} />
                  <span>Xóa phim</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--fx-accent-netflix)',
            background: 'var(--fx-bg-surface)',
            border: '1px solid var(--fx-border-subtle)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>{error}</p>
            <Link href="/" className="fx-btn-tesla-primary-sm" style={{ textDecoration: 'none' }}>
              Quay về danh sách phim
            </Link>
          </div>
        )}

        {/* Loaded Movie View */}
        {!loading && movie && (
          <>
            {/* Movie Header Card */}
            <div style={{
              background: 'var(--fx-bg-surface)',
              border: '1px solid var(--fx-border-subtle)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--fx-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.3
              }}>
                {movie.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--fx-text-secondary)', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--fx-text-primary)', fontWeight: 500 }}>
                  {isNetflix ? 'Netflix' : isYouTube ? 'YouTube' : (movie.platform || 'File')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--fx-text-muted)' }}>·</span>
                <span>{movie.dateFormatted || 'Đã quét'}</span>
                <span style={{ fontSize: '11px', color: 'var(--fx-text-muted)' }}>·</span>
                <span>{vocab.length} từ vựng & mẫu câu</span>
              </div>
            </div>

            {/* Vocabulary Grid */}
            <VocabularyGrid
              movieTitle={movie.title}
              items={vocab}
              masteredWords={masteredWords}
              starredWords={starredWords}
              onToggleMaster={handleToggleMaster}
              onToggleStar={handleToggleStar}
            />
          </>
        )}
      </main>

      {/* 3D Flashcards Modal */}
      <FlashcardModal
        isOpen={isFlashcardOpen}
        items={vocab}
        onClose={() => setIsFlashcardOpen(false)}
        onToggleMaster={handleToggleMaster}
        onToast={showToast}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Confirmation Modal */}
      <TeslaModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isDanger={modalConfig.isDanger}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((c) => ({ ...c, isOpen: false }))}
      />

      {/* Toast Stack */}
      <Toast toasts={toasts} />
    </div>
  );
}
