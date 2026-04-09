import { useState, useEffect } from 'react';
import type { FlightDetail } from '../types/flight';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

interface UseFlightDetailState {
  flight: FlightDetail | null;
  loading: boolean;
  error: string | null;
}

export function useFlightDetail(flightId: string | undefined): UseFlightDetailState {
  const [flight, setFlight] = useState<FlightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightId) return;

    let cancelled = false;
    setLoading(true);
    setFlight(null);
    setError(null);

    fetch(`${API_BASE}/api/flights/${encodeURIComponent(flightId)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: FlightDetail) => {
        if (!cancelled) {
          setFlight(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load flight');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [flightId]);

  return { flight, loading, error };
}
