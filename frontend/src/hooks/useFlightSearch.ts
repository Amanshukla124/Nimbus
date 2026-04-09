import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchFlight, SearchResponse } from '../types/flight';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';
const DEBOUNCE_MS = 350;

interface UseFlightSearchState {
  flights: SearchFlight[];
  total: number;
  loading: boolean;
  error: string | null;
  search: (query: string, sort?: 'eta' | 'status') => void;
}

export function useFlightSearch(initialQuery = '', initialSort: 'eta' | 'status' = 'eta'): UseFlightSearchState {
  const [flights, setFlights] = useState<SearchFlight[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (query: string, sort: 'eta' | 'status' = 'eta') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, sort });
      const res = await fetch(`${API_BASE}/api/flights/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SearchResponse = await res.json();
      setFlights(data.flights);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback((query: string, sort: 'eta' | 'status' = 'eta') => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, sort), DEBOUNCE_MS);
  }, [doSearch]);

  // Load initial results on mount
  useEffect(() => {
    doSearch(initialQuery, initialSort);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { flights, total, loading, error, search };
}
