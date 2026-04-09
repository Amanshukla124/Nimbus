// ─────────────────────────────────────────────────────────────
//  Nimbus Flight Tracker — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

export type FlightStatus = 'on-time' | 'delayed' | 'in-air' | 'landed' | 'cancelled';

/** Live positional state (OpenSky state vector) */
export interface LiveFlight {
  icao24: string;       // ICAO 24-bit address
  callsign: string;     // e.g. "UAL123"
  origin_country: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;  // meters (baro)
  velocity: number | null;  // m/s
  heading: number | null;   // degrees
  vertical_rate: number | null;
  on_ground: boolean;
}

/** Richer flight object for search results */
export interface SearchFlight {
  id: string;
  airline: string;
  flightNo: string;
  origin: string;
  originName: string;
  dest: string;
  destName: string;
  depart: string;
  arrive: string;
  duration: string;
  status: FlightStatus;
  gate: string;
  delay?: string;
  altitude?: number;      // feet
  groundSpeed?: number;   // knots
  eta?: string;
}

/** Full detail object for /flight/:id */
export interface FlightDetail extends SearchFlight {
  progress: number;        // 0–100 %
  timeRemaining: string;
  aircraft: string;
  tailNumber: string;
  aircraftAge: string;
  departureGate: string;
  departureTerminal: string;
  actualDeparture: string;
  arrivalGate: string;
  baggageClaim: string;
  altitudeFt: number;
  vSpeed: string;
  headingDeg: number;
  weatherSummary: string;
  arrivalTempC: number;
}

/** API envelope returned by /api/flights/live */
export interface LiveFlightsResponse {
  count: number;
  flights: LiveFlight[];
  source: 'opensky' | 'simulated';
  timestamp: number;
}

/** API envelope for search */
export interface SearchResponse {
  flights: SearchFlight[];
  total: number;
}
