import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export interface BoardFlight {
  flight_no: string;
  airline: string;
  airport_iata: string;
  airport_name: string;
  airport_city: string;
  scheduled: string;
  estimated: string;
  actual?: string | null;
  status: string;
  delay_min?: number | null;
  gate: string;
  terminal: string;
}

export interface Airport {
  iata: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
}

interface AirportBoardState {
  airport: Airport | null;
  arrivals: BoardFlight[];
  departures: BoardFlight[];
  source: 'aviationstack' | 'simulated' | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useAirportBoard(iata: string): AirportBoardState {
  const [airport, setAirport] = useState<Airport | null>(null);
  const [arrivals, setArrivals] = useState<BoardFlight[]>([]);
  const [departures, setDepartures] = useState<BoardFlight[]>([]);
  const [source, setSource] = useState<'aviationstack' | 'simulated' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!iata) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/airport/${iata}/board?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAirport(data.airport);
      setArrivals(data.arrivals || []);
      setDepartures(data.departures || []);
      setSource(data.source);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [iata]);

  useEffect(() => {
    fetchBoard();
    const timer = setInterval(fetchBoard, 60_000); // refresh every 60s
    return () => clearInterval(timer);
  }, [fetchBoard]);

  return { airport, arrivals, departures, source, loading, error, lastUpdated, refresh: fetchBoard };
}
