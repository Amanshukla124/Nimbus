import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobeCanvas } from '../components/GlobeCanvas';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useFlights } from '../hooks/useFlights';
import type { LiveFlight } from '../types/flight';

// ─── Bearing helper ───────────────────────────────────────────────────────────
function bearingLabel(deg: number | null): string {
  if (deg == null) return '—';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return `${Math.round(deg)}° ${dirs[Math.round(deg / 22.5) % 16]}`;
}

const trafficInsights = [
  { color: '#ff6e84', label: 'Weather Alert', desc: 'Turbulence cluster over Atlantic' },
  { color: '#8ff5ff', label: 'Optimal Route',  desc: 'Jetstream favorability at FL380' },
];

// ─── Selected Flight Info Panel ───────────────────────────────────────────────
const FlightInfoPanel = ({
  flight,
  onClose,
}: {
  flight: LiveFlight;
  onClose: () => void;
}) => {
  const altitudeFt = flight.altitude != null ? Math.round(flight.altitude) : null;
  const speedKts   = flight.velocity  != null ? Math.round(flight.velocity)  : null;

  const vRateLabel =
    flight.vertical_rate == null ? '—'
    : flight.vertical_rate > 50  ? `+${Math.round(flight.vertical_rate)} fpm ↑`
    : flight.vertical_rate < -50 ? `${Math.round(flight.vertical_rate)} fpm ↓`
    : 'Level ━';

  const rows: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: 'Altitude',      value: altitudeFt != null ? `${altitudeFt.toLocaleString()} FT` : '—', accent: true },
    { label: 'Ground Speed',  value: speedKts   != null ? `${speedKts} KTS`   : '—' },
    { label: 'Heading',       value: bearingLabel(flight.heading) },
    { label: 'Vertical Rate', value: vRateLabel },
    { label: 'Country',       value: flight.origin_country || '—' },
    { label: 'ICAO',          value: flight.icao24.toUpperCase() },
  ];

  return (
    <motion.div
      key="flight-panel"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-24 left-1/2 z-30"
      style={{ transform: 'translateX(-50%)', width: 'min(640px, calc(100vw - 2rem))' }}
    >
      <div className="glass-panel border-ghost-primary rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 60px rgba(151,169,255,0.18), 0 0 0 1px rgba(151,169,255,0.12)' }}
      >
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#97a9ff] via-[#b884ff] to-[#8ff5ff]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Pulsing live dot */}
              <span className="relative flex w-2.5 h-2.5 flex-shrink-0">
                <span className="absolute inset-0 rounded-full bg-[#8ff5ff] opacity-60 animate-ping" />
                <span className="relative rounded-full w-2.5 h-2.5 bg-[#8ff5ff]" />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold text-[#ecedf6] tracking-tight leading-none">
                  {flight.callsign}
                </h3>
                <p className="font-label text-[#8ff5ff] mt-0.5">In-Air · Tracking Active</p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#73757d] hover:text-[#ecedf6] hover:bg-[rgba(34,38,47,0.6)] transition-glide flex-shrink-0"
              title="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Telemetry grid */}
          <div className="grid grid-cols-3 gap-3">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="bg-[rgba(22,26,33,0.7)] rounded-xl p-3"
                style={i === 0 ? { borderTop: '1px solid rgba(143,245,255,0.25)' } : { borderTop: '1px solid rgba(69,72,79,0.15)' }}
              >
                <span className="font-label text-[#73757d] block">{row.label}</span>
                <span className={`font-display font-bold mt-1 block text-base ${
                  row.accent ? 'text-[#8ff5ff]' : 'text-[#ecedf6]'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Arc hint */}
          <div className="mt-3 flex items-center gap-2 px-1">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(151,169,255,0.4), rgba(143,245,255,0.1))' }} />
            <span className="font-label text-[#45484f] text-[9px] whitespace-nowrap">
              PROJECTED HEADING ARC SHOWN ON GLOBE
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, rgba(151,169,255,0.4), rgba(143,245,255,0.1))' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const LiveMapPage = () => {
  const [altitude, setAltitude] = useState(35000);
  const [airline, setAirline] = useState('All Commercial Fleets');
  const [selectedFlight, setSelectedFlight] = useState<LiveFlight | null>(null);

  const { flights, count, source, loading, lastUpdated, refresh } = useFlights(80);

  // Pick the first airborne flight for the "active track" summary card
  const tracked = selectedFlight ?? flights.find(f => !f.on_ground) ?? flights[0];
  const trackedSpeed = tracked?.velocity != null ? `${Math.round(tracked.velocity)} KTS` : '— KTS';
  const trackedAlt   = tracked?.altitude  != null ? `${Math.round(tracked.altitude).toLocaleString()} FT` : '—';
  const trackedLabel = tracked?.callsign ?? 'Acquiring…';

  const handleFlightClick = (flight: LiveFlight) => {
    setSelectedFlight(prev => prev?.icao24 === flight.icao24 ? null : flight);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0e14] select-none">

      {/* ── Globe / Map Canvas ── */}
      <div className="absolute inset-0">
        <div className="w-full h-full relative">
          {/* Globe — interactive, fills the viewport */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ filter: 'drop-shadow(0 0 80px rgba(151,169,255,0.12))' }}
          >
            <GlobeCanvas
              size={Math.max(window.innerWidth, window.innerHeight) * 1.05}
              flights={flights}
              interactive={true}
              onFlightClick={handleFlightClick}
              selectedFlightIcao={selectedFlight?.icao24 ?? null}
              rotateSpeed={0.4}
            />
          </div>

          {/* Subtle vignette around edges */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(11,14,20,0.7) 100%)' }}
          />

          {/* Radar rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[700, 450, 250].map((s) => (
              <div
                key={s}
                className="absolute rounded-full"
                style={{ width: s, height: s, border: '1px solid rgba(151,169,255,0.05)' }}
              />
            ))}
            {/* Radar sweep */}
            <div className="absolute w-[700px] h-[700px] rounded-full opacity-5" style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(151,169,255,0.2) 90deg, transparent 360deg)',
              animation: 'spin 8s linear infinite',
            }} />
          </div>
        </div>
      </div>

      {/* ── LEFT SIDEBAR: Filters + Active Flight ── */}
      <motion.aside
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22,1,0.36,1], delay: 0.2 }}
        className="absolute left-6 top-24 bottom-28 w-72 flex flex-col gap-4 z-10 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Filters */}
        <div className="glass-panel border-ghost rounded-xl p-5 flex flex-col gap-4">
          <div>
            <span className="font-label text-[#73757d] block mb-1">Navigation Filters</span>
            <h2 className="font-display text-lg font-bold text-[#ecedf6]">Atmospheric Intel</h2>
          </div>

          {/* Hint */}
          <div className="flex items-center gap-2 bg-[rgba(151,169,255,0.06)] rounded-lg px-3 py-2 border border-[rgba(151,169,255,0.12)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#97a9ff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
            </svg>
            <span className="font-label text-[#a9abb3] normal-case tracking-normal text-[10px]">
              Click any flight dot on the globe to track
            </span>
          </div>

          {/* Airline select */}
          <div className="flex flex-col gap-2">
            <label className="font-label text-[#a9abb3]">Airline Carrier</label>
            <select
              value={airline}
              onChange={e => setAirline(e.target.value)}
              className="w-full bg-[#10131a] border-none rounded-lg py-2.5 px-3 text-sm text-[#ecedf6] appearance-none focus:ring-1 focus:ring-[rgba(151,169,255,0.4)] outline-none"
            >
              <option>All Commercial Fleets</option>
              <option>Nimbus Core</option>
              <option>Stratosphere Express</option>
            </select>
          </div>

          {/* Altitude range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="font-label text-[#a9abb3]">Altitude</label>
              <span className="text-xs font-mono text-[#8ff5ff]">{altitude.toLocaleString()} FT</span>
            </div>
            <input
              type="range" min={0} max={45000} value={altitude}
              onChange={e => setAltitude(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#97a9ff] bg-[#1c2028]"
            />
          </div>

          <button className="py-2 border border-ghost rounded-lg text-sm font-medium text-[#97a9ff] hover:border-[rgba(151,169,255,0.4)] transition-glide bg-[rgba(40,44,54,0.3)]">
            Apply Overlays
          </button>
        </div>

        {/* Active flight card */}
        <div className="glass-panel border-ghost rounded-xl p-5 relative overflow-hidden flex-1">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#97a9ff] shadow-[0_0_10px_rgba(151,169,255,0.6)]" />

          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-[#8ff5ff] opacity-75 animate-ping" />
                  <span className="relative rounded-full w-2 h-2 bg-[#8ff5ff]" />
                </span>
                <span className="font-label text-[#8ff5ff]">
                  {selectedFlight ? 'Flight Selected' : 'Tracking Active'}
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-[#ecedf6]">
                {loading ? 'Acquiring…' : trackedLabel}
              </h3>
            </div>
            {selectedFlight && (
              <button
                onClick={() => setSelectedFlight(null)}
                className="text-[#73757d] hover:text-[#ff6e84] transition-glide text-xs font-label"
                title="Clear selection"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 py-3" style={{ borderTop:'1px solid rgba(69,72,79,0.15)', borderBottom:'1px solid rgba(69,72,79,0.15)' }}>
            <div className="flex-1">
              <span className="font-label text-[#73757d]">Country</span>
              <div className="font-display font-bold text-[#ecedf6] text-sm mt-0.5">
                {tracked?.origin_country?.slice(0,3).toUpperCase() ?? '—'}
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#45484f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <div className="flex-1 text-right">
              <span className="font-label text-[#73757d]">Heading</span>
              <div className="font-display font-bold text-[#ecedf6] text-sm mt-0.5">
                {tracked?.heading != null ? `${Math.round(tracked.heading)}°` : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <div className="font-label text-[#73757d]">Speed</div>
              <div className="text-sm font-medium text-[#ecedf6] mt-0.5">{trackedSpeed}</div>
            </div>
            <div className="text-right">
              <div className="font-label text-[#73757d]">Altitude</div>
              <div className="text-sm font-medium text-[#ecedf6] mt-0.5">{trackedAlt}</div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── RIGHT SIDEBAR: Data Intelligence ── */}
      <motion.aside
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22,1,0.36,1], delay: 0.3 }}
        className="absolute right-6 top-24 bottom-28 w-72 flex flex-col gap-4 z-10 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Active Arcs stat */}
        <div className="glass-panel border-ghost rounded-xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label text-[#45484f]">Active Arcs</span>
            <div className="flex items-center gap-2">
              <span className={`font-label text-[10px] px-2 py-0.5 rounded-full ${
                source === 'opensky'
                  ? 'bg-[rgba(143,245,255,0.12)] text-[#8ff5ff]'
                  : 'bg-[rgba(255,110,132,0.12)] text-[#ff6e84]'
              }`}>
                {source === 'opensky' ? '● LIVE' : '● SIM'}
              </span>
              <button onClick={refresh} title="Refresh" className="text-[#45484f] hover:text-[#8ff5ff] transition-glide">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-[#ecedf6]">
            {loading ? '—' : <AnimatedCounter target={count} duration={1000} />}
          </div>
          {lastUpdated && (
            <p className="font-label text-[#45484f] normal-case tracking-normal text-[9px] mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <div className="mt-3 h-1 w-full bg-[#10131a] rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#00deec] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: count > 0 ? `${Math.min((count / 10000) * 100, 100)}%` : '0%' }}
              transition={{ duration: 1.2, delay: 0.5, ease:[0.22,1,0.36,1] }} />
          </div>
        </div>

        {/* Flight Density gauge */}
        <div className="glass-panel border-ghost rounded-xl p-5 flex flex-col items-center">
          <span className="font-label text-[#45484f] w-full mb-4">Flight Density</span>
          <div className="relative w-36 h-20 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#161a21" strokeLinecap="round" strokeWidth="8" />
              <path d="M 10 50 A 40 40 0 0 1 70 20" fill="none" stroke="url(#gaugeG)" strokeLinecap="round" strokeWidth="8" />
              <defs>
                <linearGradient id="gaugeG" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#97a9ff" />
                  <stop offset="100%" stopColor="#8ff5ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 text-xl font-display font-bold text-[#ecedf6]">92.4</div>
          </div>
          <span className="font-label text-[#8ff5ff] mt-2 text-center">Critical Capacity Near NYC</span>
        </div>

        {/* Traffic insights */}
        <div className="glass-panel border-ghost rounded-xl p-5 flex-1">
          <span className="font-label text-[#45484f] block mb-4">Traffic Insights</span>
          <div className="flex flex-col gap-4">
            {trafficInsights.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <div>
                  <div className="text-xs font-medium text-[#ecedf6]">{item.label}</div>
                  <div className="font-label text-[#73757d] mt-0.5 normal-case tracking-normal text-[10px]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coordinate card */}
        <div className="glass-panel border-ghost rounded-xl p-4">
          <span className="font-label text-[#45484f] block mb-2">
            {selectedFlight ? selectedFlight.callsign : 'ATLANTIC_QUAD_4'}
          </span>
          <div className="bg-[rgba(11,14,20,0.7)] p-2 rounded border-ghost">
            <div className="flex justify-between text-[10px] font-mono text-[#a9abb3]">
              <span>LAT: {selectedFlight?.latitude?.toFixed(4) ?? '40.7128'}</span>
              <span>LON: {selectedFlight?.longitude?.toFixed(4) ?? '74.0060'}</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Selected Flight Info Panel (bottom centre) ── */}
      <AnimatePresence>
        {selectedFlight && (
          <FlightInfoPanel
            flight={selectedFlight}
            onClose={() => setSelectedFlight(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom Map Controls ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease:[0.22,1,0.36,1] }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 glass-panel bg-[rgba(16,19,26,0.85)] border-ghost p-2 rounded-full"
      >
        {[
          { icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          ), label: 'Zoom In' },
          { icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
          ), label: 'Zoom Out' },
          { icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          ), label: 'Reset View' },
        ].map((btn, i) => (
          <Fragment key={btn.label}>
            {i > 0 && <div className="h-5 w-px bg-[rgba(34,38,47,0.6)]" />}
            <button
              title={btn.label}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#22262f] transition-glide"
            >
              {btn.icon}
            </button>
          </Fragment>
        ))}
        <div className="h-5 w-px bg-[rgba(34,38,47,0.6)]" />
        <div className="px-3 font-label text-[#45484f] text-[10px] whitespace-nowrap">DRAG TO ROTATE · SCROLL TO ZOOM</div>
      </motion.div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};
