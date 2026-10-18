'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2, Layers } from 'lucide-react';
import Navbar from './Navbar';
import VocabularyGrid from './VocabularyGrid';
import FlashcardModal from './FlashcardModal';
import TeslaModal from './TeslaModal';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem } from '@/lib/types';
import { extractVocabFromAnalysis } from '@/lib/analyzer';
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

  // Flashcards State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);

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

  // Fetch Movie Details
  const fetchMovie = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies/${encodeURIComponent(movieId)}`);
      const data = await res.json();
      if (data.success && data.movie) {
        setMovie(data.movie);
        const extracted = extractVocabFromAnalysis(data.movie.analysis);
        setVocab(extracted);
      } else {
        setError(data.error || 'Không tìm thấy dữ liệu cho phim này.');
      }
    } catch (err: any) {
      console.error('Error fetching movie:', err);
      setError('Lỗi kết nối cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  // Fetch Master List
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
        setDbConnected(true);
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

  // Toggle Mastered Word
  const handleToggleMaster = async (item: VocabItem) => {
    const clean = (item.word || item.sentence || '').trim().toLowerCase();
    const isCurrentlyMastered = masteredWords.has(clean);

    if (isCurrentlyMastered) {
      setMasteredWords((prev) => {
        const next = new Set(prev);
        next.delete(clean);
        return next;
      });
      showToast(`Đã bỏ "${clean}" khỏi Master List.`, 'info');
      try {
        await fetch(`/api/master-list?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
        fetchMasterList();
      } catch (e) {
        console.error('Error removing from master list:', e);
      }
    } else {
      setMasteredWords((prev) => {
        const next = new Set(prev);
        next.add(clean);
        return next;
      });
      showToast(`Đã thêm "${clean}" vào Master List!`, 'success');
      try {
        await fetch('/api/master-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: item.word || item.sentence,
            pos: item.pos,
            cefr: item.cefr,
            ipa: item.ipa,
            knownMeanings: item.vietnamese ? [item.vietnamese] : [],
            context: item.contexts?.[0]?.text || '',
            highlightPhrase: item.highlightPhrase
          })
        });
        fetchMasterList();
      } catch (e) {
        console.error('Error saving to master list:', e);
      }
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
              title="Quay lại danh sách phim"
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
                  title="Ôn tập từ vựng phim bằng Flashcards 3D"
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
                    title="Mở video gốc trên trình duyệt"
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
