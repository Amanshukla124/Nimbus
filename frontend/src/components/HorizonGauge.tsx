/**
 * HorizonGauge — Phase 6
 * A premium animated SVG half-circle gauge with a rotating needle.
 * Replaces the static conic-gradient placeholder on FlightDetailPage.
 */
import { useEffect, useRef } from 'react';

interface HorizonGaugeProps {
  /** 0–100 fill percentage */
  value: number;
  /** Large label shown in centre */
  label: string;
  /** Small unit label below the main label */
  unit?: string;
  /** Two extra telemetry rows */
  rows?: Array<{ label: string; value: string; color: string }>;
  size?: number;
}

export const HorizonGauge = ({
  value,
  label,
  unit = '',
  rows = [],
  size = 128,
}: HorizonGaugeProps) => {
  const needleRef = useRef<SVGLineElement>(null);
  const fillRef   = useRef<SVGPathElement>(null);
  const animRef   = useRef<number>(0);
  const currentAngle = useRef(-135); // starts at -135° (min)

  // Convert % to arc angle: -135° (0%) → +135° (100%)
  const targetAngle = -135 + (value / 100) * 270;

  useEffect(() => {
    const duration = 1000;
    let start: number | null = null;
    const fromAngle = currentAngle.current;

    const R = size * 0.35;
    const cx = size / 2;
    const cy = size / 2;

    const polarToXY = (angleDeg: number, r: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const buildArcPath = (startDeg: number, endDeg: number) => {
      const start = polarToXY(startDeg, R);
      const end   = polarToXY(endDeg,   R);
      const large = endDeg - startDeg > 180 ? 1 : 0;
      return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`;
    };

    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // ease-out quart
      const angle = fromAngle + (targetAngle - fromAngle) * eased;

      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${angle}, ${cx}, ${cy})`);
      }
      if (fillRef.current) {
        fillRef.current.setAttribute('d', buildArcPath(-135, angle));
      }

      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        currentAngle.current = targetAngle;
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, size]);

  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.35;

  // Track arc (background)
  const trackStart = { x: cx + R * Math.cos((-135 * Math.PI) / 180), y: cy + R * Math.sin((-135 * Math.PI) / 180) };
  const trackEnd   = { x: cx + R * Math.cos((135 * Math.PI) / 180),  y: cy + R * Math.sin((135 * Math.PI) / 180) };

  // Needle tip (points right at 0° = 3 o'clock in SVG convention; we rotate it)
  const needleTip = { x: cx + (R - 4), y: cy };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#97a9ff" />
              <stop offset="50%"  stopColor="#b884ff" />
              <stop offset="100%" stopColor="#8ff5ff" />
            </linearGradient>
            <filter id="glowFilter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track arc */}
          <path
            d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
            fill="none"
            stroke="#161a21"
            strokeWidth={size * 0.06}
            strokeLinecap="round"
          />

          {/* Animated fill arc */}
          <path
            ref={fillRef}
            d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 0 1 ${trackStart.x} ${trackStart.y}`}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={size * 0.06}
            strokeLinecap="round"
            filter="url(#glowFilter)"
            opacity={0.9}
          />

          {/* Tick marks */}
          {Array.from({ length: 9 }, (_, i) => {
            const angle = -135 + i * (270 / 8);
            const rad   = (angle * Math.PI) / 180;
            const inner = R + size * 0.07;
            const outer = R + size * 0.10;
            return (
              <line
                key={i}
                x1={cx + inner * Math.cos(rad)}
                y1={cy + inner * Math.sin(rad)}
                x2={cx + outer * Math.cos(rad)}
                y2={cy + outer * Math.sin(rad)}
                stroke={i === 0 || i === 8 ? '#45484f' : '#22262f'}
                strokeWidth={i % 4 === 0 ? 1.5 : 0.8}
              />
            );
          })}

          {/* Needle */}
          <line
            ref={needleRef}
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="#ecedf6"
            strokeWidth={1.5}
            strokeLinecap="round"
            filter="url(#glowFilter)"
            transform={`rotate(-135, ${cx}, ${cy})`}
          />

          {/* Centre hub */}
          <circle cx={cx} cy={cy} r={size * 0.045} fill="#22262f" stroke="#45484f" strokeWidth={0.5} />
          <circle cx={cx} cy={cy} r={size * 0.02}  fill="#8ff5ff" opacity={0.8} />
        </svg>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: size * 0.08 }}>
          <p className="font-label text-[#a9abb3] normal-case tracking-normal" style={{ fontSize: size * 0.08 }}>
            {unit ? '' : '\u00A0'}
          </p>
          <p className="font-display font-bold text-white" style={{ fontSize: size * 0.14, lineHeight: 1.1 }}>
            {label}
          </p>
          {unit && (
            <p className="font-label text-[#a9abb3] normal-case tracking-normal" style={{ fontSize: size * 0.07 }}>
              {unit}
            </p>
          )}
        </div>
      </div>

      {/* Telemetry rows */}
      {rows.length > 0 && (
        <div className="w-full space-y-2 mt-2">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between items-center text-xs">
              <span className="text-[#a9abb3]">{row.label}</span>
              <span className={`font-medium ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
