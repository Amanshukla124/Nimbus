import { useEffect, useRef, useCallback } from 'react';
import GlobeLib from 'globe.gl';
import type { LiveFlight } from '../types/flight';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  icao24: string;
}

interface CustomMarker {
  lat: number;
  lng: number;
  heading: number;
  icao24: string;
  callsign: string;
  altitude: number | null;
  velocity: number | null;
  onGround: boolean;
}

interface GlobeCanvasProps {
  size?: number;
  flights?: LiveFlight[];
  className?: string;
  rotateSpeed?: number;
  interactive?: boolean;
  onFlightClick?: (flight: LiveFlight) => void;
  selectedFlightIcao?: string | null;
}

// ─── Earth textures ───────────────────────────────────────────────────────────
const EARTH_TEXTURE =
  'https://unpkg.com/three-globe@2.33.0/example/img/earth-night.jpg';
const BUMP_TEXTURE =
  'https://unpkg.com/three-globe@2.33.0/example/img/earth-topology.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function projectDestination(
  lat: number, lng: number, headingDeg: number, distKm: number,
): [number, number] {
  const R = 6371;
  const d = distKm / R;
  const brng = (headingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  );
  return [(lat2 * 180) / Math.PI, ((lng2 * 180) / Math.PI + 540) % 360 - 180];
}

function flightsToMarkers(flights: LiveFlight[]): CustomMarker[] {
  return flights
    .filter(f => f.latitude != null && f.longitude != null)
    .map(f => ({
      lat: f.latitude!,
      lng: f.longitude!,
      heading: f.heading ?? 0,
      icao24: f.icao24,
      callsign: f.callsign,
      altitude: f.altitude,
      velocity: f.velocity,
      onGround: f.on_ground,
    }));
}

/** Build a single arc from current position → 800 km projected ahead (on-click). */
function buildSelectedArc(flight: LiveFlight): ArcData | null {
  if (
    flight.latitude == null ||
    flight.longitude == null ||
    flight.heading == null
  ) return null;
  const dist = flight.velocity ? Math.min(Math.max(flight.velocity * 2, 600), 1800) : 900;
  const [endLat, endLng] = projectDestination(
    flight.latitude, flight.longitude, flight.heading, dist,
  );
  return {
    startLat: flight.latitude,
    startLng: flight.longitude,
    endLat,
    endLng,
    color: ['#8ff5ff', 'rgba(143,245,255,0)'],
    icao24: flight.icao24,
  };
}

/** Plane SVG icon, rotated by heading, highlighted when selected */
function planeHTML(heading: number, selected: boolean, onGround: boolean): string {
  const color = selected ? '#ffffff' : onGround ? '#a9abb3' : '#8ff5ff';
  const shadow = selected
    ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9))'
    : 'drop-shadow(0 0 3px rgba(143,245,255,0.5))';
  const scale = selected ? 1.5 : 1;

  return `
    <div style="
      transform: rotate(${heading}deg) scale(${scale});
      transform-origin: center;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: ${shadow};
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <svg xmlns="http://www.w3.org/2000/svg"
        width="16" height="16" viewBox="0 0 24 24"
        fill="${color}" style="transform: rotate(-45deg);">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const GlobeCanvas = ({
  size = 480,
  flights,
  rotateSpeed = 0.3,
  className = '',
  interactive = false,
  onFlightClick,
  selectedFlightIcao,
}: GlobeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const flightsRef = useRef<LiveFlight[]>(flights ?? []);

  useEffect(() => {
    flightsRef.current = flights ?? [];
  }, [flights]);

  const initGlobe = useCallback(() => {
    const el = containerRef.current;
    if (!el || globeRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GlobeFn = (GlobeLib as any).default ?? GlobeLib;
    const globe = GlobeFn({ animateIn: false })(el);
    globeRef.current = globe;

    globe.width(size).height(size);

    // ── Visuals ──────────────────────────────────────────────────────────────
    globe
      .globeImageUrl(EARTH_TEXTURE)
      .bumpImageUrl(BUMP_TEXTURE)
      .backgroundColor('rgba(0,0,0,0)')
      .atmosphereColor('#97a9ff')
      .atmosphereAltitude(0.18)
      .showGraticules(false)
      .showAtmosphere(true);

    // ── Arcs — empty by default, shown only on selection ──────────────────
    globe
      .arcsData([])
      .arcStartLat((d: unknown) => (d as ArcData).startLat)
      .arcStartLng((d: unknown) => (d as ArcData).startLng)
      .arcEndLat((d: unknown) => (d as ArcData).endLat)
      .arcEndLng((d: unknown) => (d as ArcData).endLng)
      .arcColor((d: unknown) => (d as ArcData).color)
      .arcAltitude(0.2)
      .arcStroke(0.8)
      .arcDashLength(0.5)
      .arcDashGap(0.5)
      .arcDashAnimateTime(1800)
      .arcsTransitionDuration(400);

    // ── HTML custom markers (plane icons) ────────────────────────────────
    const markers = flightsToMarkers(flights ?? []);
    globe
      .htmlElementsData(markers)
      .htmlElement((d: unknown) => {
        const m = d as CustomMarker;
        const el2 = document.createElement('div');
        el2.innerHTML = planeHTML(
          m.heading,
          m.icao24 === selectedFlightIcao,
          m.onGround,
        );
        el2.style.pointerEvents = 'auto';
        el2.style.cursor = 'pointer';
        el2.title = m.callsign;

        if (interactive && onFlightClick) {
          el2.addEventListener('click', () => {
            const flight = flightsRef.current.find(f => f.icao24 === m.icao24);
            if (flight) onFlightClick(flight);
          });
        }
        return el2;
      })
      .htmlLat((d: unknown) => (d as CustomMarker).lat)
      .htmlLng((d: unknown) => (d as CustomMarker).lng)
      .htmlAltitude(0.005);

    // ── Controls ─────────────────────────────────────────────────────────
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = rotateSpeed;
    controls.enableZoom = interactive;
    controls.enablePan = false;
    controls.enableRotate = interactive;

    if (interactive) {
      el.addEventListener('mousedown', () => { controls.autoRotate = false; });
      el.addEventListener('touchstart', () => { controls.autoRotate = false; }, { passive: true });
      const resume = () => { controls.autoRotate = true; };
      el.addEventListener('mouseup', resume);
      el.addEventListener('touchend', resume);
    }

    // ── Camera — start over India ────────────────────────────────────────
    globe.pointOfView({ lat: 22, lng: 80, altitude: interactive ? 1.8 : 1.8 });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, rotateSpeed, interactive]);

  // ── Update HTML markers when flights change ───────────────────────────────
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !flights) return;
    const markers = flightsToMarkers(flights);
    globe.htmlElementsData(markers);
  }, [flights]);

  // ── Update arc when selection changes ────────────────────────────────────
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Rebuild the arc for the selected flight
    if (selectedFlightIcao) {
      const flight = flightsRef.current.find(f => f.icao24 === selectedFlightIcao);
      const arc = flight ? buildSelectedArc(flight) : null;
      globe.arcsData(arc ? [arc] : []);
    } else {
      globe.arcsData([]);
    }

    // Re-render all HTML markers so selection highlight updates
    globe.htmlElement((d: unknown) => {
      const m = d as CustomMarker;
      const el = document.createElement('div');
      el.innerHTML = planeHTML(
        m.heading,
        m.icao24 === selectedFlightIcao,
        m.onGround,
      );
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.title = m.callsign;
      if (onFlightClick) {
        el.addEventListener('click', () => {
          const flight = flightsRef.current.find(f => f.icao24 === m.icao24);
          if (flight) onFlightClick(flight);
        });
      }
      return el;
    });
  }, [selectedFlightIcao, onFlightClick]);

  // ── Globe pan-to on flight select ────────────────────────────────────────
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedFlightIcao) return;
    const flight = flightsRef.current.find(f => f.icao24 === selectedFlightIcao);
    if (flight?.latitude != null && flight?.longitude != null) {
      globe.pointOfView(
        { lat: flight.latitude, lng: flight.longitude, altitude: 1.2 },
        800,
      );
    }
  }, [selectedFlightIcao]);

  useEffect(() => {
    const timer = setTimeout(initGlobe, 80);
    return () => {
      clearTimeout(timer);
      if (globeRef.current?._destructor) globeRef.current._destructor();
      globeRef.current = null;
    };
  }, [initGlobe]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: interactive ? '0' : '50%',
        overflow: 'hidden',
        pointerEvents: 'auto',
        cursor: interactive ? 'grab' : 'default',
      }}
    />
  );
};
