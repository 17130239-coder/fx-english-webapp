export class ApiClientError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoffMs?: number;
}

const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF = 300; // 300ms initial backoff

async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    backoffMs = DEFAULT_BACKOFF,
    ...fetchOptions
  } = options;

  let attempt = 0;
  let currentBackoff = backoffMs;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // Merge caller signal if provided
    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Retry on server errors (500, 502, 503, 504) if attempts remain
      if (!response.ok && response.status >= 500 && attempt < retries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, currentBackoff));
        currentBackoff *= 2;
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);

      // Retry on network errors or timeouts if attempts remain
      if (attempt < retries && (err.name === 'AbortError' || err.name === 'TypeError')) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, currentBackoff));
        currentBackoff *= 2;
        continue;
      }

      throw err;
    }
  }
}

export const apiClient = {
  async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiClientError(
        data?.error || `HTTP error ${res.status}: ${res.statusText}`,
        res.status,
        data
      );
    }

    return data as T;
  },

  async post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiClientError(
        data?.error || `HTTP error ${res.status}: ${res.statusText}`,
        res.status,
        data
      );
    }

    return data as T;
  },

  async delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const res = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiClientError(
        data?.error || `HTTP error ${res.status}: ${res.statusText}`,
        res.status,
        data
      );
    }

    return data as T;
  },
};
