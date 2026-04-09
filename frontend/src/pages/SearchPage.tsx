import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { useFlightSearch } from '../hooks/useFlightSearch';
import type { SearchFlight, FlightStatus } from '../types/flight';

const StatusBadge = ({ status, delay }: { status: FlightStatus; delay?: string }) =>
  status === 'on-time' ? (
    <span className="font-label status-on-time">On Time</span>
  ) : status === 'in-air' ? (
    <span className="font-label" style={{ color: '#8ff5ff', background: 'rgba(143,245,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>In Air</span>
  ) : (
    <span className="font-label status-delayed">Delayed {delay}</span>
  );

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22,1,0.36,1] as any },
  }),
};

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'eta'|'status'>('eta');
  const navigate = useNavigate();
  const { flights, total, loading, error, search } = useFlightSearch('', 'eta');

  const handleQueryChange = (val: string) => {
    setQuery(val);
    search(val, sortBy);
  };

  const handleSort = (s: 'eta' | 'status') => {
    setSortBy(s);
    search(query, s);
  };

  // Show first flight as 'active radar' or a placeholder
  const activeRadar = flights[0] as SearchFlight | undefined;

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">

        {/* ── Hero Search ── */}
        <section className="relative py-16 mb-12 text-center">
          {/* Subtle bg bloom */}
          <div className="absolute inset-0 -z-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(151,169,255,0.06) 0%, transparent 70%)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-[#ecedf6]">
              Atmospheric{' '}
              <span className="bg-gradient-to-r from-[#97a9ff] to-[#b884ff] bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="text-[#a9abb3] text-lg max-w-xl mx-auto">
              Global flight surveillance and route optimization powered by real-time telemetry.
            </p>

            {/* Search bar */}
            <div className="glass-panel p-2 rounded-xl border-ghost shadow-2xl">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97a9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    className="w-full bg-[rgba(7,9,14,0.4)] border-none rounded-lg pl-12 py-5 text-[#ecedf6] placeholder:text-[#73757d] text-lg font-light focus:outline-none focus:ring-1 focus:ring-[rgba(151,169,255,0.4)]"
                    placeholder="Flight # (e.g. AA204) or Route (JFK-LHR)"
                    value={query}
                    onChange={e => handleQueryChange(e.target.value)}
                  />
                </div>
                <button className="btn-glow-hover bg-gradient-to-r from-[#97a9ff] to-[#b884ff] px-8 py-5 rounded-lg font-bold font-display text-[#001867] flex items-center justify-center gap-2">
                  Analyze Trajectory
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Results Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Active tracking */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#10131a] rounded-xl p-6" style={{ borderTop: '1px solid rgba(151,169,255,0.2)' }}>
              <h3 className="font-label text-[#97a9ff] mb-6">Current Radar Focus</h3>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-3xl font-display font-bold text-[#ecedf6]">
                    {loading ? '—' : (activeRadar?.flightNo ?? 'NIM-482')}
                  </p>
                  <p className="text-[#a9abb3] text-sm font-label mt-1 normal-case tracking-normal">
                    {activeRadar?.airline ?? 'Stratospheric Courier'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                  style={{ border: '2px solid rgba(143,245,255,0.2)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#8ff5ff]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                  {/* Conic glow ring */}
                  <div className="absolute inset-0 rounded-full opacity-20 blur-sm"
                    style={{ background: 'conic-gradient(from 0deg, #97a9ff, #b884ff, #8ff5ff, #97a9ff)' }}
                  />
                </div>
              </div>

              <div className="space-y-0">
                {[
                  { label: 'Altitude',     value: activeRadar?.altitude != null ? `${activeRadar.altitude.toLocaleString()} FT` : '38,000 FT', color: 'status-on-time' },
                  { label: 'Ground Speed', value: activeRadar?.groundSpeed != null ? `${activeRadar.groundSpeed} KTS` : '542 KTS', color: 'text-[#ecedf6]' },
                  { label: 'ETA (Dest)',   value: activeRadar?.eta ?? '06:42 UTC', color: 'text-[#ecedf6]' },
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex justify-between items-center py-3"
                    style={ i < arr.length - 1 ? { borderBottom:'1px solid rgba(69,72,79,0.15)' } : {} }
                  >
                    <span className="text-sm text-[#a9abb3]">{row.label}</span>
                    <span className={`font-display font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather card */}
            <div className="bg-[#10131a] rounded-xl p-6 overflow-hidden relative group" style={{ minHeight: 140 }}>
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-glide"
                style={{ background: 'linear-gradient(135deg, rgba(184,132,255,0.3) 0%, transparent 60%)' }}
              />
              <div className="relative z-10">
                <h3 className="font-label text-[#b884ff] mb-2">Weather Intelligence</h3>
                <p className="text-[#ecedf6] text-xl font-display leading-tight">North Atlantic Jet Stream Intensifying</p>
                <button className="mt-4 text-[#b884ff] text-sm font-bold flex items-center gap-1 group/btn">
                  View Wind Map
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover/btn:translate-x-1 transition-glide" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results feed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-display text-2xl font-bold text-[#ecedf6]">
                Search Results{' '}
                <span className="text-[#a9abb3] text-lg font-light ml-2">
                  {loading ? 'Loading…' : `(${total} Matches)`}
                </span>
              </h2>
              <div className="flex gap-2">
                {(['eta','status'] as const).map(s => (
                  <button key={s}
                    onClick={() => handleSort(s)}
                    className={`px-4 py-2 rounded font-label text-xs transition-glide ${
                      sortBy === s
                        ? 'bg-[#97a9ff] text-[#001867]'
                        : 'bg-[#1c2028] text-[#a9abb3] hover:bg-[#282c36]'
                    }`}
                  >
                    Sort by {s === 'eta' ? 'ETA' : 'Status'}
                  </button>
                ))}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="text-[#ff6e84] text-sm font-label mb-4 px-1">
                ⚠ API unavailable — showing cached data
              </div>
            )}

            {loading ? (
              // Skeleton loader
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#10131a] rounded-xl p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1c2028]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-[#1c2028] rounded w-1/3" />
                      <div className="h-4 bg-[#22262f] rounded w-1/5" />
                    </div>
                    <div className="h-6 bg-[#1c2028] rounded w-24" />
                  </div>
                </div>
              ))
            ) : flights.map((flight, i) => (
              <motion.div
                key={flight.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                onClick={() => navigate(`/flight/${flight.id}`)}
                className="bg-[#10131a] hover:bg-[#1c2028] rounded-xl p-1 cursor-pointer transition-glide group"
              >
                <div className="rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Airline */}
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(34,38,47,0.6)] flex items-center justify-center border-ghost overflow-hidden flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#97a9ff]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-label text-[#a9abb3]">{flight.airline}</p>
                      <p className="font-display font-bold text-[#ecedf6]">{flight.flightNo}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex-1 flex items-center justify-between px-4">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-[#ecedf6]">{flight.origin}</p>
                      <p className="font-label text-[#a9abb3] mt-0.5 normal-case tracking-normal text-[10px]">{flight.depart}</p>
                    </div>
                    <div className="flex-1 px-6 flex flex-col items-center">
                      <div className="w-full relative flex items-center">
                        <div className="flex-1 h-px bg-[rgba(69,72,79,0.3)]" />
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#97a9ff] mx-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                        <div className="flex-1 h-px bg-[rgba(69,72,79,0.3)]" />
                      </div>
                      <span className="mt-2 font-label text-[#73757d] normal-case tracking-normal text-[10px]">
                        {flight.duration} · Nonstop
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-[#ecedf6]">{flight.dest}</p>
                      <p className="font-label text-[#a9abb3] mt-0.5 normal-case tracking-normal text-[10px]">{flight.arrive}</p>
                    </div>
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-5 md:pl-5"
                    style={{ borderLeft:'1px solid rgba(69,72,79,0.15)' }}
                  >
                    <div className="text-right min-w-[80px]">
                      <StatusBadge status={flight.status} delay={flight.delay} />
                      <p className="font-label text-[#a9abb3] mt-1 normal-case tracking-normal text-[10px]">Gate {flight.gate}</p>
                    </div>
                    <button className="bg-[#282c36] p-3 rounded-lg text-[#97a9ff] hover:bg-[#97a9ff] hover:text-[#001867] transition-glide flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}  {/* end flight list */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
