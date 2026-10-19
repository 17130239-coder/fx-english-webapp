'use client';

import React, { useState } from 'react';
import { Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ScannedMovie } from '@/lib/types';
import { ScannedHistorySkeleton } from './Skeletons';

interface ScannedHistoryProps {
  movies: ScannedMovie[];
  selectedMovieId: string | null;
  onSelectMovie: (movie: ScannedMovie) => void;
  onDeleteMovie: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  loading?: boolean;
}

export default function ScannedHistory({
  movies,
  selectedMovieId,
  onSelectMovie,
  onDeleteMovie,
  onClearAll,
  loading = false
}: ScannedHistoryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Deduplicate movies by URL (or ID if no URL)
  const deduplicatedMovies = React.useMemo(() => {
    const map = new Map<string, ScannedMovie>();
    (movies || []).forEach((m) => {
      if (!m) return;
      const key = (m.url && m.url.trim()) ? m.url.trim() : m.id;
      if (key && !map.has(key)) {
        map.set(key, m);
      }
    });
    return Array.from(map.values());
  }, [movies]);

  // If loading, show skeleton shimmer cards
  if (loading) {
    return <ScannedHistorySkeleton count={6} />;
  }

  if (deduplicatedMovies.length === 0) {
    return (
      <section className="fx-history-section fx-fade-in">
        <div className="fx-section-header">
          <h2>Phim & Video Đã Quét (0)</h2>
        </div>
        <div className="fx-history-empty">
          <p>Chưa có lịch sử. Khi bạn quét từ vựng trên YouTube/Netflix hoặc tải phụ đề lên, các bộ phim sẽ tự động đồng bộ qua Neon Serverless Postgres.</p>
        </div>
      </section>
    );
  }

  // Display at most 6 movies when collapsed, or all when expanded
  const displayedMovies = isExpanded ? deduplicatedMovies : deduplicatedMovies.slice(0, 6);

  return (
    <section className="fx-history-section fx-fade-in">
      <div className="fx-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2>Phim & Video Đã Quét</h2>
          <span className="fx-nav-pill-count">{deduplicatedMovies.length}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {movies.length > 6 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="fx-btn-ghost-text"
              style={{ fontSize: '12px' }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={13} />
                  <span>Thu gọn (6 phim)</span>
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  <span>Xem tất cả ({movies.length} phim)</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="fx-btn-ghost-text"
            title="Xóa toàn bộ phim đã quét trên Cloud"
          >
            <Trash2 size={13} />
            <span>Xóa tất cả</span>
          </button>
        </div>
      </div>

      <div className="fx-history-grid">
        {displayedMovies.map((movie) => {
          const isSelected = selectedMovieId === movie.id;
          const isNetflix = movie.platform === 'netflix' || Boolean(movie.url && movie.url.includes('netflix.com'));
          const isYouTube = !isNetflix && (movie.platform === 'youtube' || Boolean(movie.url && (movie.url.includes('youtube.com') || movie.url.includes('youtu.be'))));
          const platformLabel = isNetflix ? 'netflix' : isYouTube ? 'youtube' : (movie.platform || 'file');

          return (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className={`fx-history-card ${isSelected ? 'active' : ''}`}
            >
              {/* Header: Platform & Date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className={`fx-platform-dot ${
                      isNetflix ? 'platform-nf' : isYouTube ? 'platform-yt' : ''
                    }`}
                    style={
                      !isNetflix && !isYouTube
                        ? { width: '6px', height: '6px', borderRadius: '50%', background: '#A1A1AA' }
                        : {}
                    }
                  />
                  <span className="fx-platform-tag">{platformLabel}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--fx-text-secondary)' }}>
                    <Calendar size={11} />
                    <span>{movie.dateFormatted || 'Vừa xong'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDeleteMovie(movie.id, e);
                    }}
                    className="fx-btn-del-hist"
                    title="Xóa phim khỏi Cloud"
                    style={{ padding: '4px 6px', zIndex: 10 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="fx-history-title-row-card">
                <h3 className="fx-history-title" title={movie.title}>
                  {movie.title}
                </h3>
              </div>

              {/* Stats Block */}
              <div className="fx-history-stats-block">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span className="fx-hist-total-num">
                    {movie.wordCount?.toLocaleString() || 0}
                    <span style={{ fontSize: '13px', color: 'var(--fx-text-secondary)', fontWeight: 500, marginLeft: '4px' }}>từ vựng</span>
                  </span>

                  <div className="fx-hist-specs">
                    {movie.nounCount > 0 && <span>Danh từ: {movie.nounCount} </span>}
                    {movie.verbCount > 0 && <span>· Động từ: {movie.verbCount} </span>}
                    {movie.adjCount > 0 && <span>· Tính từ: {movie.adjCount}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
