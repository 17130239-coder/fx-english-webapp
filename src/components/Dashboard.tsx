'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from './Navbar';
import ScannedHistory from './ScannedHistory';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem, StarredItem } from '@/lib/types';
import { triggerDownload } from '@/lib/export';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';
import { apiClient } from '@/lib/apiClient';
import {
  useDashboard,
  queryKeys,
  useToggleMasterMutation,
  useToggleStarMutation,
} from '@/lib/queries';
import { MasterListSkeleton } from './Skeletons';

// Code Splitting & Dynamic Imports (#9)
const FlashcardModal = dynamic(() => import('./FlashcardModal'), { ssr: false });
const ShortcutsModal = dynamic(() => import('./ShortcutsModal'), { ssr: false });
const TeslaModal = dynamic(() => import('./TeslaModal'), { ssr: false });
const MasterListView = dynamic(() => import('./MasterListView'), {
  loading: () => <MasterListSkeleton count={8} />,
});
const StarredListView = dynamic(() => import('./StarredListView'), {
  loading: () => <MasterListSkeleton count={8} />,
});

interface DashboardProps {
  initialData?: {
    movies: ScannedMovie[];
    masterItems: MasterItem[];
    starredItems: StarredItem[];
    connected: boolean;
  };
}

export default function Dashboard({ initialData }: DashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'studio' | 'master' | 'starred'>('studio');

  // TanStack Query Batch Hydration (#1, #3)
  const { data: dashboardData, isLoading, isError } = useDashboard(initialData);

  const movies = useMemo(() => dashboardData?.movies || initialData?.movies || [], [dashboardData, initialData]);
  const masterItems = useMemo(() => dashboardData?.masterItems || initialData?.masterItems || [], [dashboardData, initialData]);
  const starredItems = useMemo(() => dashboardData?.starredItems || initialData?.starredItems || [], [dashboardData, initialData]);
  const dbConnected = !isError && (dashboardData?.success ?? initialData?.connected ?? true);

  const loadingMovies = isLoading && movies.length === 0;
  const loadingMaster = isLoading && masterItems.length === 0;
  const loadingStarred = isLoading && starredItems.length === 0;

  const masteredWords = useMemo(() => {
    const set = new Set<string>();
    masterItems.forEach((item) => {
      if (item && item.text) set.add(item.text.toLowerCase());
    });
    return set;
  }, [masterItems]);

  const starredWords = useMemo(() => {
    const set = new Set<string>();
    starredItems.forEach((item) => {
      if (item && item.text) set.add(item.text.toLowerCase());
    });
    return set;
  }, [starredItems]);

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

  // Flashcards & Shortcuts Modal State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

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

      if (e.key === '1') {
        e.preventDefault();
        setActiveView('studio');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setActiveView('master');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        setActiveView('starred');
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleOpenFlashcards();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isFlashcardOpen, modalConfig.isOpen, theme]);

  // URL view parameter sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'master') {
        setActiveView('master');
      } else if (params.get('view') === 'starred') {
        setActiveView('starred');
      }
    }
  }, []);

  // Incremental Revalidation Mutations (#8)
  const toggleMasterMutation = useToggleMasterMutation((err, clean) => {
    showToast(`Không thể đồng bộ "${clean}", đã khôi phục trạng thái.`, 'error');
  });

  const toggleStarMutation = useToggleStarMutation((err, clean) => {
    showToast(`Không thể đồng bộ "${clean}", đã khôi phục trạng thái.`, 'error');
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

    // Sync to dashboard state cache
    queryClient.setQueryData(queryKeys.dashboard, (old: any) => {
      if (!old) return old;
      const prevItems: MasterItem[] = old.masterItems || [];
      const nextItems = wasMastered
        ? prevItems.filter((m) => m.text.toLowerCase() !== clean)
        : [optimisticNewItem, ...prevItems.filter((m) => m.text.toLowerCase() !== clean)];
      return { ...old, masterItems: nextItems };
    });
  };

  // Toggle Starred Word
  const handleToggleStar = async (word: string, item?: VocabItem) => {
    const clean = word.trim().toLowerCase();
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
      context: item?.contexts?.[0]?.text || item?.sentence || '',
      vietnamese: meaning,
    };

    toggleStarMutation.mutate({ clean, wasStarred, optimisticItem: optimisticNewItem });

    // Sync to dashboard state cache
    queryClient.setQueryData(queryKeys.dashboard, (old: any) => {
      if (!old) return old;
      const prevItems: StarredItem[] = old.starredItems || [];
      const nextItems = wasStarred
        ? prevItems.filter((s) => s.text.toLowerCase() !== clean)
        : [optimisticNewItem, ...prevItems.filter((s) => s.text.toLowerCase() !== clean)];
      return { ...old, starredItems: nextItems };
    });
  };

  const handleToggleStarFromList = async (item: StarredItem) => {
    const clean = (item?.text || '').trim().toLowerCase();
    if (!clean) return;

    const wasStarred = starredWords.has(clean);
    toggleStarMutation.mutate({ clean, wasStarred, optimisticItem: item });
  };

  // Clear All Starred Words
  const handleClearAllStarred = () => {
    setModalConfig({
      isOpen: true,
      title: 'Xóa toàn bộ từ đã lưu',
      message: 'Bạn có chắc chắn muốn xóa TOÀN BỘ từ vựng đã gắn sao khỏi cơ sở dữ liệu? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        setModalConfig((m) => ({ ...m, isOpen: false }));
        try {
          await apiClient.delete('/api/starred');
          queryClient.setQueryData(queryKeys.starredList, []);
          queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
            old ? { ...old, starredItems: [] } : old
          );
          try {
            localStorage.removeItem('fx_cached_starred');
          } catch {}
          showToast('Đã xóa sạch danh sách từ đã lưu', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      },
    });
  };

  // Delete Movie
  const handleDeleteMovie = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const target = movies.find((m) => m.id === id);
    const movieTitle = target?.title || 'tập phim này';

    setModalConfig({
      isOpen: true,
      title: 'Xóa phim khỏi Cloud?',
      message: `Bạn có chắc chắn muốn xóa "${movieTitle}" khỏi cơ sở dữ liệu đám mây? Toàn bộ từ vựng đã phân tích của phim này sẽ bị xóa vĩnh viễn.`,
      confirmText: 'Xóa phim',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: async () => {
        setModalConfig((m) => ({ ...m, isOpen: false }));
        const targetUrl = target?.url?.trim();

        // Optimistically remove movie from cache
        const nextMovies = movies.filter((m) => {
          if (m.id === id) return false;
          if (targetUrl && m.url && m.url.trim() === targetUrl) return false;
          return true;
        });

        queryClient.setQueryData(queryKeys.movies, nextMovies);
        queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
          old ? { ...old, movies: nextMovies } : old
        );

        try {
          await apiClient.delete(`/api/movies/${encodeURIComponent(id)}`);
          showToast(`Đã xóa phim "${movieTitle}" thành công`, 'info');
          try {
            localStorage.setItem('fx_cached_movies', JSON.stringify(nextMovies));
          } catch {}
        } catch (err: any) {
          showToast(`Lỗi khi xóa: ${err.message}`, 'error');
          queryClient.invalidateQueries({ queryKey: queryKeys.movies });
        }
      },
    });
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
          await apiClient.delete('/api/movies');
          queryClient.setQueryData(queryKeys.movies, []);
          queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
            old ? { ...old, movies: [] } : old
          );
          try {
            localStorage.removeItem('fx_cached_movies');
          } catch {}
          showToast('Đã xóa sạch lịch sử quét trên Cloud', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      },
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
                const data = await apiClient.post<{ success: boolean; item: MasterItem }>(
                  '/api/master-list',
                  {
                    text,
                    type: 'word',
                    pos: 'N',
                    meanings,
                  }
                );
                if (data.success && data.item) {
                  const updated = [data.item, ...masterItems.filter((x) => x.text !== text)];
                  queryClient.setQueryData(queryKeys.masterList, updated);
                  queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
                    old ? { ...old, masterItems: updated } : old
                  );
                  showToast(`Đã lưu "${text}" vào Master List`, 'success');
                }
              } catch (err: any) {
                showToast(`Lỗi: ${err.message}`, 'error');
              }
            },
          });
        }, 150);
      },
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
          await apiClient.delete(`/api/master-list?text=${encodeURIComponent(clean)}`);
          const updated = masterItems.filter((m) => m.text.toLowerCase() !== clean);
          queryClient.setQueryData(queryKeys.masterList, updated);
          queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
            old ? { ...old, masterItems: updated } : old
          );
          showToast(`Đã xóa "${clean}" khỏi Master List`, 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      },
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
          const data = await apiClient.post<{ success: boolean; item: MasterItem }>(
            '/api/master-list',
            {
              text: clean,
              meanings: [newMeaning],
            }
          );
          if (data.success && data.item) {
            const updated = masterItems.map((item) =>
              item.text.toLowerCase() === clean ? data.item : item
            );
            queryClient.setQueryData(queryKeys.masterList, updated);
            queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
              old ? { ...old, masterItems: updated } : old
            );
            showToast(`Đã thêm nghĩa cho "${clean}"`, 'success');
          }
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      },
    });
  };

  // Remove Meaning from Word
  const handleRemoveMeaning = async (text: string, meaning: string) => {
    const clean = text.trim().toLowerCase();
    const item = masterItems.find((m) => m.text.toLowerCase() === clean);
    if (!item) return;

    const remainingMeanings = item.knownMeanings.filter((m) => m !== meaning);
    try {
      const data = await apiClient.post<{ success: boolean; item: MasterItem }>(
        '/api/master-list',
        {
          text: clean,
          type: item.type,
          pos: item.pos,
          meanings: remainingMeanings,
        }
      );
      if (data.success && data.item) {
        const updated = masterItems.map((x) =>
          x.text.toLowerCase() === clean ? data.item : x
        );
        queryClient.setQueryData(queryKeys.masterList, updated);
        queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
          old ? { ...old, masterItems: updated } : old
        );
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
          await apiClient.delete('/api/master-list');
          queryClient.setQueryData(queryKeys.masterList, []);
          queryClient.setQueryData(queryKeys.dashboard, (old: any) =>
            old ? { ...old, masterItems: [] } : old
          );
          showToast('Đã xóa sạch Master List trên Cloud', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      },
    });
  };

  // Export all vocabulary across all movies as JSON
  const handleExportAllMoviesJson = async () => {
    if (movies.length === 0) {
      showToast('Chưa có phim nào để xuất dữ liệu.', 'warning');
      return;
    }

    try {
      showToast('Đang tổng hợp dữ liệu từ vựng tất cả các phim...', 'info');
      const data = await apiClient.get<{ success: boolean; movies: any[] }>('/api/movies?full=true');
      const rawMovies: any[] = data.success && Array.isArray(data.movies) ? data.movies : [];

      if (rawMovies.length === 0) {
        showToast('Không tìm thấy dữ liệu phim để xuất.', 'warning');
        return;
      }

      const allVocabMap = new Map<string, any>();
      const processedMovies = rawMovies.map((m) => {
        let analysis = m.analysis;
        if (typeof analysis === 'string') {
          try {
            analysis = JSON.parse(analysis);
          } catch {
            analysis = {};
          }
        }
        let cues = m.cues;
        if (typeof cues === 'string') {
          try {
            cues = JSON.parse(cues);
          } catch {
            cues = [];
          }
        }

        const vocabList = extractVocabFromAnalysis(analysis);

        vocabList.forEach((v) => {
          const key = (v.word || v.sentence || '').toLowerCase().trim();
          if (!key) return;
          if (allVocabMap.has(key)) {
            const existing = allVocabMap.get(key);
            existing.totalFrequency =
              (existing.totalFrequency || existing.frequency || 1) + (v.frequency || 1);
            if (m.title && !existing.foundInMovies.includes(m.title)) {
              existing.foundInMovies.push(m.title);
            }
          } else {
            allVocabMap.set(key, {
              ...v,
              totalFrequency: v.frequency || 1,
              foundInMovies: m.title ? [m.title] : [],
            });
          }
        });

        return {
          id: m.id,
          title: m.title,
          platform: m.platform,
          url: m.url,
          timestamp: m.timestamp,
          dateFormatted: m.dateFormatted,
          wordCount: m.wordCount,
          nounCount: m.nounCount,
          verbCount: m.verbCount,
          adjCount: m.adjCount,
          advCount: m.advCount,
          phraseCount: m.phraseCount,
          patternCount: m.patternCount,
          vocabulary: vocabList,
          cues: cues || [],
        };
      });

      const exportPayload = {
        exportType: 'all_movies_vocabulary',
        exportedAt: new Date().toISOString(),
        totalMovies: processedMovies.length,
        totalUniqueVocabulary: allVocabMap.size,
        movies: processedMovies,
        allUniqueVocabulary: Array.from(allVocabMap.values()),
      };

      triggerDownload(
        JSON.stringify(exportPayload, null, 2),
        `fx_english_all_movies_vocab_${Date.now()}.json`,
        'application/json;charset=utf-8'
      );
      showToast(
        `Đã xuất thành công dữ liệu từ vựng của ${processedMovies.length} phim thành file JSON`,
        'success'
      );
    } catch (err: any) {
      console.error('Error exporting all movies JSON:', err);
      showToast(`Lỗi xuất JSON: ${err.message || 'Lỗi xử lý'}`, 'error');
    }
  };

  // Open Flashcards
  const handleOpenFlashcards = () => {
    if (activeView === 'master') {
      if (masterItems.length === 0) {
        showToast('Master List chưa có từ vựng nào để luyện.', 'warning');
        return;
      }
      setIsFlashcardOpen(true);
    } else if (activeView === 'starred') {
      if (starredItems.length === 0) {
        showToast('Chưa có từ vựng nào được gắn sao để luyện Flashcards.', 'warning');
        return;
      }
      setIsFlashcardOpen(true);
    } else {
      if (movies.length > 0) {
        router.push(`/movies/${encodeURIComponent(movies[0].id)}`);
      } else {
        showToast('Chưa có phim nào để ôn tập Flashcards.', 'warning');
      }
    }
  };

  const masterVocabItems: VocabItem[] = useMemo(() => {
    return (masterItems || [])
      .filter((m): m is MasterItem => Boolean(m && m.text))
      .map((m) => {
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
      .filter((s): s is StarredItem => Boolean(s && s.text))
      .map((s) => {
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
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        masterCount={masterItems.length}
        starredCount={starredItems.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        dbConnected={dbConnected}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportJson={handleExportAllMoviesJson}
        exportJsonTitle="Xuất toàn bộ từ vựng của tất cả các phim (JSON)"
      />

      {/* Main Content Area */}
      <main className="fx-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div key={activeView} className="fx-tab-pane">
          {activeView === 'studio' ? (
            <ScannedHistory
              movies={movies}
              selectedMovieId={null}
              onSelectMovie={(m) => router.push(`/movies/${encodeURIComponent(m.id)}`)}
              onDeleteMovie={handleDeleteMovie}
              onClearAll={handleClearAllMovies}
              loading={loadingMovies}
            />
          ) : activeView === 'master' ? (
            <MasterListView
              items={masterItems}
              onAddWord={handleAddMasterWord}
              onRemoveWord={handleRemoveMasterWord}
              onAddMeaning={handleAddMeaningInline}
              onRemoveMeaning={handleRemoveMeaning}
              onClearAll={handleClearAllMaster}
              loading={loadingMaster}
            />
          ) : (
            <StarredListView
              items={starredItems}
              onToggleStar={handleToggleStarFromList}
              onClearAll={handleClearAllStarred}
              loading={loadingStarred}
            />
          )}
        </div>
      </main>

      {/* 3D Flashcards Modal (Lazy Loaded) */}
      {isFlashcardOpen && (
        <FlashcardModal
          isOpen={isFlashcardOpen}
          items={activeView === 'starred' ? starredVocabItems : masterVocabItems}
          onClose={() => setIsFlashcardOpen(false)}
          onToggleMaster={(item) => {
            handleRemoveMasterWord(item.word);
          }}
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

      {/* Reusable Confirmation / Prompt Modal (Lazy Loaded) */}
      {modalConfig.isOpen && (
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
      )}

      {/* Tesla Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
