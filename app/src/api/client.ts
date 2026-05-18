import { BABY_ID } from '../tokens';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

const b = BABY_ID;

export const api = {
  seed: () => post('/seed', {}),
  baby: {
    get: () => get(`/babies/${b}`),
  },
  caregivers: {
    list: () => get(`/babies/${b}/caregivers`),
    create: (data: unknown) => post(`/babies/${b}/caregivers`, data),
  },
  feedings: {
    list: (limit = 50) => get(`/babies/${b}/feedings?limit=${limit}`),
    create: (data: unknown) => post(`/babies/${b}/feedings`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/feedings/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/feedings/${id}`),
  },
  sleeps: {
    list: (limit = 50) => get(`/babies/${b}/sleeps?limit=${limit}`),
    create: (data: unknown) => post(`/babies/${b}/sleeps`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/sleeps/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/sleeps/${id}`),
  },
  pumping: {
    list: (limit = 50) => get(`/babies/${b}/pumping?limit=${limit}`),
    create: (data: unknown) => post(`/babies/${b}/pumping`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/pumping/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/pumping/${id}`),
  },
  diapers: {
    list: (limit = 50) => get(`/babies/${b}/diapers?limit=${limit}`),
    create: (data: unknown) => post(`/babies/${b}/diapers`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/diapers/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/diapers/${id}`),
  },
  baths: {
    list: (limit = 50) => get(`/babies/${b}/baths?limit=${limit}`),
    create: (data: unknown) => post(`/babies/${b}/baths`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/baths/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/baths/${id}`),
  },
  growth: {
    list: () => get(`/babies/${b}/growth`),
    create: (data: unknown) => post(`/babies/${b}/growth`, data),
    update: (id: string, data: unknown) => put(`/babies/${b}/growth/${id}`, data),
    remove: (id: string) => del(`/babies/${b}/growth/${id}`),
  },
  visits: {
    list: () => get(`/babies/${b}/visits`),
    create: (data: unknown) => post(`/babies/${b}/visits`, data),
  },
  stats: {
    today: () => get(`/babies/${b}/stats/today`),
    weekly: () => get(`/babies/${b}/stats/weekly`),
  },
  timeline: {
    get: (date?: string) => get(`/babies/${b}/timeline${date ? `?date=${date}` : ''}`),
  },
};
