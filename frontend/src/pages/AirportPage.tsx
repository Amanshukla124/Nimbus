import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAirportBoard } from '../hooks/useAirportBoard';
import type { BoardFlight } from '../hooks/useAirportBoard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(raw: string | null | undefined): string {
  if (!raw || raw === '—') return '—';
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // Already HH:MM
    return raw.length > 5 ? raw.slice(11, 16) : raw;
  } catch {
    return raw;
  }
}

function StatusBadge({ status, delay }: { status: string; delay?: number | null }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    active:    { color: '#8ff5ff', bg: 'rgba(143,245,255,0.12)', label: 'In Air' },
    'en-route': { color: '#8ff5ff', bg: 'rgba(143,245,255,0.12)', label: 'En Route' },
    landed:    { color: '#97a9ff', bg: 'rgba(151,169,255,0.12)', label: 'Landed' },
    scheduled: { color: '#a9abb3', bg: 'rgba(169,171,179,0.08)', label: 'Scheduled' },
    delayed:   { color: '#ff6e84', bg: 'rgba(255,110,132,0.12)', label: delay ? `+${delay}m` : 'Delayed' },
    cancelled: { color: '#ff6e84', bg: 'rgba(255,110,132,0.12)', label: 'Cancelled' },
    unknown:   { color: '#73757d', bg: 'rgba(115,117,125,0.08)', label: 'Unknown' },
  };
  const s = cfg[status] ?? cfg.unknown;
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

// ─── Flight row ───────────────────────────────────────────────────────────────

const FlightRow = ({
  flight,
  direction,
  index,
}: {
  flight: BoardFlight;
  direction: 'arrivals' | 'departures';
  index: number;
}) => {
  const sched  = formatTime(flight.scheduled);
  const est    = formatTime(flight.estimated);
  const actual = formatTime(flight.actual ?? undefined);
  const showDelay = flight.delay_min && flight.delay_min > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-[rgba(151,169,255,0.04)] transition-glide group border border-transparent hover:border-[rgba(151,169,255,0.08)]"
    >
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-center">
        <div className="font-display font-bold text-[#ecedf6] text-lg leading-none">{sched}</div>
        {showDelay && (
          <div className="text-[#ff6e84] text-[10px] font-label mt-1">+{flight.delay_min}m</div>
        )}
        {actual && actual !== sched && !showDelay && (
          <div className="text-[#8ff5ff] text-[10px] font-label mt-1">{actual}</div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-[rgba(69,72,79,0.3)] flex-shrink-0" />

      {/* Flight info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display font-bold text-[#97a9ff] text-sm">{flight.flight_no}</span>
          <span className="text-[#73757d] text-xs truncate">{flight.airline}</span>
        </div>
        <div className="text-[#ecedf6] text-sm font-medium truncate">
          {direction === 'arrivals' ? 'From' : 'To'}{' '}
          <span className="text-[#ecedf6]">{flight.airport_city || flight.airport_iata}</span>
          {flight.airport_iata && flight.airport_iata !== '—' && (
            <span className="text-[#73757d] ml-1 text-xs">({flight.airport_iata})</span>
          )}
        </div>
      </div>

      {/* Gate */}
      <div className="text-center w-16 flex-shrink-0">
        <div className="text-[10px] font-label text-[#45484f] mb-0.5">Gate</div>
        <div className="font-display font-bold text-[#ecedf6] text-sm">{flight.gate}</div>
        {flight.terminal && flight.terminal !== '—' && (
          <div className="text-[10px] font-label text-[#73757d]">{flight.terminal}</div>
        )}
      </div>

      {/* Status */}
      <div className="w-24 flex-shrink-0 flex justify-end">
        <StatusBadge status={flight.status} delay={flight.delay_min} />
      </div>
    </motion.div>
  );
};

// ─── Main AirportPage ─────────────────────────────────────────────────────────

export const AirportPage = () => {
  const { iata } = useParams<{ iata: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'arrivals' | 'departures'>('arrivals');

  const { airport, arrivals, departures, source, loading, error, lastUpdated, refresh } =
    useAirportBoard(iata ?? '');

  const rows = tab === 'arrivals' ? arrivals : departures;

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto">

        {/* ── Back button ── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#73757d] hover:text-[#97a9ff] transition-glide mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-glide" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="font-label">Back to Map</span>
        </motion.button>

        {/* ── Airport header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          {loading && !airport ? (
            <div className="animate-pulse">
              <div className="h-8 bg-[#1c2028] rounded w-48 mb-2" />
              <div className="h-5 bg-[#161a21] rounded w-64" />
            </div>
          ) : airport ? (
            <>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display text-4xl font-bold text-[#97a9ff]">{airport.iata}</span>
                    {/* Live badge */}
                    <span
                      className="font-label text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5"
                      style={{
                        color: source === 'aviation_edge' || source === 'aviationstack' ? '#8ff5ff' : '#ff6e84',
                        background: source === 'aviation_edge' || source === 'aviationstack' ? 'rgba(143,245,255,0.1)' : 'rgba(255,110,132,0.1)',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: source === 'aviation_edge' || source === 'aviationstack' ? '#8ff5ff' : '#ff6e84' }}
                      />
                      {source === 'aviation_edge' ? 'LIVE · AV. EDGE'
                        : source === 'aviationstack' ? 'LIVE · AVSTACK'
                        : 'SIMULATED'}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-[#ecedf6]">{airport.name}</h1>
                  <p className="text-[#a9abb3] mt-1">{airport.city}</p>
                </div>

                {/* Refresh */}
                <div className="flex items-center gap-3">
                  {lastUpdated && (
                    <span className="font-label text-[#45484f] text-[10px]">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    id="airport-refresh-btn"
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(151,169,255,0.15)] text-[#97a9ff] hover:bg-[rgba(151,169,255,0.08)] transition-glide disabled:opacity-40 text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </>
          ) : error ? (
            <p className="text-[#ff6e84]">⚠ Failed to load airport: {error}</p>
          ) : null}
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6">
          {(['arrivals', 'departures'] as const).map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-glide ${
                tab === t
                  ? 'bg-gradient-to-r from-[#97a9ff] to-[#b884ff] text-[#001867]'
                  : 'text-[#a9abb3] border border-[rgba(69,72,79,0.2)] hover:border-[rgba(151,169,255,0.2)] hover:text-[#ecedf6]'
              }`}
            >
              {t === 'arrivals' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                </svg>
              )}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {!loading && (
                <span className={`text-xs font-label rounded-full px-1.5 py-0.5 ${
                  tab === t ? 'bg-[rgba(0,24,103,0.3)] text-[#001867]' : 'bg-[rgba(69,72,79,0.2)] text-[#73757d]'
                }`}>
                  {t === 'arrivals' ? arrivals.length : departures.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Column headers ── */}
        <div className="flex items-center gap-4 px-5 mb-2">
          <div className="w-16 font-label text-[#45484f]">Time</div>
          <div className="w-px" />
          <div className="flex-1 font-label text-[#45484f]">Flight · {tab === 'arrivals' ? 'Origin' : 'Destination'}</div>
          <div className="w-16 font-label text-[#45484f] text-center">Gate</div>
          <div className="w-24 font-label text-[#45484f] text-right">Status</div>
        </div>

        {/* ── Board ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(7,9,14,0.5)',
            border: '1px solid rgba(69,72,79,0.15)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#97a9ff] via-[#b884ff] to-[#8ff5ff]" />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="w-16 h-6 bg-[#1c2028] rounded" />
                    <div className="w-px h-10 bg-[#161a21]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#1c2028] rounded w-1/4" />
                      <div className="h-4 bg-[#161a21] rounded w-2/5" />
                    </div>
                    <div className="w-16 h-8 bg-[#1c2028] rounded" />
                    <div className="w-20 h-6 bg-[#1c2028] rounded-full" />
                  </div>
                ))}
              </motion.div>
            ) : error ? (
              <motion.div key="error" className="p-12 text-center">
                <p className="text-[#ff6e84] text-sm">⚠ {error}</p>
                <button onClick={refresh} className="mt-4 text-[#97a9ff] text-sm hover:underline">
                  Try again
                </button>
              </motion.div>
            ) : rows.length === 0 ? (
              <motion.div key="empty" className="p-12 text-center">
                <p className="text-[#73757d]">No {tab} data found for {iata}.</p>
              </motion.div>
            ) : (
              <motion.div key={tab}>
                <div className="divide-y divide-[rgba(69,72,79,0.08)]">
                  {rows.map((flight, i) => (
                    <FlightRow
                      key={`${flight.flight_no}-${i}`}
                      flight={flight}
                      direction={tab}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-6 mt-6 px-2">
          {[
            { color: '#8ff5ff', label: 'In Air' },
            { color: '#97a9ff', label: 'Landed' },
            { color: '#a9abb3', label: 'Scheduled' },
            { color: '#ff6e84', label: 'Delayed' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-label text-[#73757d]">{label}</span>
            </div>
          ))}
          <div className="ml-auto font-label text-[#45484f]">
            Auto-refreshes every 60s
          </div>
        </div>
      </main>
    </div>
  );
};
