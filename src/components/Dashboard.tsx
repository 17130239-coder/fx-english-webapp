'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import ScannedHistory from './ScannedHistory';
import MasterListView from './MasterListView';
import StarredListView from './StarredListView';
import FlashcardModal from './FlashcardModal';
import ShortcutsModal from './ShortcutsModal';
import TeslaModal from './TeslaModal';
import Toast, { ToastItem } from './Toast';
import { ScannedMovie, VocabItem, MasterItem, StarredItem } from '@/lib/types';
import { triggerDownload } from '@/lib/export';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';

export default function Dashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'studio' | 'master' | 'starred'>('studio');
  const [movies, setMovies] = useState<ScannedMovie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(true);
  const [loadingStarred, setLoadingStarred] = useState<boolean>(true);

  // Master List & States
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
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
    onConfirm: () => {}
  });

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

      // If user is currently typing in an input or modal is open, skip single-letter shortcuts
      if (isInput || isShortcutsOpen || isFlashcardOpen || modalConfig.isOpen) {
        return;
      }

      // Theme toggle
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleTheme();
      }

      // Quick view navigation
      if (e.key === '1') {
        e.preventDefault();
        setActiveView('studio');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveView('master');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isFlashcardOpen, modalConfig.isOpen, theme]);

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
        try {
          localStorage.setItem('fx_cached_movies', JSON.stringify(data.movies));
        } catch (e) {}
      } else {
        setDbConnected(false);
      }
    } catch (e) {
      console.warn('Could not connect to /api/movies:', e);
      setDbConnected(false);
    } finally {
      setLoadingMovies(false);
    }
  }, []);

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
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(data.items));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not connect to /api/master-list:', e);
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  // 3. Fetch Starred List from Neon Serverless
  const fetchStarredList = useCallback(async () => {
    try {
      const res = await fetch('/api/starred');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setStarredItems(data.items);
        const set = new Set<string>();
        data.items.forEach((item: StarredItem) => {
          if (item && item.text) set.add(item.text.toLowerCase());
        });
        setStarredWords(set);
        try {
          localStorage.setItem('fx_cached_starred', JSON.stringify(data.items));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not connect to /api/starred:', e);
    } finally {
      setLoadingStarred(false);
    }
  }, []);

  useEffect(() => {
    // 1. Instant Cache Hydration (SWR Pattern for 0ms First Paint)
    try {
      const cachedMoviesRaw = localStorage.getItem('fx_cached_movies');
      if (cachedMoviesRaw) {
        const parsed = JSON.parse(cachedMoviesRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovies(parsed);
          setLoadingMovies(false);
          setDbConnected(true);
        }
      }

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
          setLoadingMaster(false);
        }
      }

      const cachedStarredRaw = localStorage.getItem('fx_cached_starred');
      if (cachedStarredRaw) {
        const parsed = JSON.parse(cachedStarredRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStarredItems(parsed);
          const set = new Set<string>();
          parsed.forEach((item: StarredItem) => {
            if (item && item.text) set.add(item.text.toLowerCase());
          });
          setStarredWords(set);
          setLoadingStarred(false);
        }
      }
    } catch (e) {
      console.warn('Local cache hydration error:', e);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'master') {
        setActiveView('master');
      } else if (params.get('view') === 'starred') {
        setActiveView('starred');
      }
    }

    // 2. Silent Background Revalidation
    fetchMovies();
    fetchMasterList();
    fetchStarredList();
  }, [fetchMovies, fetchMasterList, fetchStarredList]);


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

  // Toggle Starred Word (Optimistic Update 0ms, syncs to Neon DB, zero popup)
  const handleToggleStar = async (word: string, item?: VocabItem) => {
    const clean = word.trim().toLowerCase();
    if (!clean) return;

    const wasStarred = starredWords.has(clean);
    const prevStarredWords = new Set(starredWords);
    const prevStarredItems = [...starredItems];

    const meaning = item?.vietnamese || item?.meaningVi || '';
    const optimisticNewItem: StarredItem = {
      id: `star_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: clean,
      type: item?.sentence ? 'sentence' : (clean.includes(' ') ? 'phrase' : 'word'),
      pos: item?.posLabelVi || item?.pos || 'N',
      cefr: item?.cefr || '',
      ipa: item?.ipa || '',
      vietnamese: meaning,
      meaningVi: meaning,
      context: item?.contexts?.[0]?.text || item?.sentence || ''
    };

    // 1. Instant 0ms Optimistic UI Update
    if (wasStarred) {
      setStarredWords((prev) => {
        const next = new Set(prev);
        next.delete(clean);
        return next;
      });
      setStarredItems((prev) => {
        const next = prev.filter((m) => m.text.toLowerCase() !== clean);
        try {
          localStorage.setItem('fx_cached_starred', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } else {
      setStarredWords((prev) => new Set(prev).add(clean));
      setStarredItems((prev) => {
        const next = [optimisticNewItem, ...prev.filter((m) => m.text.toLowerCase() !== clean)];
        try {
          localStorage.setItem('fx_cached_starred', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // 2. Background sync to Neon Database (Silent, NO popup)
    try {
      let res: Response;
      if (wasStarred) {
        res = await fetch(`/api/starred?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
      } else {
        res = await fetch('/api/starred', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            type: optimisticNewItem.type,
            pos: optimisticNewItem.pos,
            cefr: optimisticNewItem.cefr,
            ipa: optimisticNewItem.ipa,
            context: optimisticNewItem.context,
            vietnamese: optimisticNewItem.vietnamese
          })
        });
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server sync error');
      }
    } catch (e: any) {
      console.error('Error syncing starred word, rolling back:', e);
      setStarredWords(prevStarredWords);
      setStarredItems(prevStarredItems);
      try {
        localStorage.setItem('fx_cached_starred', JSON.stringify(prevStarredItems));
      } catch (err) {}
      showToast(`Không thể đồng bộ dấu sao cho "${clean}", đã khôi phục trạng thái.`, 'error');
    }
  };

  // Toggle star directly from StarredListView
  const handleToggleStarFromList = async (item: StarredItem) => {
    const clean = item.text.trim().toLowerCase();
    const prevItems = [...starredItems];
    const prevWords = new Set(starredWords);

    setStarredWords((prev) => {
      const next = new Set(prev);
      next.delete(clean);
      return next;
    });
    setStarredItems((prev) => {
      const next = prev.filter((s) => s.text.toLowerCase() !== clean);
      try {
        localStorage.setItem('fx_cached_starred', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      const res = await fetch(`/api/starred?text=${encodeURIComponent(clean)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (e) {
      setStarredWords(prevWords);
      setStarredItems(prevItems);
      try {
        localStorage.setItem('fx_cached_starred', JSON.stringify(prevItems));
      } catch (err) {}
      showToast(`Không thể đồng bộ bỏ sao cho "${clean}"`, 'error');
    }
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
          await fetch('/api/starred', { method: 'DELETE' });
          setStarredItems([]);
          setStarredWords(new Set());
          try {
            localStorage.removeItem('fx_cached_starred');
          } catch (e) {}
          showToast('Đã xóa sạch danh sách từ đã lưu', 'info');
        } catch (err: any) {
          showToast(`Lỗi: ${err.message}`, 'error');
        }
      }
    });
  };

  // Delete Movie (Confirmed via TeslaModal popup + cloud sync)
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

        // Optimistically update UI
        setMovies((prev) => prev.filter((m) => {
          if (m.id === id) return false;
          if (targetUrl && m.url && m.url.trim() === targetUrl) return false;
          return true;
        }));

        try {
          const res = await fetch(`/api/movies/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Cache-Control': 'no-cache' }
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Đã xóa phim "${movieTitle}" thành công`, 'info');
          } else {
            showToast(`Không thể xóa phim: ${data.error || 'Lỗi server'}`, 'error');
            fetchMovies();
          }
        } catch (err: any) {
          showToast(`Lỗi kết nối khi xóa: ${err.message}`, 'error');
          fetchMovies();
        }
      }
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
          await fetch('/api/movies', { method: 'DELETE' });
          setMovies([]);
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

  // Export all vocabulary across all movies as JSON
  const handleExportAllMoviesJson = async () => {
    if (movies.length === 0) {
      showToast('Chưa có phim nào để xuất dữ liệu.', 'warning');
      return;
    }

    try {
      showToast('Đang tổng hợp dữ liệu từ vựng tất cả các phim...', 'info');
      const res = await fetch('/api/movies?full=true');
      const data = await res.json();
      const rawMovies: any[] = (data.success && Array.isArray(data.movies)) ? data.movies : [];

      if (rawMovies.length === 0) {
        showToast('Không tìm thấy dữ liệu phim để xuất.', 'warning');
        return;
      }

      const allVocabMap = new Map<string, any>();
      const processedMovies = rawMovies.map((m) => {
        let analysis = m.analysis;
        if (typeof analysis === 'string') {
          try { analysis = JSON.parse(analysis); } catch (e) { analysis = {}; }
        }
        let cues = m.cues;
        if (typeof cues === 'string') {
          try { cues = JSON.parse(cues); } catch (e) { cues = []; }
        }

        const vocabList = extractVocabFromAnalysis(analysis);

        // Aggregate unique vocabulary across all movies
        vocabList.forEach((v) => {
          const key = (v.word || v.sentence || '').toLowerCase().trim();
          if (!key) return;
          if (allVocabMap.has(key)) {
            const existing = allVocabMap.get(key);
            existing.totalFrequency = (existing.totalFrequency || existing.frequency || 1) + (v.frequency || 1);
            if (m.title && !existing.foundInMovies.includes(m.title)) {
              existing.foundInMovies.push(m.title);
            }
          } else {
            allVocabMap.set(key, {
              ...v,
              totalFrequency: v.frequency || 1,
              foundInMovies: m.title ? [m.title] : []
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
          cues: cues || []
        };
      });

      const exportPayload = {
        exportType: 'all_movies_vocabulary',
        exportedAt: new Date().toISOString(),
        totalMovies: processedMovies.length,
        totalUniqueVocabulary: allVocabMap.size,
        movies: processedMovies,
        allUniqueVocabulary: Array.from(allVocabMap.values())
      };

      triggerDownload(
        JSON.stringify(exportPayload, null, 2),
        `fx_english_all_movies_vocab_${Date.now()}.json`,
        'application/json;charset=utf-8'
      );
      showToast(`Đã xuất thành công dữ liệu từ vựng của ${processedMovies.length} phim thành file JSON`, 'success');
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

  const masterVocabItems: VocabItem[] = (masterItems || [])
    .filter((m): m is MasterItem => Boolean(m && m.text))
    .map((m) => {
      const meaning = Array.isArray(m.knownMeanings)
        ? m.knownMeanings.join(', ')
        : (typeof m.knownMeanings === 'string' ? m.knownMeanings : '');
      return {
        word: m.text,
        pos: m.pos || 'noun',
        cefr: m.cefr || 'B1',
        ipa: m.ipa || '',
        vietnamese: meaning,
        meaningVi: meaning,
        frequency: 1,
        contexts: m.context ? [{ text: m.context }] : []
      };
    });

  const starredVocabItems: VocabItem[] = (starredItems || [])
    .filter((s): s is StarredItem => Boolean(s && s.text))
    .map((s) => {
      const meaning = s.vietnamese || s.meaningVi || (Array.isArray(s.knownMeanings) ? s.knownMeanings.join(', ') : '');
      return {
        word: s.text,
        pos: s.pos || 'noun',
        cefr: s.cefr || 'B1',
        ipa: s.ipa || '',
        vietnamese: meaning,
        meaningVi: meaning,
        frequency: 1,
        contexts: s.context ? [{ text: s.context }] : []
      };
    });

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
            /* Master Known List Management View */
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
            /* Starred / Advanced Difficult Words View */
            <StarredListView
              items={starredItems}
              onToggleStar={handleToggleStarFromList}
              onClearAll={handleClearAllStarred}
              loading={loadingStarred}
            />
          )}
        </div>
      </main>

      {/* 3D Flashcards Modal */}
      <FlashcardModal
        isOpen={isFlashcardOpen}
        items={activeView === 'starred' ? starredVocabItems : masterVocabItems}
        onClose={() => setIsFlashcardOpen(false)}
        onToggleMaster={(item) => {
          handleRemoveMasterWord(item.word);
        }}
        onToast={showToast}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
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
