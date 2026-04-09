import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState<'live' | 'sim' | 'unknown'>('unknown');
  const isAirportPage = location.pathname.startsWith('/airport/');

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then(r => r.json())
      .then(d => {
        setApiStatus(d.aviation_edge || d.aviationstack ? 'live' : 'sim');
      })
      .catch(() => setApiStatus('sim'));
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5"
      style={{
        background: 'rgba(7,9,14,0.75)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(69,72,79,0.15)',
      }}
    >
      {/* Logo */}
      <button
        id="nav-logo"
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 group"
      >
        {/* Plane icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #97a9ff, #b884ff)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#001867]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-[#ecedf6] group-hover:text-[#97a9ff] transition-glide">
          Nimbus
        </span>
      </button>

      {/* Center — current context */}
      <div className="flex-1 flex justify-center">
        {isAirportPage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#73757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
            <span className="font-label text-[#73757d]">
              {location.pathname.split('/').pop()?.toUpperCase()} Arrivals & Departures
            </span>
          </motion.div>
        )}
      </div>

      {/* Right — live indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: apiStatus === 'live' ? '#8ff5ff' : '#ff6e84',
              boxShadow: apiStatus === 'live' ? '0 0 6px rgba(143,245,255,0.6)' : 'none',
              animation: apiStatus === 'live' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            className="font-label text-[10px]"
            style={{ color: apiStatus === 'live' ? '#8ff5ff' : '#ff6e84' }}
          >
            {apiStatus === 'live' ? 'LIVE DATA' : apiStatus === 'sim' ? 'SIMULATED' : '…'}
          </span>
        </div>
      </div>
    </motion.nav>
  );
};
