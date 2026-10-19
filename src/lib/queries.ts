import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ScannedMovie, MasterItem, StarredItem, VocabItem } from '@/lib/types';
import { extractVocabFromAnalysis } from '@/lib/vocabExtractor';

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  movies: ['movies'] as const,
  movie: (id: string) => ['movie', id] as const,
  masterList: ['master-list'] as const,
  starredList: ['starred-list'] as const,
};

interface DashboardResponse {
  success: boolean;
  movies: ScannedMovie[];
  masterItems: MasterItem[];
  starredItems: StarredItem[];
}

// 1. Unified Dashboard Hook (Request Deduplication & Batching)
export function useDashboard(initialData?: Partial<DashboardResponse>) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      // 1. Check local storage cache for instant hydration
      let cachedMovies: ScannedMovie[] = [];
      let cachedMaster: MasterItem[] = [];
      let cachedStarred: StarredItem[] = [];

      try {
        const rawM = localStorage.getItem('fx_cached_movies');
        if (rawM) cachedMovies = JSON.parse(rawM);
        const rawMas = localStorage.getItem('fx_cached_master');
        if (rawMas) cachedMaster = JSON.parse(rawMas);
        const rawS = localStorage.getItem('fx_cached_starred');
        if (rawS) cachedStarred = JSON.parse(rawS);
      } catch {}

      // Fetch unified batch endpoint
      const res = await apiClient.get<DashboardResponse>('/api/dashboard');
      if (res.success) {
        // Persist to local storage for instant offline / next reload
        try {
          if (res.movies) localStorage.setItem('fx_cached_movies', JSON.stringify(res.movies));
          if (res.masterItems) localStorage.setItem('fx_cached_master', JSON.stringify(res.masterItems));
          if (res.starredItems) localStorage.setItem('fx_cached_starred', JSON.stringify(res.starredItems));
        } catch {}

        // Seed individual query caches
        if (res.movies) queryClient.setQueryData(queryKeys.movies, res.movies);
        if (res.masterItems) queryClient.setQueryData(queryKeys.masterList, res.masterItems);
        if (res.starredItems) queryClient.setQueryData(queryKeys.starredList, res.starredItems);
      }
      return res;
    },
    initialData: initialData?.movies ? (initialData as DashboardResponse) : undefined,
    staleTime: 30 * 1000,
  });
}

// 2. Movies List Hook
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
        if (raw) return JSON.parse(raw);
      } catch {}
      return undefined;
    },
    staleTime: 30 * 1000,
  });
}

// 3. Master List Hook
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
        if (raw) return JSON.parse(raw);
      } catch {}
      return undefined;
    },
    staleTime: 30 * 1000,
  });
}

// 4. Starred List Hook
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
        if (raw) return JSON.parse(raw);
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
        return apiClient.delete(`/api/master-list?text=${encodeURIComponent(clean)}`);
      } else {
        return apiClient.post('/api/master-list', {
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

      const prevMaster = queryClient.getQueryData<MasterItem[]>(queryKeys.masterList) || [];

      // Incremental local cache update (0ms instant response)
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
        return apiClient.delete(`/api/starred?text=${encodeURIComponent(clean)}`);
      } else {
        return apiClient.post('/api/starred', {
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

      const prevStarred = queryClient.getQueryData<StarredItem[]>(queryKeys.starredList) || [];

      // Incremental local cache update (0ms instant response)
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
