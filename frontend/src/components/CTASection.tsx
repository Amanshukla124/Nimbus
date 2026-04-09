import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="container mx-auto px-8 py-32 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto glass-panel p-20 rounded-3xl border-ghost relative overflow-hidden"
      >
        {/* Gradient bloom inside the card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(151,169,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(184,132,255,0.06) 0%, transparent 60%)',
          }}
        />

        <h2 className="text-5xl font-display font-bold mb-8 leading-tight text-[#ecedf6] relative z-10">
          Ready to command the <br />
          <span className="bg-gradient-to-r from-[#97a9ff] to-[#b884ff] bg-clip-text text-transparent">
            atmospheric frontier?
          </span>
        </h2>
        <p className="text-[#a9abb3] text-lg mb-12 max-w-xl mx-auto leading-relaxed relative z-10">
          Join the world's leading aerospace and logistics firms using Nimbus for sub-orbital intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <button className="btn-glow-hover bg-gradient-to-r from-[#97a9ff] to-[#b884ff] px-10 py-4 rounded-lg font-bold font-display text-[#001867] shadow-xl shadow-[rgba(151,169,255,0.2)]">
            Launch Dashboard
          </button>
          <button className="px-10 py-4 rounded-lg font-bold font-display text-[#ecedf6] border-ghost glass-panel transition-glide hover:bg-[#22262f]/40">
            Request API Key
          </button>
        </div>
      </motion.div>
    </section>
  );
};
