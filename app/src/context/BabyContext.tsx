import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api, createBabyApi } from '../api/client';
import type { Baby } from '../types';

type BabyApi = ReturnType<typeof createBabyApi>;

interface BabyContextValue {
  baby: Baby | null;
  babyApi: BabyApi;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BabyCtx = createContext<BabyContextValue>({
  baby: null,
  babyApi: createBabyApi(''),
  loading: true,
  refetch: async () => {},
});

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBaby = useCallback(async () => {
    try {
      const babies = await api.babies.list() as Baby[];
      setBaby(babies[0] ?? null);
    } catch {
      setBaby(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBaby(); }, [fetchBaby]);

  const babyApi = useMemo(() => createBabyApi(baby?.id ?? ''), [baby?.id]);

  return (
    <BabyCtx.Provider value={{ baby, babyApi, loading, refetch: fetchBaby }}>
      {children}
    </BabyCtx.Provider>
  );
}

export function useBaby() {
  return useContext(BabyCtx);
}
