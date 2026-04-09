/**
 * FlightTicker — Phase 6
 * A continuously scrolling marquee showing live flight callsigns,
 * routes, and status pulled from the search API.
 */
import { useEffect, useRef, useState } from 'react';
import type { SearchFlight } from '../types/flight';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

// Status colour mapping
const statusColor: Record<string, string> = {
  'on-time':  '#8ff5ff',
  'in-air':   '#97a9ff',
  'delayed':  '#ff6e84',
  'landed':   '#a9abb3',
  'cancelled':'#ff6e84',
};

const statusLabel: Record<string, string> = {
  'on-time':  'ON TIME',
  'in-air':   'IN AIR',
  'delayed':  'DELAYED',
  'landed':   'LANDED',
  'cancelled':'CANC.',
};

interface TickerItemProps {
  flight: SearchFlight;
}

const TickerItem = ({ flight }: TickerItemProps) => {
  const color = statusColor[flight.status] ?? '#a9abb3';
  const label = statusLabel[flight.status] ?? flight.status.toUpperCase();
  return (
    <div className="flex items-center gap-5 px-6 select-none">
      {/* Separator */}
      <span className="text-[rgba(69,72,79,0.5)] font-display">·</span>

      {/* Callsign */}
      <span className="font-display font-bold text-sm text-[#ecedf6] tracking-tight whitespace-nowrap">
        {flight.flightNo}
      </span>

      {/* Route */}
      <span className="font-label text-[#73757d] whitespace-nowrap">
        {flight.origin} → {flight.dest}
      </span>

      {/* Status badge */}
      <span
        className="font-label whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full"
        style={{
          color,
          background: `${color}18`,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </span>

      {/* Airline */}
      <span className="font-label text-[#45484f] whitespace-nowrap">{flight.airline}</span>
    </div>
  );
};

export const FlightTicker = () => {
  const [flights, setFlights] = useState<SearchFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetch(`${API_BASE}/api/flights/search?sort=eta`)
      .then(r => r.json())
      .then(data => {
        if (mounted.current) {
          setFlights(data.flights ?? []);
          setLoading(false);
        }
      })
      .catch(() => mounted.current && setLoading(false));
    return () => { mounted.current = false; };
  }, []);

  // Static fallback items while loading
  const placeholderItems = loading
    ? Array.from({ length: 10 }, (_, i) => ({ id: `ph-${i}` }))
    : null;

  // Duplicate the full list to create a seamless loop
  const items = flights.length > 0 ? [...flights, ...flights] : [];

  return (
    <div
      className="w-full overflow-hidden border-t border-b border-ghost relative"
      style={{ background: 'rgba(7,9,14,0.8)', backdropFilter: 'blur(16px)' }}
    >
      {/* Live dot */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 pr-4"
        style={{ background: 'linear-gradient(to right, rgba(7,9,14,0.95) 80%, transparent)' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8ff5ff] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8ff5ff]" />
        </span>
        <span className="font-label text-[#8ff5ff] whitespace-nowrap pr-2">LIVE FEED</span>
      </div>

      {/* Ticker scroll area */}
      <div className="pl-28 py-2.5 overflow-hidden">
        {loading ? (
          /* Shimmer placeholders */
          <div className="flex items-center gap-8">
            {placeholderItems!.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="h-3 w-20 bg-[#1c2028] rounded shimmer" />
                <div className="h-2 w-16 bg-[#1c2028] rounded shimmer" />
                <div className="h-4 w-14 bg-[#1c2028] rounded-full shimmer" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="ticker-track">
            {items.map((flight, i) => (
              <TickerItem key={`${flight.id}-${i}`} flight={flight} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Right fade-out vignette */}
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(7,9,14,0.95), transparent)' }}
      />
    </div>
  );
};
