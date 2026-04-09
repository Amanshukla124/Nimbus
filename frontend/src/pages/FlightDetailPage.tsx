import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { HorizonGauge } from '../components/HorizonGauge';
import { useFlightDetail } from '../hooks/useFlightDetail';

// ─── Bearing label helper ─────────────────────────────────────────────────────
function bearingLabel(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return `${deg}° ${dirs[Math.round(deg / 22.5) % 16]}`;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonBlock = ({ h = 'h-6', w = 'w-2/3' }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} bg-[#1c2028] rounded animate-pulse`} />
);

export const FlightDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { flight, loading, error } = useFlightDetail(id);

  // Derived display values (safe defaults while loading)
  const departureDetails = flight
    ? [
        { label: 'Gate / Terminal',  value: `${flight.departureGate} / ${flight.departureTerminal}` },
        { label: 'Actual Departure', value: flight.actualDeparture },
      ]
    : [
        { label: 'Gate / Terminal',  value: '—' },
        { label: 'Actual Departure', value: '—' },
      ];

  const arrivalDetails = flight
    ? [
        { label: 'Gate / Terminal', value: `${flight.arrivalGate} / —`  },
        { label: 'Baggage Claim',   value: flight.baggageClaim },
      ]
    : [
        { label: 'Gate / Terminal', value: '—' },
        { label: 'Baggage Claim',   value: '—' },
      ];

  const telemetryRows = flight
    ? [
        { label: 'V-Speed',  value: flight.vSpeed,                      color: 'text-[#00deec]' },
        { label: 'Heading',  value: bearingLabel(flight.headingDeg),    color: 'text-[#ecedf6]' },
      ]
    : [
        { label: 'V-Speed',  value: '— fpm', color: 'text-[#00deec]' },
        { label: 'Heading',  value: '—',     color: 'text-[#ecedf6]' },
      ];

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <main className="min-h-screen pt-24 pb-12 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">

        {/* ── Left Column ── */}
        <section className="lg:col-span-7 flex flex-col gap-6">

          {/* Map header card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
            className="relative h-[400px] rounded-xl overflow-hidden border-ghost"
            style={{ boxShadow: '0 2px 40px rgba(62,101,255,0.08)' }}
          >
            {/* Background gradient as map placeholder */}
            <div className="w-full h-full" style={{
              background: 'radial-gradient(ellipse at 40% 60%, rgba(13,27,62,0.95) 0%, rgba(7,9,14,0.98) 80%)',
            }}>
              {/* City light grid pattern */}
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(151,169,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
              />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0b0e14 0%, transparent 60%)' }} />

            {/* HUD: Flight Number */}
            <div className="absolute top-6 left-6">
              <div className="glass-panel px-4 py-3 rounded-lg border-ghost">
                <p className="font-label text-[#97a9ff] mb-1">Flight Number</p>
                {loading
                  ? <SkeletonBlock h="h-7" w="w-28" />
                  : <p className="text-2xl font-display font-bold text-white tracking-tight">
                      {flight?.flightNo ?? id?.toUpperCase() ?? '—'}
                    </p>
                }
              </div>
            </div>

            {/* HUD: Status */}
            <div className="absolute bottom-6 right-6 text-right">
              <p className="font-label text-[#8ff5ff] mb-1">Status</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-[#8ff5ff]" style={{ boxShadow: '0 0 8px rgba(143,245,255,0.8)' }} />
                {loading
                  ? <SkeletonBlock h="h-5" w="w-20" />
                  : <span className="text-lg font-display font-medium text-[#8ff5ff]">
                      {(flight?.status ?? 'unknown').toUpperCase().replace('-', ' ')}
                    </span>
                }
              </div>
            </div>
          </motion.div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl bg-[rgba(255,110,132,0.07)] border border-[rgba(255,110,132,0.2)] px-5 py-3 text-[#ff6e84] text-sm font-label">
              ⚠ Could not load live data — displaying simulated flight data.
            </div>
          )}

          {/* Progress + Gauge bento */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22,1,0.36,1] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Route progress */}
            <div className="md:col-span-2 bg-[#10131a] rounded-xl p-8 relative overflow-hidden"
              style={{ borderTop: '1px solid rgba(151,169,255,0.2)' }}
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  {loading
                    ? <SkeletonBlock h="h-9" w="w-16" />
                    : <h3 className="font-display text-3xl font-bold tracking-tight text-white">{flight?.origin ?? '—'}</h3>
                  }
                  <p className="text-sm text-[#a9abb3] mt-1">{flight?.originName ?? (loading ? '' : 'Unknown Airport')}</p>
                </div>
                <div className="flex flex-col items-center flex-grow px-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff] mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                  <div className="w-full h-1 bg-[#22262f] rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-[#97a9ff] to-[#b884ff] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${flight?.progress ?? 0}%` }}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.22,1,0.36,1] }}
                    />
                  </div>
                  <p className="mt-2 font-label text-[#a9abb3] normal-case tracking-normal text-[10px]">
                    {loading ? '—' : `${flight?.progress ?? 0}% Traversed`}
                  </p>
                </div>
                <div className="text-right">
                  {loading
                    ? <SkeletonBlock h="h-9" w="w-16" />
                    : <h3 className="font-display text-3xl font-bold tracking-tight text-white">{flight?.dest ?? '—'}</h3>
                  }
                  <p className="text-sm text-[#a9abb3] mt-1">{flight?.destName ?? (loading ? '' : 'Unknown Airport')}</p>
                </div>
              </div>

              <div className="flex justify-between pt-6" style={{ borderTop: '1px solid rgba(69,72,79,0.1)' }}>
                <div>
                  <span className="font-label text-[#a9abb3] normal-case tracking-normal text-[10px]">Time Remaining</span>
                  <p className="text-xl font-display text-white font-medium mt-1">
                    {loading ? '—' : (flight?.timeRemaining ?? '—')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-label text-[#a9abb3] normal-case tracking-normal text-[10px]">Arrival Estimate</span>
                  <p className="text-xl font-display text-white font-medium mt-1">
                    {loading ? '—' : (flight?.arrive ?? '—')}
                  </p>
                </div>
              </div>
            </div>

            {/* Horizon Gauge */}
            <div className="bg-[#10131a] rounded-xl p-6 flex flex-col items-center justify-center border-ghost">
              {loading ? (
                <div className="w-32 h-32 rounded-full bg-[#1c2028] animate-pulse mb-4" />
              ) : (
                <HorizonGauge
                  value={flight ? Math.min(Math.max((flight.altitudeFt / 45000) * 100, 0), 100) : 0}
                  label={flight?.altitudeFt?.toLocaleString() ?? '—'}
                  unit="FT"
                  size={128}
                  rows={telemetryRows}
                />
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Right Column: Flight Intelligence ── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22,1,0.36,1] }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          {/* Flight Intel card */}
          <div className="bg-[#10131a] rounded-xl p-8 border-ghost">
            <h2 className="font-display text-xl font-bold text-white mb-8 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              Flight Intelligence
            </h2>

            <div className="space-y-8">
              {/* Departure timeline */}
              <div className="relative pl-6" style={{ borderLeft: '2px solid rgba(151,169,255,0.3)' }}>
                <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-[#97a9ff]"
                  style={{ boxShadow: '0 0 0 4px rgba(151,169,255,0.1)' }}
                />
                <p className="font-label text-[#97a9ff] mb-3">Departure Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {departureDetails.map(d => (
                    <div key={d.label}>
                      <p className="text-xs text-[#a9abb3] mb-1">{d.label}</p>
                      {loading
                        ? <SkeletonBlock h="h-6" />
                        : <p className="text-lg font-display font-medium text-white">{d.value}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrival timeline */}
              <div className="relative pl-6" style={{ borderLeft: '2px solid rgba(184,132,255,0.3)' }}>
                <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-[#b884ff]"
                  style={{ boxShadow: '0 0 0 4px rgba(184,132,255,0.1)' }}
                />
                <p className="font-label text-[#b884ff] mb-3">Arrival Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {arrivalDetails.map(d => (
                    <div key={d.label}>
                      <p className="text-xs text-[#a9abb3] mb-1">{d.label}</p>
                      {loading
                        ? <SkeletonBlock h="h-6" />
                        : <p className="text-lg font-display font-medium text-white">{d.value}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Aircraft */}
              <div className="pt-6" style={{ borderTop: '1px solid rgba(69,72,79,0.1)' }}>
                <p className="font-label text-[#a9abb3] mb-4 normal-case tracking-normal text-[10px]">Equipment &amp; Fleet</p>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-14 rounded-lg bg-[#1c2028] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#a9abb3]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </div>
                  <div>
                    {loading
                      ? <>
                          <SkeletonBlock h="h-5" w="w-48" />
                          <SkeletonBlock h="h-3" w="w-36 mt-2" />
                        </>
                      : <>
                          <p className="text-white font-display font-bold">{flight?.aircraft ?? '—'}</p>
                          <p className="text-sm text-[#a9abb3] mt-0.5">
                            Tail: {flight?.tailNumber ?? '—'} • {flight?.aircraftAge ?? '—'}
                          </p>
                        </>
                    }
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-10 py-4 bg-[#22262f] hover:bg-[#282c36] border-ghost rounded-lg transition-glide group flex items-center justify-center gap-2 text-sm font-medium text-white">
              Full Passenger Manifesto
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-glide" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Weather card */}
          <div className="bg-[#10131a] rounded-xl p-8 border-ghost overflow-hidden relative group">
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-glide">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-[#8ff5ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <p className="font-label text-[#8ff5ff] mb-4">Arrival Conditions</p>
            <div className="flex items-end gap-2 mb-4">
              {loading
                ? <SkeletonBlock h="h-12" w="w-24" />
                : <>
                    <span className="text-5xl font-display font-bold text-white tracking-tight">
                      {flight?.arrivalTempC != null ? `${flight.arrivalTempC}°` : '—'}
                    </span>
                    <span className="text-lg font-display font-medium text-[#a9abb3] mb-2">Celsius</span>
                  </>
              }
            </div>
            {loading
              ? <div className="space-y-2"><SkeletonBlock h="h-3" /><SkeletonBlock h="h-3" w="w-3/4" /></div>
              : <p className="text-sm text-[#a9abb3] leading-relaxed">
                  {flight?.weatherSummary ?? 'Weather data unavailable.'}
                </p>
            }
          </div>
        </motion.aside>
      </main>
      <Footer />
    </div>
  );
};
