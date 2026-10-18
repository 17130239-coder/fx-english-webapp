'use client';

import React from 'react';
import { Film, Trash2, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { ScannedMovie } from '@/lib/types';

interface ScannedHistoryProps {
  movies: ScannedMovie[];
  selectedMovieId: string | null;
  onSelectMovie: (movie: ScannedMovie) => void;
  onDeleteMovie: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export default function ScannedHistory({
  movies,
  selectedMovieId,
  onSelectMovie,
  onDeleteMovie,
  onClearAll
}: ScannedHistoryProps) {
  if (movies.length === 0) {
    return (
      <div className="w-full rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-8 text-center flex flex-col items-center gap-3">
        <Film size={28} className="text-[#52525B]" />
        <h3 className="text-[15px] font-semibold text-[#F4F4F6]">Chưa có lịch sử phim quét</h3>
        <p className="text-[12.5px] text-[#71717A] max-w-md">
          Các bộ phim bạn quét từ Chrome Extension trên Netflix/YouTube hoặc tải lên tại đây sẽ tự động đồng bộ thời gian thực qua Neon Serverless Postgres.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-[#F4F4F6] tracking-tight">Phim đã quét trên Cloud</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[#A1A1AA]">
            {movies.length}
          </span>
        </div>

        <button
          onClick={onClearAll}
          className="text-[12px] text-[#71717A] hover:text-[#E50914] transition-colors"
        >
          Xóa toàn bộ lịch sử
        </button>
      </div>

      {/* Grid of Movie Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {movies.map((movie) => {
          const isSelected = selectedMovieId === movie.id;
          const isNetflix = movie.platform === 'netflix';
          const isYouTube = movie.platform === 'youtube';

          return (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className={`group relative rounded-xl bg-[#141416] border p-4.5 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-white bg-[#1C1C1F] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                  : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#19191C]'
              }`}
            >
              {/* Card Header: Platform Tag & Date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isNetflix
                        ? 'bg-[#E50914]'
                        : isYouTube
                        ? 'bg-[#FF0000]'
                        : 'bg-[#A1A1AA]'
                    }`}
                  />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#A1A1AA]">
                    {movie.platform}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#71717A]">
                  <Calendar size={11} />
                  <span>{movie.dateFormatted || 'Vừa xong'}</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#F4F4F6] tracking-tight line-clamp-1 group-hover:text-white transition-colors">
                  {movie.title}
                </h3>
                {movie.url && (
                  <a
                    href={movie.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-[#52525B] hover:text-[#A1A1AA] mt-0.5 line-clamp-1"
                  >
                    <ExternalLink size={10} />
                    <span className="truncate max-w-[220px]">{movie.url}</span>
                  </a>
                )}
              </div>

              {/* Specs & POS Distribution */}
              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)] text-[11.5px] text-[#71717A]">
                <div className="flex items-center gap-1 font-mono text-[#A1A1AA]">
                  <BookOpen size={12} className="text-[#52525B]" />
                  <span>{movie.wordCount.toLocaleString()} từ</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                  {movie.nounCount > 0 && <span>N:{movie.nounCount}</span>}
                  {movie.verbCount > 0 && <span>· V:{movie.verbCount}</span>}
                  {movie.adjCount > 0 && <span>· Adj:{movie.adjCount}</span>}
                </div>

                {/* Delete Movie Button */}
                <button
                  type="button"
                  onClick={(e) => onDeleteMovie(movie.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#52525B] hover:text-[#E50914] transition-all rounded"
                  title="Xóa phim khỏi Cloud"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
