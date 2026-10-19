import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ScannedMovie, MasterItem, StarredItem } from '@/lib/types';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  movies: ['movies'] as const,
  movie: (id: string) => ['movie', id] as const,
  masterList: ['master-list'] as const,
  starredList: ['starred-list'] as const,
};

export interface DashboardResponse {
  success: boolean;
  movies: ScannedMovie[];
  masterItems: MasterItem[];
  starredItems: StarredItem[];
}

// 1. Unified Dashboard Batch Sync Hook
export function useDashboard(initialData?: Partial<DashboardResponse>) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await apiClient.get<DashboardResponse>('/api/dashboard');
      if (res && res.success) {
        if (Array.isArray(res.movies)) {
          queryClient.setQueryData(queryKeys.movies, res.movies);
          try {
            localStorage.setItem('fx_cached_movies', JSON.stringify(res.movies));
          } catch {}
        }
        if (Array.isArray(res.masterItems)) {
          queryClient.setQueryData(queryKeys.masterList, res.masterItems);
          try {
            localStorage.setItem('fx_cached_master', JSON.stringify(res.masterItems));
          } catch {}
        }
        if (Array.isArray(res.starredItems)) {
          queryClient.setQueryData(queryKeys.starredList, res.starredItems);
          try {
            localStorage.setItem('fx_cached_starred', JSON.stringify(res.starredItems));
          } catch {}
        }
      }
      return res;
    },
    initialData: initialData?.movies && initialData.movies.length > 0 ? (initialData as DashboardResponse) : undefined,
    staleTime: 30 * 1000,
  });
}

// 2. Movies List Hook (Canonical source of truth for movies)
export function useMovies(initialMovies?: ScannedMovie[]) {
  return useQuery({
    queryKey: queryKeys.movies,
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; movies: ScannedMovie[] }>('/api/movies');
      if (res.success && Array.isArray(res.movies)) {
        try {
          localStorage.setItem('fx_cached_movies', JSON.stringify(res.movies));
        } catch {}
        return res.movies;
      }
      return [];
    },
    initialData: () => {
      if (initialMovies && initialMovies.length > 0) return initialMovies;
      try {
        const raw = localStorage.getItem('fx_cached_movies');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return undefined;
    },
    staleTime: 30 * 1000,
  });
}

// 3. Master List Hook (Canonical source of truth for mastered words)
export function useMasterList(initialItems?: MasterItem[]) {
  return useQuery({
    queryKey: queryKeys.masterList,
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; items: MasterItem[] }>('/api/master-list');
      if (res.success && Array.isArray(res.items)) {
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(res.items));
        } catch {}
        return res.items;
      }
      return [];
    },
    initialData: () => {
      if (initialItems && initialItems.length > 0) return initialItems;
      try {
        const raw = localStorage.getItem('fx_cached_master');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return undefined;
    },
    staleTime: 30 * 1000,
  });
}

// 4. Starred List Hook (Canonical source of truth for starred words)
export function useStarredList(initialItems?: StarredItem[]) {
  return useQuery({
    queryKey: queryKeys.starredList,
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; items: StarredItem[] }>('/api/starred');
      if (res.success && Array.isArray(res.items)) {
        try {
          localStorage.setItem('fx_cached_starred', JSON.stringify(res.items));
        } catch {}
        return res.items;
      }
      return [];
    },
    initialData: () => {
      if (initialItems && initialItems.length > 0) return initialItems;
      try {
        const raw = localStorage.getItem('fx_cached_starred');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return undefined;
    },
    staleTime: 30 * 1000,
  });
}

// 5. Movie Detail Hook
export function useMovieDetail(movieId: string, initialData?: ScannedMovie | null) {
  return useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; movie: ScannedMovie }>(
        `/api/movies/${encodeURIComponent(movieId)}`
      );
      if (res.success && res.movie) {
        if (!res.movie.vocabulary && res.movie.analysis) {
          res.movie.vocabulary = extractVocabFromAnalysis(res.movie.analysis);
        }
        try {
          sessionStorage.setItem(`fx_movie_${movieId}`, JSON.stringify(res.movie));
        } catch {}
        return res.movie;
      }
      throw new Error('Movie not found');
    },
    initialData: () => {
      if (initialData) return initialData;
      try {
        const cached = sessionStorage.getItem(`fx_movie_${movieId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
      return undefined;
    },
    staleTime: 60 * 1000,
    enabled: Boolean(movieId),
  });
}

// 6. Incremental Revalidation Mutation: Toggle Master
export function useToggleMasterMutation(onError?: (err: any, clean: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clean,
      wasMastered,
      optimisticItem,
    }: {
      clean: string;
      wasMastered: boolean;
      optimisticItem: MasterItem;
    }) => {
      if (wasMastered) {
        return apiClient.delete<{ success: boolean; deleted: string }>(
          `/api/master-list?text=${encodeURIComponent(clean)}`
        );
      } else {
        return apiClient.post<{ success: boolean; item: MasterItem }>('/api/master-list', {
          text: clean,
          type: optimisticItem.type,
          pos: optimisticItem.pos,
          cefr: optimisticItem.cefr,
          ipa: optimisticItem.ipa,
          context: optimisticItem.context,
          meanings: optimisticItem.knownMeanings,
        });
      }
    },
    onMutate: async ({ clean, wasMastered, optimisticItem }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.masterList });

      let prevMaster = queryClient.getQueryData<MasterItem[]>(queryKeys.masterList);
      if (!prevMaster) {
        try {
          const raw = localStorage.getItem('fx_cached_master');
          if (raw) prevMaster = JSON.parse(raw);
        } catch {}
      }
      prevMaster = prevMaster || [];

      let nextMaster: MasterItem[];
      if (wasMastered) {
        nextMaster = prevMaster.filter((m) => m.text.toLowerCase() !== clean);
      } else {
        nextMaster = [optimisticItem, ...prevMaster.filter((m) => m.text.toLowerCase() !== clean)];
      }

      queryClient.setQueryData(queryKeys.masterList, nextMaster);

      try {
        localStorage.setItem('fx_cached_master', JSON.stringify(nextMaster));
      } catch {}

      return { prevMaster };
    },
    onSuccess: (data, variables) => {
      if (data && (data as any).item && !variables.wasMastered) {
        const serverItem = (data as any).item as MasterItem;
        queryClient.setQueryData<MasterItem[]>(queryKeys.masterList, (old) => {
          if (!old) return [serverItem];
          return old.map((m) => (m.text.toLowerCase() === variables.clean ? serverItem : m));
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.prevMaster) {
        queryClient.setQueryData(queryKeys.masterList, context.prevMaster);
        try {
          localStorage.setItem('fx_cached_master', JSON.stringify(context.prevMaster));
        } catch {}
      }
      if (onError) onError(err, variables.clean);
    },
  });
}

// 7. Incremental Revalidation Mutation: Toggle Star
export function useToggleStarMutation(onError?: (err: any, clean: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clean,
      wasStarred,
      optimisticItem,
    }: {
      clean: string;
      wasStarred: boolean;
      optimisticItem: StarredItem;
    }) => {
      if (wasStarred) {
        return apiClient.delete<{ success: boolean; text: string }>(
          `/api/starred?text=${encodeURIComponent(clean)}`
        );
      } else {
        return apiClient.post<{ success: boolean; item: StarredItem }>('/api/starred', {
          text: clean,
          type: optimisticItem.type,
          pos: optimisticItem.pos,
          cefr: optimisticItem.cefr,
          ipa: optimisticItem.ipa,
          context: optimisticItem.context,
          vietnamese: optimisticItem.vietnamese,
        });
      }
    },
    onMutate: async ({ clean, wasStarred, optimisticItem }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.starredList });

      let prevStarred = queryClient.getQueryData<StarredItem[]>(queryKeys.starredList);
      if (!prevStarred) {
        try {
          const raw = localStorage.getItem('fx_cached_starred');
          if (raw) prevStarred = JSON.parse(raw);
        } catch {}
      }
      prevStarred = prevStarred || [];

      let nextStarred: StarredItem[];
      if (wasStarred) {
        nextStarred = prevStarred.filter((s) => s.text.toLowerCase() !== clean);
      } else {
        nextStarred = [optimisticItem, ...prevStarred.filter((s) => s.text.toLowerCase() !== clean)];
      }

      queryClient.setQueryData(queryKeys.starredList, nextStarred);

      try {
        localStorage.setItem('fx_cached_starred', JSON.stringify(nextStarred));
      } catch {}

      return { prevStarred };
    },
    onSuccess: (data, variables) => {
      if (data && (data as any).item && !variables.wasStarred) {
        const serverItem = (data as any).item as StarredItem;
        queryClient.setQueryData<StarredItem[]>(queryKeys.starredList, (old) => {
          if (!old) return [serverItem];
          return old.map((s) => (s.text.toLowerCase() === variables.clean ? serverItem : s));
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.prevStarred) {
        queryClient.setQueryData(queryKeys.starredList, context.prevStarred);
        try {
          localStorage.setItem('fx_cached_starred', JSON.stringify(context.prevStarred));
        } catch {}
      }
      if (onError) onError(err, variables.clean);
    },
  });
}
