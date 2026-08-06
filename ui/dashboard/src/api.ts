const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}
