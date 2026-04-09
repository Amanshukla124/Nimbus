import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { GlobeCanvas } from './GlobeCanvas';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } },
};

const stats = [
  { value: 1.2,  suffix: 'ms', label: 'Latency',    color: 'text-[#8ff5ff]', decimals: 1 },
  { value: 99.9, suffix: '%',  label: 'Accuracy',   color: 'text-[#ecedf6]', decimals: 1 },
  { value: 450,  suffix: '+',  label: 'Satellites',  color: 'text-[#ecedf6]', decimals: 0 },
];

export const Hero = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <section className="relative pt-28 pb-24 min-h-screen overflow-hidden">
      {/* Ambient background blobs */}
      <div className="ambient-blob-1" />
      <div className="ambient-blob-2" />

      {/* Container */}
      <div className="container mx-auto px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">

        {/* ─── Left: Content ─── */}
        <motion.div
          className="flex-1 space-y-12 max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Live status pill */}
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#8ff5ff] rounded-full animate-pulse" />
            <span className="font-label text-[#00eefc]">Atmospheric Feed Active</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-display font-bold leading-[1.05] tracking-[-0.02em] text-[#ecedf6]">
              Global Intelligence <br />
              <span className="bg-gradient-to-r from-[#97a9ff] to-[#b884ff] bg-clip-text text-transparent">
                at your fingertips
              </span>
            </h1>
            <p className="text-[#a9abb3] text-lg max-w-lg leading-relaxed">
              Next-generation atmospheric data visualization for aerospace precision and global logistics. Monitor the stratosphere with zero latency.
            </p>
          </motion.div>

          {/* ─── Search Card ─── */}
          <motion.div
            variants={fadeUp}
            className="glass-panel p-8 rounded-xl border-ghost glow-primary max-w-xl"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#97a9ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <h3 className="font-display text-lg font-medium text-[#ecedf6]">Track Flight or Signal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="font-label text-[#73757d] absolute top-2 left-3 pointer-events-none z-10">
                    Origin
                  </label>
                  <input
                    className="w-full pt-6 pb-2 px-3 bg-[#07090e] border border-[rgba(69,72,79,0.15)] rounded-lg text-sm text-[#ecedf6] placeholder:text-[#73757d] focus:border-[rgba(151,169,255,0.5)] focus:outline-none transition-glide"
                    placeholder="LAX / Los Angeles"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <label className="font-label text-[#73757d] absolute top-2 left-3 pointer-events-none z-10">
                    Destination
                  </label>
                  <input
                    className="w-full pt-6 pb-2 px-3 bg-[#07090e] border border-[rgba(69,72,79,0.15)] rounded-lg text-sm text-[#ecedf6] placeholder:text-[#73757d] focus:border-[rgba(151,169,255,0.5)] focus:outline-none transition-glide"
                    placeholder="LHR / London"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <button className="w-full btn-glow-hover bg-gradient-to-r from-[#97a9ff] to-[#b884ff] text-[#001867] py-3 rounded-lg font-semibold font-display tracking-tight text-sm">
                Execute Scan
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="flex gap-12 pt-2">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className={`text-3xl font-display font-bold ${stat.color} tabular-nums`}>
                  <AnimatedCounter
                    target={stat.value}
                    duration={1400}
                    formatter={(n) =>
                      stat.decimals > 0
                        ? `${n.toFixed(stat.decimals)}${stat.suffix}`
                        : `${Math.round(n)}${stat.suffix}`
                    }
                  />
                </div>
                <div className="font-label text-[#73757d] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── Right: Globe Mockup ─── */}
        <motion.div
          className="flex-1 relative flex justify-center items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-[30rem] h-[30rem]">
            {/* Outer orbital rings */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '1px solid rgba(151, 169, 255, 0.1)',
                animation: 'spin 20s linear infinite',
              }}
            />
            <div
              className="absolute inset-4 rounded-full"
              style={{
                border: '1px solid rgba(184, 132, 255, 0.08)',
                animation: 'spin 30s linear infinite reverse',
              }}
            />

            {/* ── Real WebGL Globe ── */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div style={{ filter: 'drop-shadow(0 0 60px rgba(151,169,255,0.25))' }}>
                <GlobeCanvas size={384} />
              </div>
            </div>

            {/* Altitude gauge overlay */}
            <div className="absolute bottom-4 right-4 glass-panel p-4 rounded-xl border-ghost-primary glow-secondary w-48">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label text-[#a9abb3]">Altitude</span>
                <span className="font-label text-[#8ff5ff]">35,000 FT</span>
              </div>
              <div className="h-1.5 w-full bg-[#10131a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#97a9ff] to-[#8ff5ff]"
                  initial={{ width: '0%' }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Floating telemetry chip */}
            <motion.div
              className="absolute top-10 left-6 glass-panel px-4 py-2 rounded-full border-ghost-primary flex items-center gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-1.5 h-1.5 bg-[#00deec] rounded-full animate-pulse" />
              <span className="font-label text-[#ecedf6]">UA-892 ACTIVE</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

    </section>
  );
};
