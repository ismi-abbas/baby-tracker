import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';

/**
 * Reads ?id=<recordId> from the URL, fetches the record via the provided
 * getter, and returns { editId, record, loading }.
 *
 * If no id is in the URL the hook is a no-op (record stays null).
 */
export function useEditRecord<T>(
  getter: (id: string) => Promise<T>,
): { editId: string | null; record: T | null; loading: boolean } {
  const search = useSearch({ strict: false }) as { id?: string };
  const editId = search.id ?? null;
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    getter(editId)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [editId]);

  return { editId, record, loading };
}
