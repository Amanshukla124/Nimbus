import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export interface FlightEndpoint {
  iata: string;
  name: string;
  scheduled: string;
  actual?: string;
  estimated?: string;
  gate: string;
  terminal: string;
  delay?: number | null;
}

export interface FlightLive {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;      // feet or metres depending on source
  speed_kph: number | null;
  heading: number | null;
  vertical_rate: number | null;
  is_ground: boolean | null;
  updated: string | null;
}

export interface FlightByNumber {
  found: boolean;
  source: 'aviationstack' | 'simulated';
  flight_no: string;
  airline: string;
  status: string;
  origin: FlightEndpoint;
  destination: FlightEndpoint;
  live: FlightLive;
  timestamp: number;
}

interface State {
  flight: FlightByNumber | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useFlightByNumber() {
  const [state, setState] = useState<State>({
    flight: null,
    loading: false,
    error: null,
    notFound: false,
  });

  const lookup = useCallback(async (flightNo: string) => {
    const q = flightNo.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return;

    setState({ flight: null, loading: true, error: null, notFound: false });
    try {
      const res = await fetch(`${API_BASE}/api/flights/by-number?flight=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FlightByNumber = await res.json();
      if (!data.found) {
        setState({ flight: null, loading: false, error: null, notFound: true });
      } else {
        setState({ flight: data, loading: false, error: null, notFound: false });
      }
    } catch (err) {
      setState({
        flight: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch flight',
        notFound: false,
      });
    }
  }, []);

  const clear = useCallback(() => {
    setState({ flight: null, loading: false, error: null, notFound: false });
  }, []);

  return { ...state, lookup, clear };
}
