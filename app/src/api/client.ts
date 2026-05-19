const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

const get  = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) });
const del  = <T>(path: string)               => request<T>(path, { method: 'DELETE' });

// ─── Baby-agnostic endpoints ──────────────────────────────────────

export const api = {
  babies: {
    list:   ()                    => get('/babies'),
    get:    (id: string)          => get(`/babies/${id}`),
    create: (data: unknown)       => post('/babies', data),
    update: (id: string, d: unknown) => put(`/babies/${id}`, d),
  },
  seed: () => post('/seed', {}),
};

// ─── Baby-scoped API (created per baby) ──────────────────────────

export function createBabyApi(babyId: string) {
  const b = babyId;
  return {
    caregivers: {
      list:   ()                          => get(`/babies/${b}/caregivers`),
      create: (data: unknown)             => post(`/babies/${b}/caregivers`, data),
      remove: (id: string)                => del(`/babies/${b}/caregivers/${id}`),
    },
    members: {
      list:   ()                          => get(`/babies/${b}/members`),
      invite: (email: string)             => post(`/babies/${b}/members`, { email }),
    },
    feedings: {
      get:    (id: string)                => get(`/babies/${b}/feedings/${id}`),
      list:   (limit = 50)                => get(`/babies/${b}/feedings?limit=${limit}`),
      create: (data: unknown)             => post(`/babies/${b}/feedings`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/feedings/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/feedings/${id}`),
    },
    sleeps: {
      get:    (id: string)                => get(`/babies/${b}/sleeps/${id}`),
      list:   (limit = 50)                => get(`/babies/${b}/sleeps?limit=${limit}`),
      create: (data: unknown)             => post(`/babies/${b}/sleeps`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/sleeps/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/sleeps/${id}`),
    },
    pumping: {
      get:    (id: string)                => get(`/babies/${b}/pumping/${id}`),
      list:   (limit = 50)                => get(`/babies/${b}/pumping?limit=${limit}`),
      create: (data: unknown)             => post(`/babies/${b}/pumping`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/pumping/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/pumping/${id}`),
    },
    diapers: {
      get:    (id: string)                => get(`/babies/${b}/diapers/${id}`),
      list:   (limit = 50)                => get(`/babies/${b}/diapers?limit=${limit}`),
      create: (data: unknown)             => post(`/babies/${b}/diapers`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/diapers/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/diapers/${id}`),
    },
    baths: {
      get:    (id: string)                => get(`/babies/${b}/baths/${id}`),
      list:   (limit = 50)                => get(`/babies/${b}/baths?limit=${limit}`),
      create: (data: unknown)             => post(`/babies/${b}/baths`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/baths/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/baths/${id}`),
    },
    growth: {
      get:    (id: string)                => get(`/babies/${b}/growth/${id}`),
      list:   ()                          => get(`/babies/${b}/growth`),
      create: (data: unknown)             => post(`/babies/${b}/growth`, data),
      update: (id: string, data: unknown) => put(`/babies/${b}/growth/${id}`, data),
      remove: (id: string)                => del(`/babies/${b}/growth/${id}`),
    },
    visits: {
      list:   ()                          => get(`/babies/${b}/visits`),
      create: (data: unknown)             => post(`/babies/${b}/visits`, data),
    },
    stats: {
      today:  (from?: string)             => get(`/babies/${b}/stats/today${from ? `?from=${encodeURIComponent(from)}` : ''}`),
      weekly: ()                          => get(`/babies/${b}/stats/weekly`),
    },
    timeline: {
      get: (from?: string, to?: string)   => get(`/babies/${b}/timeline${from ? `?from=${from}&to=${to}` : ''}`),
    },
  };
}
