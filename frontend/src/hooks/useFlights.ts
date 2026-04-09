import { useState, useEffect, useCallback, useRef } from 'react';
import type { LiveFlight, LiveFlightsResponse } from '../types/flight';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';
const POLL_INTERVAL_MS = 30_000;

interface UseFlightsState {
  flights: LiveFlight[];
  count: number;
  source: 'opensky' | 'simulated' | 'aviation_edge' | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * Fetches live flights.
 * @param limit  max flights to fetch
 * @param region 'india' → /api/flights/india (bounding box), 'global' → /api/flights/live
 */
export function useFlights(
  limit = 80,
  region: 'india' | 'global' = 'india',
): UseFlightsState {
  const [flights, setFlights] = useState<LiveFlight[]>([]);
  const [count, setCount] = useState(0);
  const [source, setSource] = useState<'opensky' | 'simulated' | 'aviation_edge' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endpoint = region === 'india'
    ? `${API_BASE}/api/flights/india?limit=${limit}`
    : `${API_BASE}/api/flights/live?limit=${limit}`;

  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LiveFlightsResponse & { source: 'opensky' | 'simulated' | 'aviation_edge' } =
        await res.json();
      setFlights(data.flights);
      setCount(data.count);
      setSource(data.source as any);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchFlights();
    timerRef.current = setInterval(fetchFlights, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchFlights]);

  return { flights, count, source, loading, error, lastUpdated, refresh: fetchFlights };
}
