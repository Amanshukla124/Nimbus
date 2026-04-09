import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as any },
  }),
};

const telemetryRows = [
  { label: 'Ion Density',      value: '1.45 mol/m³', color: 'text-[#00deec]' },
  { label: 'Thermal Gradient', value: '-54.2°C',      color: 'text-[#ecedf6]' },
  { label: 'Signal Stability', value: '0.002σ',       color: 'text-[#97a9ff]' },
];

export const BentoGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="container mx-auto px-8 py-32 space-y-12 relative z-10">
      {/* Section header */}
      <div className="max-w-2xl">
        <motion.h2
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-4xl font-display font-bold mb-4 text-[#ecedf6]"
        >
          Deep Network Analysis
        </motion.h2>
        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-[#a9abb3] leading-relaxed"
        >
          Integrated telemetry layers providing sub-orbital insights across 194 countries with real-time signal processing.
        </motion.p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ─── Large card: Planetary Signal Mapping ─── */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="md:col-span-2 glass-panel rounded-2xl p-10 relative overflow-hidden group border-ghost"
        >
          <div className="relative z-10 space-y-6">
            <div className="bg-[rgba(151,169,255,0.1)] w-12 h-12 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#97a9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-display font-bold text-[#ecedf6]">Planetary Signal Mapping</h3>
            <p className="text-[#a9abb3] max-w-sm">
              Observe every satellite handshake and atmospheric disturbance across our low-earth orbit network.
            </p>
            <button className="text-[#97a9ff] font-label flex items-center gap-2 group-hover:gap-4 transition-glide">
              Explore Map
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Background network map visual */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-glide">
            <div className="w-full h-full"
              style={{
                background: 'radial-gradient(ellipse at 80% 50%, rgba(151,169,255,0.4) 0%, transparent 60%), radial-gradient(ellipse at 60% 20%, rgba(143,245,255,0.2) 0%, transparent 50%)',
              }}
            />
            {/* Node dots */}
            {[
              { top: '20%',  left: '30%'  },
              { top: '50%',  left: '60%'  },
              { top: '70%',  left: '25%'  },
              { top: '35%',  left: '80%'  },
              { top: '80%',  left: '70%'  },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#97a9ff]"
                style={{ top: pos.top, left: pos.left, opacity: 0.6 + i * 0.08 }}
              />
            ))}
          </div>
        </motion.div>

        {/* ─── Feature cards column ─── */}
        <div className="flex flex-col gap-6">

          {/* Weather Synthesis */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="flex-1 bg-[#10131a] rounded-2xl p-8 border-ghost flex flex-col justify-between"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#8ff5ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
            </svg>
            <div className="mt-6">
              <h4 className="font-display text-xl font-bold mb-2 text-[#ecedf6]">Weather Synthesis</h4>
              <p className="text-sm text-[#a9abb3] leading-relaxed">
                Predictive modeling for stratospheric wind patterns and ionospheric interference.
              </p>
            </div>
          </motion.div>

          {/* Encrypted Telemetry */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="flex-1 bg-[#10131a] rounded-2xl p-8 border-ghost flex flex-col justify-between"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#b884ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <div className="mt-6">
              <h4 className="font-display text-xl font-bold mb-2 text-[#ecedf6]">Encrypted Telemetry</h4>
              <p className="text-sm text-[#a9abb3] leading-relaxed">
                Quantum-resistant data tunneling for sensitive aerospace communication channels.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ─── Telemetry data card ─── */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="md:col-span-2 glass-panel rounded-2xl p-10 border-ghost flex items-center gap-12 overflow-hidden"
        >
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-display font-bold text-[#ecedf6]">Real-time Telemetry</h3>
            <div className="space-y-3">
              {telemetryRows.map((row) => (
                <div key={row.label} className="flex justify-between items-end pb-3"
                  style={{ borderBottom: '1px solid rgba(69,72,79,0.15)' }}
                >
                  <span className="font-label text-[#73757d]">{row.label}</span>
                  <span className={`font-display text-lg font-medium ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nominal circle */}
          <div className="hidden md:flex w-44 h-44 bg-[#22262f] rounded-full items-center justify-center border-ghost glow-primary flex-shrink-0">
            <div className="text-center">
              <div className="font-label text-[#73757d] mb-1">System</div>
              <div className="text-xl font-display font-bold text-[#ecedf6]">NOMINAL</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
