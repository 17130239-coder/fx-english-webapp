'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2, Layers } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from './Navbar';
import VocabularyGrid from './VocabularyGrid';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem, StarredItem } from '@/lib/types';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';
import { triggerDownload } from '@/lib/export';
import { MovieDetailSkeleton } from './Skeletons';
import { apiClient } from '@/lib/apiClient';
import {
  queryKeys,
  useMovieDetail,
  useMasterList,
  useStarredList,
  useToggleMasterMutation,
  useToggleStarMutation,
} from '@/lib/queries';

// Code Splitting & Dynamic Imports (#9)
const FlashcardModal = dynamic(() => import('./FlashcardModal'), { ssr: false });
const ShortcutsModal = dynamic(() => import('./ShortcutsModal'), { ssr: false });
const TeslaModal = dynamic(() => import('./TeslaModal'), { ssr: false });

interface MovieDetailViewProps {
  movieId: string;
  initialMovie?: ScannedMovie | null;
}

export default function MovieDetailView({ movieId, initialMovie }: MovieDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query for Movie Details (#1, #2)
  const {
    data: movie,
    isLoading: loading,
    isError,
    error: queryError,
  } = useMovieDetail(movieId, initialMovie);

  // Shared Master and Starred Query Hooks (#1)
  const { data: masterItems = [] } = useMasterList();
  const { data: starredItems = [] } = useStarredList();

  const masteredWords = useMemo(() => {
    const set = new Set<string>();
    masterItems.forEach((item: MasterItem) => {
      if (item && item.text) set.add(item.text.toLowerCase());
    });
    return set;
  }, [masterItems]);

  const starredWords = useMemo(() => {
    const set = new Set<string>();
    starredItems.forEach((item: StarredItem) => {
      if (item && item.text) set.add(item.text.toLowerCase());
    });
    return set;
  }, [starredItems]);

  const vocab: VocabItem[] = useMemo(() => {
    if (!movie) return [];
    if (Array.isArray(movie.vocabulary) && movie.vocabulary.length > 0) {
      return movie.vocabulary;
    }
    if (movie.analysis) {
      return extractVocabFromAnalysis(movie.analysis);
    }
    return [];
  }, [movie]);

  // Flashcards & Shortcuts Modal State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fx-theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }
    } catch {}
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
    } catch {}
  };

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
    onConfirm: () => {},
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

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
        if (isFlashcardOpen) {
          e.preventDefault();
          setIsFlashcardOpen(false);
          return;
        }
        if (isInput) {
          (active as HTMLElement).blur();
          return;
        }
      }

      if (isInput || isShortcutsOpen || isFlashcardOpen || modalConfig.isOpen) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (vocab.length > 0) {
          setIsFlashcardOpen(true);
        } else {
          showToast('Không có từ vựng nào để tạo Flashcards.', 'warning');
        }
        return;
      }

      if (e.key === 'o' || e.key === 'O') {
        if (movie?.url) {
          e.preventDefault();
          window.open(movie.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        router.push('/');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isFlashcardOpen, modalConfig.isOpen, theme, vocab, movie, router]);

  // Incremental Revalidation Mutations (#8)
  const toggleMasterMutation = useToggleMasterMutation((err, clean) => {
    showToast(`Không thể đồng bộ "${clean}", đã khôi phục trạng thái.`, 'error');
  });

  const toggleStarMutation = useToggleStarMutation((err, clean) => {
    showToast(`Không thể đồng bộ dấu sao cho "${clean}", đã khôi phục trạng thái.`, 'error');
  });

  // Toggle Mastered Word
  const handleToggleMaster = async (item: VocabItem) => {
    const clean = (item.word || item.sentence || '').trim().toLowerCase();
    if (!clean) return;

    const wasMastered = masteredWords.has(clean);
    const meaning = item.vietnamese || item.meaningVi || '';
    const optimisticNewItem: MasterItem = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: clean,
      type: item.sentence ? 'sentence' : clean.includes(' ') ? 'phrase' : 'word',
      pos: item.posLabelVi || item.pos || 'N',
      cefr: item.cefr || '',
      ipa: item.ipa || '',
      knownMeanings: meaning ? [meaning] : ['Đã thuộc'],
      context: item.contexts?.[0]?.text || item.sentence || '',
    };

    toggleMasterMutation.mutate({ clean, wasMastered, optimisticItem: optimisticNewItem });
  };

  // Toggle Starred Word
  const handleToggleStar = async (word: string, item?: VocabItem) => {
    const clean = (word || '').trim().toLowerCase();
    if (!clean) return;

    const wasStarred = starredWords.has(clean);
    const meaning = item?.vietnamese || item?.meaningVi || '';
    const optimisticNewItem: StarredItem = {
      id: `star_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: clean,
      type: item?.sentence ? 'sentence' : clean.includes(' ') ? 'phrase' : 'word',
      pos: item?.posLabelVi || item?.pos || 'N',
      cefr: item?.cefr || '',
      ipa: item?.ipa || '',
      vietnamese: meaning,
      meaningVi: meaning,
      context: item?.contexts?.[0]?.text || item?.sentence || '',
    };

    toggleStarMutation.mutate({ clean, wasStarred, optimisticItem: optimisticNewItem });
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
          await apiClient.delete(`/api/movies/${encodeURIComponent(movie.id)}`);
          queryClient.setQueryData<ScannedMovie[]>(queryKeys.movies, (prev) =>
            prev ? prev.filter((m) => m.id !== movie.id) : []
          );
          try {
            const raw = localStorage.getItem('fx_cached_movies');
            if (raw) {
              const parsed = JSON.parse(raw);
              localStorage.setItem(
                'fx_cached_movies',
                JSON.stringify(parsed.filter((m: any) => m.id !== movie.id))
              );
            }
            sessionStorage.removeItem(`fx_movie_${movie.id}`);
          } catch {}
          router.push('/');
        } catch (e: any) {
          console.error('Error deleting movie:', e);
          showToast('Không thể xóa phim, vui lòng thử lại.', 'error');
        } finally {
          setModalConfig((c) => ({ ...c, isOpen: false }));
        }
      },
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
          const d = await apiClient.get<{ success: boolean; movie: ScannedMovie }>(
            `/api/movies/${encodeURIComponent(movie.id)}?cues=true`
          );
          if (d.success && d.movie && Array.isArray(d.movie.cues)) {
            fullCues = d.movie.cues;
          }
        } catch {}
      }

      const safeTitle = (movie.title || 'movie').replace(/[^\w\s\-_]/g, '_').trim();
      const exportPayload = {
        exportType: 'single_movie_vocabulary',
        movieId: movie.id,
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
        patternCount: movie.patternCount,
        totalVocabulary: vocab.length,
        exportedAt: new Date().toISOString(),
        vocabulary: vocab,
        cues: fullCues,
      };

      triggerDownload(
        JSON.stringify(exportPayload, null, 2),
        `fx_english_vocab_${safeTitle}_${Date.now()}.json`,
        'application/json;charset=utf-8'
      );
      showToast(`Đã xuất từ vựng của phim "${movie.title}" thành file JSON`, 'success');
    } catch (err: any) {
      console.error('Error exporting movie JSON:', err);
      showToast(`Lỗi xuất file: ${err.message || 'Lỗi không xác định'}`, 'error');
    }
  };

  // Master vocabulary items for FlashcardModal
  const masterVocabItems: VocabItem[] = useMemo(() => {
    return (masterItems || [])
      .filter((m: MasterItem): m is MasterItem => Boolean(m && m.text))
      .map((m: MasterItem) => {
        const meaning = Array.isArray(m.knownMeanings)
          ? m.knownMeanings.join(', ')
          : typeof m.knownMeanings === 'string'
          ? m.knownMeanings
          : '';
        return {
          word: m.text,
          pos: m.pos || 'noun',
          cefr: m.cefr || 'B1',
          ipa: m.ipa || '',
          vietnamese: meaning,
          meaningVi: meaning,
          frequency: 1,
          contexts: m.context ? [{ text: m.context }] : [],
        };
      });
  }, [masterItems]);

  const starredVocabItems: VocabItem[] = useMemo(() => {
    return (starredItems || [])
      .filter((s: StarredItem): s is StarredItem => Boolean(s && s.text))
      .map((s: StarredItem) => {
        const meaning =
          s.vietnamese ||
          s.meaningVi ||
          (Array.isArray(s.knownMeanings) ? s.knownMeanings.join(', ') : '');
        return {
          word: s.text,
          pos: s.pos || 'noun',
          cefr: s.cefr || 'B1',
          ipa: s.ipa || '',
          vietnamese: meaning,
          meaningVi: meaning,
          frequency: 1,
          contexts: s.context ? [{ text: s.context }] : [],
        };
      });
  }, [starredItems]);

  return (
    <div className="fx-studio-layout">
      {/* Top Navbar */}
      <Navbar
        activeView="studio"
        onViewChange={(view) => {
          router.push(`/?view=${view}`);
        }}
        masterCount={masterItems.length}
        starredCount={starredItems.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        dbConnected={true}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportJson={handleExportMovieDetailJson}
        exportJsonTitle={`Xuất dữ liệu phim ${movie?.title || ''} (JSON)`}
      />

      {/* Main Content */}
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Breadcrumb Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Link
            href="/"
            className="fx-btn fx-btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại Studio</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {movie?.url && (
              <a
                href={movie.url}
                target="_blank"
                rel="noopener noreferrer"
                className="fx-btn fx-btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                title="Mở video gốc trên tab mới"
              >
                <ExternalLink size={14} />
                <span>Mở Video</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleOpenFlashcards}
              disabled={loading || vocab.length === 0}
              className="fx-btn fx-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Layers size={14} />
              <span>Luyện Flashcards ({vocab.length})</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteMovie}
              disabled={loading || !movie}
              className="fx-btn fx-btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--fx-accent-red)',
              }}
              title="Xóa tập phim này khỏi Neon Cloud"
            >
              <Trash2 size={14} />
              <span>Xóa Phim</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && !movie && <MovieDetailSkeleton count={9} />}

        {/* Error State */}
        {isError && !movie && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--fx-bg-surface)',
              border: '1px solid var(--fx-border-subtle)',
              borderRadius: '8px',
            }}
          >
            <p style={{ color: 'var(--fx-accent-red)', marginBottom: '16px', fontSize: '15px' }}>
              {(queryError as any)?.message || 'Không tìm thấy dữ liệu cho phim này.'}
            </p>
            <Link href="/" className="fx-btn fx-btn-primary">
              Quay về trang chủ
            </Link>
          </div>
        )}

        {/* Loaded Movie Header & Vocab Grid */}
        {movie && (
          <div className="fx-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'var(--fx-bg-surface)',
                border: '1px solid var(--fx-border-subtle)',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {movie.title}
                </h1>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--fx-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {movie.dateFormatted || new Date(movie.timestamp || Date.now()).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '12px',
                  color: 'var(--fx-text-secondary)',
                }}
              >
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  {movie.platform}
                </span>
                <span>·</span>
                <span>{movie.wordCount?.toLocaleString() || 0} từ trong phụ đề</span>
                <span>·</span>
                <span>{vocab.length} mục từ vựng trích xuất</span>
              </div>
            </div>

            {/* Vocabulary Grid */}
            <VocabularyGrid
              items={vocab}
              masteredWords={masteredWords}
              starredWords={starredWords}
              onToggleMaster={handleToggleMaster}
              onToggleStar={handleToggleStar}
              movieTitle={movie.title}
            />
          </div>
        )}
      </main>

      {/* 3D Flashcards Modal (Lazy Loaded) */}
      {isFlashcardOpen && (
        <FlashcardModal
          isOpen={isFlashcardOpen}
          items={vocab}
          onClose={() => setIsFlashcardOpen(false)}
          onToggleMaster={handleToggleMaster}
          onToast={showToast}
        />
      )}

      {/* Shortcuts Cheat Sheet Modal (Lazy Loaded) */}
      {isShortcutsOpen && (
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      )}

      {/* Confirmation Modal (Lazy Loaded) */}
      {modalConfig.isOpen && (
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
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
