import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobeCanvas } from '../components/GlobeCanvas';
import { useFlights } from '../hooks/useFlights';
import { useFlightByNumber } from '../hooks/useFlightByNumber';
import type { FlightByNumber } from '../hooks/useFlightByNumber';
import type { LiveFlight } from '../types/flight';

// Extended type to include from/to fields returned by /api/flights/india
type IndiaFlight = LiveFlight & {
  from_iata?: string;
  to_iata?: string;
  airline?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'active' || s === 'in-air') return '#8ff5ff';
  if (s === 'delayed') return '#ff6e84';
  if (s === 'landed') return '#97a9ff';
  if (s === 'cancelled') return '#ff6e84';
  return '#a9abb3';
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    active: 'In Air',
    scheduled: 'Scheduled',
    landed: 'Landed',
    delayed: 'Delayed',
    cancelled: 'Cancelled',
    'in-air': 'In Air',
    unknown: 'Unknown',
  };
  return map[s] ?? s.replace(/-/g, ' ');
}

function formatTime(iso: string) {
  if (!iso || iso === '—') return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso; // already HH:MM format
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
  } catch {
    return iso;
  }
}

function speedKts(kph: number | null) {
  if (kph == null) return '—';
  return `${Math.round(kph * 0.539957)} KTS`;
}

// ─── Airport dots data (top 30 for globe) ────────────────────────────────────
const AIRPORT_DOTS = [
  { iata: 'ATL', lat: 33.6407,  lon: -84.4277 },
  { iata: 'DFW', lat: 32.8998,  lon: -97.0403 },
  { iata: 'LAX', lat: 33.9425,  lon: -118.4081 },
  { iata: 'JFK', lat: 40.6413,  lon: -73.7781 },
  { iata: 'ORD', lat: 41.9742,  lon: -87.9073 },
  { iata: 'LHR', lat: 51.4700,  lon: -0.4543 },
  { iata: 'CDG', lat: 49.0097,  lon: 2.5478 },
  { iata: 'AMS', lat: 52.3105,  lon: 4.7683 },
  { iata: 'FRA', lat: 50.0379,  lon: 8.5622 },
  { iata: 'IST', lat: 41.2753,  lon: 28.7519 },
  { iata: 'DXB', lat: 25.2532,  lon: 55.3657 },
  { iata: 'DOH', lat: 25.2609,  lon: 51.6138 },
  { iata: 'BOM', lat: 19.0896,  lon: 72.8656 },
  { iata: 'DEL', lat: 28.5562,  lon: 77.1000 },
  { iata: 'HND', lat: 35.5494,  lon: 139.7798 },
  { iata: 'PEK', lat: 40.0801,  lon: 116.5846 },
  { iata: 'PVG', lat: 31.1443,  lon: 121.8083 },
  { iata: 'HKG', lat: 22.3080,  lon: 113.9185 },
  { iata: 'SIN', lat: 1.3644,   lon: 103.9915 },
  { iata: 'ICN', lat: 37.4602,  lon: 126.4407 },
  { iata: 'SYD', lat: -33.9399, lon: 151.1753 },
  { iata: 'YYZ', lat: 43.6777,  lon: -79.6248 },
  { iata: 'GRU', lat: -23.4356, lon: -46.4731 },
  { iata: 'MEX', lat: 19.4363,  lon: -99.0721 },
  { iata: 'JNB', lat: -26.1392, lon: 28.2460 },
  { iata: 'CAI', lat: 30.1219,  lon: 31.4056 },
  { iata: 'SFO', lat: 37.6213,  lon: -122.3790 },
  { iata: 'MIA', lat: 25.7959,  lon: -80.2870 },
  { iata: 'MAD', lat: 40.4936,  lon: -3.5668 },
  { iata: 'KUL', lat: 2.7456,   lon: 101.7072 },
];

// ─── Flight Result Panel ─────────────────────────────────────────────────────

const FlightPanel = ({
  flight,
  onClose,
}: {
  flight: FlightByNumber;
  onClose: () => void;
}) => {
  const live = flight.live;
  const altFt = live.altitude != null ? Math.round(live.altitude).toLocaleString() : '—';
  const speed = speedKts(live.speed_kph);
  const heading = live.heading != null ? `${Math.round(live.heading)}°` : '—';
  const lat = live.latitude != null ? live.latitude.toFixed(4) : '—';
  const lon = live.longitude != null ? live.longitude.toFixed(4) : '—';
  const sColor = statusColor(flight.status);

  return (
    <motion.div
      key="flight-panel"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-6 left-1/2 z-30"
      style={{ transform: 'translateX(-50%)', width: 'min(700px, calc(100vw - 2rem))' }}
    >
      <div
        className="glass-panel border-ghost-primary rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 60px rgba(151,169,255,0.2), 0 0 0 1px rgba(151,169,255,0.12)' }}
      >
        {/* Top accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#97a9ff] via-[#b884ff] to-[#8ff5ff]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex w-2.5 h-2.5 flex-shrink-0">
                <span className="absolute inset-0 rounded-full opacity-60 animate-ping" style={{ background: sColor }} />
                <span className="relative rounded-full w-2.5 h-2.5" style={{ background: sColor }} />
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl font-bold text-[#ecedf6] tracking-tight leading-none">
                    {flight.flight_no}
                  </h3>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: sColor, background: `${sColor}18`, border: `1px solid ${sColor}33` }}
                  >
                    {statusLabel(flight.status)}
                  </span>
                  {flight.source === 'simulated' && (
                    <span className="text-[10px] font-label px-2 py-0.5 rounded-full bg-[rgba(255,110,132,0.12)] text-[#ff6e84]">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="text-[#a9abb3] text-sm mt-1">{flight.airline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#73757d] hover:text-[#ecedf6] hover:bg-[rgba(34,38,47,0.6)] transition-glide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 mb-4 px-1">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-[#ecedf6]">{flight.origin.iata}</div>
              <div className="text-[#a9abb3] text-xs mt-1">{formatTime(flight.origin.scheduled)}</div>
              {flight.origin.gate !== '—' && (
                <div className="text-[#73757d] text-[10px] font-label mt-1">Gate {flight.origin.gate}</div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center w-full gap-2">
                <div className="flex-1 h-px bg-gradient-to-r from-[rgba(151,169,255,0.2)] to-[rgba(151,169,255,0.5)]" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
                <div className="flex-1 h-px bg-gradient-to-r from-[rgba(151,169,255,0.5)] to-[rgba(143,245,255,0.2)]" />
              </div>
              <span className="text-[10px] font-label text-[#45484f]">NONSTOP</span>
            </div>

            <div className="text-center">
              <div className="font-display text-3xl font-bold text-[#ecedf6]">{flight.destination.iata}</div>
              <div className="text-[#a9abb3] text-xs mt-1">
                ETA {formatTime(flight.destination.estimated)}
              </div>
              {flight.origin.delay ? (
                <div className="text-[#ff6e84] text-[10px] font-label mt-1">+{flight.origin.delay}m delay</div>
              ) : flight.destination.gate !== '—' ? (
                <div className="text-[#73757d] text-[10px] font-label mt-1">Gate {flight.destination.gate}</div>
              ) : null}
            </div>
          </div>

          {/* Telemetry grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Altitude', value: `${altFt} FT`, accent: true },
              { label: 'Speed', value: speed },
              { label: 'Heading', value: heading },
              { label: 'Position', value: `${lat}, ${lon}` },
            ].map((row) => (
              <div
                key={row.label}
                className="bg-[rgba(22,26,33,0.7)] rounded-xl p-3"
                style={{ borderTop: `1px solid ${row.accent ? 'rgba(143,245,255,0.25)' : 'rgba(69,72,79,0.15)'}` }}
              >
                <span className="font-label text-[#73757d] block">{row.label}</span>
                <span className={`font-display font-bold mt-1 block text-sm ${row.accent ? 'text-[#8ff5ff]' : 'text-[#ecedf6]'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main TrackPage ───────────────────────────────────────────────────────────

export const TrackPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedGlobeFlight, setSelectedGlobeFlight] = useState<LiveFlight | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { flights, count, source: liveSource, loading: liveLoading, lastUpdated, refresh } = useFlights(80, 'india');
  const { flight, loading: searchLoading, error: searchError, notFound, lookup, clear } = useFlightByNumber();

  const handleSearch = () => {
    if (query.trim()) {
      lookup(query);
      setSelectedGlobeFlight(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleGlobeFlightClick = (f: LiveFlight) => {
    setSelectedGlobeFlight(prev => prev?.icao24 === f.icao24 ? null : f);
    clear();
  };

  const closePanels = () => {
    clear();
    setSelectedGlobeFlight(null);
  };

  // When searching, highlight the flight on the globe if we have live coords
  const highlightLat = flight?.live.latitude ?? selectedGlobeFlight?.latitude ?? null;
  const highlightLon = flight?.live.longitude ?? selectedGlobeFlight?.longitude ?? null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0e14] select-none">

      {/* ── Globe ── */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ filter: 'drop-shadow(0 0 80px rgba(151,169,255,0.12))' }}
        >
          <GlobeCanvas
            size={Math.max(window.innerWidth, window.innerHeight) * 1.05}
            flights={flights}
            interactive={true}
            onFlightClick={handleGlobeFlightClick}
            selectedFlightIcao={selectedGlobeFlight?.icao24 ?? null}
            rotateSpeed={0.3}
          />
        </div>
        {/* Edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(11,14,20,0.75) 100%)' }}
        />
      </div>

      {/* ── Top Search Bar ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="absolute top-20 left-1/2 z-20"
        style={{ transform: 'translateX(-50%)', width: 'min(560px, calc(100vw - 2rem))' }}
      >
        <div
          className="glass-panel rounded-2xl p-2 flex items-center gap-2"
          style={{
            border: '1px solid rgba(151,169,255,0.18)',
            boxShadow: '0 4px 40px rgba(151,169,255,0.1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff] ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
          <input
            ref={inputRef}
            id="flight-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter flight number — e.g. AA204, BA117, 6E302…"
            className="flex-1 bg-transparent text-[#ecedf6] placeholder:text-[#45484f] outline-none text-sm py-2"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); clear(); }}
              className="p-1.5 rounded-lg text-[#73757d] hover:text-[#ecedf6] transition-glide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            id="track-flight-btn"
            onClick={handleSearch}
            disabled={searchLoading || !query.trim()}
            className="px-5 py-2 rounded-xl font-display font-bold text-sm text-[#001867] bg-gradient-to-r from-[#97a9ff] to-[#b884ff] disabled:opacity-40 transition-glide hover:scale-105 active:scale-95 flex-shrink-0"
          >
            {searchLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Tracking…
              </span>
            ) : 'Track'}
          </button>
        </div>

        {/* Error / not found messages */}
        <AnimatePresence>
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 mx-2 px-4 py-2 rounded-xl text-sm text-[#ff6e84] bg-[rgba(255,110,132,0.1)] border border-[rgba(255,110,132,0.2)]"
            >
              No flight found for <strong>{query.toUpperCase()}</strong> — try a different flight number.
            </motion.div>
          )}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 mx-2 px-4 py-2 rounded-xl text-sm text-[#ff6e84] bg-[rgba(255,110,132,0.1)] border border-[rgba(255,110,132,0.2)]"
            >
              ⚠ {searchError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Airport Quick-Access Panel (left side) ── */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="absolute left-5 top-1/2 z-10 -translate-y-1/2"
      >
        <div
          className="glass-panel rounded-2xl p-4"
          style={{ border: '1px solid rgba(69,72,79,0.2)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
        >
          <p className="font-label text-[#73757d] mb-3">Click Airport</p>
          <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { iata: 'DEL', city: 'New Delhi' },
              { iata: 'BOM', city: 'Mumbai' },
              { iata: 'BLR', city: 'Bengaluru' },
              { iata: 'MAA', city: 'Chennai' },
              { iata: 'HYD', city: 'Hyderabad' },
              { iata: 'CCU', city: 'Kolkata' },
              { iata: 'COK', city: 'Kochi' },
              { iata: 'GOI', city: 'Goa' },
              { iata: 'AMD', city: 'Ahmedabad' },
              { iata: 'PNQ', city: 'Pune' },
              { iata: 'JAI', city: 'Jaipur' },
              { iata: 'GAU', city: 'Guwahati' },
            ].map(apt => (
              <button
                key={apt.iata}
                id={`airport-btn-${apt.iata}`}
                onClick={() => navigate(`/airport/${apt.iata}`)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[rgba(151,169,255,0.08)] text-left transition-glide group"
              >
                <span className="font-display font-bold text-[#97a9ff] text-sm w-10 flex-shrink-0">{apt.iata}</span>
                <span className="text-[#a9abb3] text-xs group-hover:text-[#ecedf6] transition-glide">{apt.city}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#45484f] ml-auto opacity-0 group-hover:opacity-100 transition-glide" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Live Stats (top-right) ── */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="absolute right-5 top-20 z-10"
      >
        <div
          className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-4"
          style={{ border: '1px solid rgba(69,72,79,0.2)' }}
        >
          <div>
            <p className="font-label text-[#45484f]">India Airspace</p>
            <p className="font-display font-bold text-[#ecedf6] text-xl mt-0.5">
              {liveLoading ? '—' : count.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-px bg-[rgba(69,72,79,0.2)]" />
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: liveSource === 'opensky' || liveSource === 'aviation_edge' ? '#8ff5ff' : '#ff6e84',
                boxShadow: liveSource === 'opensky' || liveSource === 'aviation_edge' ? '0 0 8px rgba(143,245,255,0.6)' : 'none',
              }}
            />
            <span className="font-label text-[10px]" style={{ color: liveSource === 'opensky' || liveSource === 'aviation_edge' ? '#8ff5ff' : '#ff6e84' }}>
              {liveSource === 'aviation_edge' ? 'AV.EDGE LIVE'
                : liveSource === 'opensky' ? 'OPENSKY LIVE'
                : 'SIMULATED'}
            </span>
          </div>
          <button onClick={refresh} className="text-[#45484f] hover:text-[#8ff5ff] transition-glide" title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
        {lastUpdated && (
          <p className="font-label text-[#45484f] text-[9px] text-right mt-1 mr-1">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {/* ── Helper hint (bottom-center, only when nothing selected) ── */}
      {!flight && !selectedGlobeFlight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        >
          <p className="font-label text-[#45484f] text-center">
            DRAG TO ROTATE · SCROLL TO ZOOM · CLICK AIRCRAFT TO TRACK
          </p>
        </motion.div>
      )}

      {/* ── Globe-click flight info (mini panel) ── */}
      <AnimatePresence>
        {selectedGlobeFlight && !flight && (
          <motion.div
            key="globe-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-1/2 z-30"
            style={{ transform: 'translateX(-50%)', width: 'min(520px, calc(100vw - 2rem))' }}
          >
            <div
              className="glass-panel border-ghost-primary rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 60px rgba(151,169,255,0.15)' }}
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-[#97a9ff] via-[#b884ff] to-[#8ff5ff]" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-[#8ff5ff] opacity-60 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-[#8ff5ff]" />
                    </span>
                    <span className="font-display font-bold text-[#ecedf6]">{selectedGlobeFlight.callsign}</span>
                    <span className="font-label text-[#8ff5ff] text-[10px]">IN-AIR</span>
                  </div>
                  <button onClick={closePanels} className="text-[#73757d] hover:text-[#ecedf6] transition-glide">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Route if available */}
                {((selectedGlobeFlight as IndiaFlight).from_iata || (selectedGlobeFlight as IndiaFlight).to_iata) && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-display font-bold text-[#ecedf6] text-2xl">{(selectedGlobeFlight as IndiaFlight).from_iata || '—'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                    <span className="font-display font-bold text-[#ecedf6] text-2xl">{(selectedGlobeFlight as IndiaFlight).to_iata || '—'}</span>
                    {(selectedGlobeFlight as IndiaFlight).airline && (
                      <span className="text-[#a9abb3] text-xs ml-1">{(selectedGlobeFlight as IndiaFlight).airline}</span>
                    )}
                  </div>
                )}
              <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Altitude', value: selectedGlobeFlight.altitude != null ? `${Math.round(selectedGlobeFlight.altitude).toLocaleString()} FT` : '—', accent: true },
                    { label: 'Speed', value: selectedGlobeFlight.velocity != null ? `${Math.round(selectedGlobeFlight.velocity)} KTS` : '—' },
                    { label: 'Heading', value: selectedGlobeFlight.heading != null ? `${Math.round(selectedGlobeFlight.heading)}°` : '—' },
                    { label: 'Country', value: (selectedGlobeFlight as IndiaFlight).airline || selectedGlobeFlight.origin_country || '—' },
                  ].map(row => (
                    <div key={row.label} className="bg-[rgba(22,26,33,0.7)] rounded-xl p-3" style={{ borderTop: `1px solid ${(row as any).accent ? 'rgba(143,245,255,0.25)' : 'rgba(69,72,79,0.15)'}` }}>
                      <span className="font-label text-[#73757d] block">{row.label}</span>
                      <span className={`font-display font-bold mt-1 block text-sm ${(row as any).accent ? 'text-[#8ff5ff]' : 'text-[#ecedf6]'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search Result Flight Panel ── */}
      <AnimatePresence>
        {flight && (
          <FlightPanel key="search-panel" flight={flight} onClose={closePanels} />
        )}
      </AnimatePresence>
    </div>
  );
};
