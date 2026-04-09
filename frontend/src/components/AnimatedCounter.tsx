/**
 * AnimatedCounter — Phase 6
 * Smoothly counts up to a target number using requestAnimationFrame.
 * Used for the "Active Arcs" count on LiveMapPage.
 */
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  duration?: number;   // ms
  className?: string;
  formatter?: (n: number) => string;
}

export const AnimatedCounter = ({
  target,
  duration = 1200,
  className = '',
  formatter = (n: number) => n.toLocaleString(),
}: AnimatedCounterProps) => {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    startValRef.current = displayed;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quint
      const eased = 1 - Math.pow(1 - progress, 5);
      setDisplayed(Math.round(startValRef.current + (target - startValRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span className={className}>{formatter(displayed)}</span>;
};
