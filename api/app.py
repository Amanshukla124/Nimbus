"""
Nimbus Flight Tracker — Flask API v5.1
Data priority:
  1. Aviation Edge   (live positions + timetable — richer, prefers if key set)
  2. AviationStack   (flight status + schedules — HTTPS fallback)
  3. Simulated       (always available, deterministic)

Routes:
  GET /api/status                      → health check
  GET /api/flights/live                → globe positions  (OpenSky → simulated)
  GET /api/flights/by-number?flight=   → single flight lookup
  GET /api/airports                    → list of 50 world airports
  GET /api/airport/<iata>/board        → arrivals + departures board
"""

from __future__ import annotations

import math
import os
import random
import time
from datetime import datetime, timezone, timedelta

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─── API keys & base URLs ─────────────────────────────────────────────────────
AE_KEY  = os.environ.get("AVIATION_EDGE_KEY", "").strip()   # Aviation Edge
AS_KEY  = os.environ.get("AVIATIONSTACK_KEY", "").strip()   # AviationStack

AE_BASE = "https://aviation-edge.com/v2/public"
AS_BASE = "http://api.aviationstack.com/v1"                 # free plan = HTTP only

OPENSKY_URL     = "https://opensky-network.org/api/states/all"
OPENSKY_TIMEOUT = 8

# ─── Static airport data (50 busiest) ────────────────────────────────────────
WORLD_AIRPORTS = [
    {"iata": "ATL", "name": "Atlanta Hartsfield-Jackson", "city": "Atlanta",        "lat": 33.6407,  "lon": -84.4277},
    {"iata": "DFW", "name": "Dallas/Fort Worth Intl",     "city": "Dallas",         "lat": 32.8998,  "lon": -97.0403},
    {"iata": "DEN", "name": "Denver International",        "city": "Denver",         "lat": 39.8561,  "lon": -104.6737},
    {"iata": "ORD", "name": "Chicago O'Hare Intl",         "city": "Chicago",        "lat": 41.9742,  "lon": -87.9073},
    {"iata": "LAX", "name": "Los Angeles Intl",            "city": "Los Angeles",    "lat": 33.9425,  "lon": -118.4081},
    {"iata": "JFK", "name": "New York John F. Kennedy",    "city": "New York",       "lat": 40.6413,  "lon": -73.7781},
    {"iata": "LAS", "name": "Harry Reid International",    "city": "Las Vegas",      "lat": 36.0840,  "lon": -115.1537},
    {"iata": "MCO", "name": "Orlando International",       "city": "Orlando",        "lat": 28.4312,  "lon": -81.3081},
    {"iata": "SEA", "name": "Seattle-Tacoma Intl",         "city": "Seattle",        "lat": 47.4502,  "lon": -122.3088},
    {"iata": "MIA", "name": "Miami International",         "city": "Miami",          "lat": 25.7959,  "lon": -80.2870},
    {"iata": "SFO", "name": "San Francisco Intl",          "city": "San Francisco",  "lat": 37.6213,  "lon": -122.3790},
    {"iata": "CLT", "name": "Charlotte Douglas Intl",      "city": "Charlotte",      "lat": 35.2144,  "lon": -80.9431},
    {"iata": "EWR", "name": "Newark Liberty Intl",         "city": "Newark",         "lat": 40.6895,  "lon": -74.1745},
    {"iata": "PHX", "name": "Phoenix Sky Harbor Intl",     "city": "Phoenix",        "lat": 33.4373,  "lon": -112.0078},
    {"iata": "IAH", "name": "Houston George Bush Intl",    "city": "Houston",        "lat": 29.9902,  "lon": -95.3368},
    {"iata": "LHR", "name": "London Heathrow",             "city": "London",         "lat": 51.4700,  "lon": -0.4543},
    {"iata": "CDG", "name": "Paris Charles de Gaulle",     "city": "Paris",          "lat": 49.0097,  "lon":  2.5478},
    {"iata": "AMS", "name": "Amsterdam Schiphol",          "city": "Amsterdam",      "lat": 52.3105,  "lon":  4.7683},
    {"iata": "FRA", "name": "Frankfurt Airport",            "city": "Frankfurt",      "lat": 50.0379,  "lon":  8.5622},
    {"iata": "IST", "name": "Istanbul Airport",             "city": "Istanbul",       "lat": 41.2753,  "lon": 28.7519},
    {"iata": "MAD", "name": "Madrid Barajas",              "city": "Madrid",         "lat": 40.4936,  "lon": -3.5668},
    {"iata": "BCN", "name": "Barcelona El Prat",           "city": "Barcelona",      "lat": 41.2974,  "lon":  2.0833},
    {"iata": "MUC", "name": "Munich Airport",              "city": "Munich",         "lat": 48.3537,  "lon": 11.7750},
    {"iata": "DXB", "name": "Dubai International",         "city": "Dubai",          "lat": 25.2532,  "lon": 55.3657},
    {"iata": "DOH", "name": "Hamad International",         "city": "Doha",           "lat": 25.2609,  "lon": 51.6138},
    {"iata": "AUH", "name": "Abu Dhabi International",     "city": "Abu Dhabi",      "lat": 24.4330,  "lon": 54.6511},
    {"iata": "BOM", "name": "Chhatrapati Shivaji Maharaj", "city": "Mumbai",         "lat": 19.0896,  "lon": 72.8656},
    {"iata": "DEL", "name": "Indira Gandhi International", "city": "New Delhi",      "lat": 28.5562,  "lon": 77.1000},
    {"iata": "BLR", "name": "Kempegowda International",    "city": "Bengaluru",      "lat": 13.1986,  "lon": 77.7066},
    {"iata": "HND", "name": "Tokyo Haneda",                "city": "Tokyo",          "lat": 35.5494,  "lon": 139.7798},
    {"iata": "NRT", "name": "Tokyo Narita",                "city": "Tokyo",          "lat": 35.7719,  "lon": 140.3929},
    {"iata": "PEK", "name": "Beijing Capital Intl",        "city": "Beijing",        "lat": 40.0801,  "lon": 116.5846},
    {"iata": "PVG", "name": "Shanghai Pudong Intl",        "city": "Shanghai",       "lat": 31.1443,  "lon": 121.8083},
    {"iata": "HKG", "name": "Hong Kong Intl",              "city": "Hong Kong",      "lat": 22.3080,  "lon": 113.9185},
    {"iata": "SIN", "name": "Singapore Changi",            "city": "Singapore",      "lat":  1.3644,  "lon": 103.9915},
    {"iata": "KUL", "name": "Kuala Lumpur Intl",           "city": "Kuala Lumpur",   "lat":  2.7456,  "lon": 101.7072},
    {"iata": "ICN", "name": "Seoul Incheon Intl",          "city": "Seoul",          "lat": 37.4602,  "lon": 126.4407},
    {"iata": "SYD", "name": "Sydney Kingsford Smith",      "city": "Sydney",         "lat": -33.9399, "lon": 151.1753},
    {"iata": "MEL", "name": "Melbourne Airport",           "city": "Melbourne",      "lat": -37.6690, "lon": 144.8410},
    {"iata": "YYZ", "name": "Toronto Pearson Intl",        "city": "Toronto",        "lat": 43.6777,  "lon": -79.6248},
    {"iata": "GRU", "name": "São Paulo Guarulhos",         "city": "São Paulo",      "lat": -23.4356, "lon": -46.4731},
    {"iata": "GIG", "name": "Rio de Janeiro Galeão",       "city": "Rio de Janeiro", "lat": -22.8099, "lon": -43.2505},
    {"iata": "MEX", "name": "Mexico City Intl",            "city": "Mexico City",    "lat": 19.4363,  "lon": -99.0721},
    {"iata": "BOG", "name": "El Dorado International",     "city": "Bogotá",         "lat":  4.7016,  "lon": -74.1469},
    {"iata": "JNB", "name": "OR Tambo International",      "city": "Johannesburg",   "lat": -26.1392, "lon": 28.2460},
    {"iata": "CAI", "name": "Cairo International",         "city": "Cairo",          "lat": 30.1219,  "lon": 31.4056},
    {"iata": "NBO", "name": "Jomo Kenyatta Intl",          "city": "Nairobi",        "lat": -1.3192,  "lon": 36.9275},
    {"iata": "CPT", "name": "Cape Town International",     "city": "Cape Town",      "lat": -33.9715, "lon": 18.6021},
    {"iata": "YVR", "name": "Vancouver International",     "city": "Vancouver",      "lat": 49.1947,  "lon": -123.1797},
    {"iata": "MNL", "name": "Ninoy Aquino International",  "city": "Manila",         "lat": 14.5086,  "lon": 121.0194},
]

AIRLINES_SIM = [
    ("American Airlines", "AA"), ("United Airlines", "UA"), ("Delta Air Lines", "DL"),
    ("Southwest Airlines", "WN"), ("British Airways", "BA"), ("Emirates", "EK"),
    ("Lufthansa", "LH"), ("Air France", "AF"), ("KLM", "KL"), ("Qatar Airways", "QR"),
    ("Singapore Airlines", "SQ"), ("Cathay Pacific", "CX"), ("IndiGo", "6E"),
    ("Air India", "AI"), ("Ryanair", "FR"), ("easyJet", "U2"), ("Turkish Airlines", "TK"),
    ("Etihad Airways", "EY"), ("Japan Airlines", "JL"), ("ANA", "NH"),
]

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _ft(m):
    return round(m * 3.28084) if m is not None else None

def _knots(ms):
    return round(ms * 1.94384) if ms is not None else None

def _airport(iata: str):
    return next((a for a in WORLD_AIRPORTS if a["iata"] == iata.upper()), None)

def _sim_time(offset_min: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=offset_min)).strftime("%H:%M")

def _board_row(seed: str, home: str, direction: str) -> dict:
    rng = random.Random(seed + str(int(time.time() / 300)))
    airline_name, airline_code = rng.choice(AIRLINES_SIM)
    other = rng.choice([a for a in WORLD_AIRPORTS if a["iata"] != home])
    offset = rng.randint(-30, 180)
    delay  = rng.choice([0, 0, 0, 15, 30, 45, 60])
    status = ("active" if -15 <= offset <= 20
              else "scheduled" if offset > 20
              else "landed")
    if delay:
        status = "delayed"
    return {
        "flight_no":    f"{airline_code}{rng.randint(100, 9999)}",
        "airline":      airline_name,
        "airport_iata": other["iata"],
        "airport_name": other["name"],
        "airport_city": other["city"],
        "scheduled":    _sim_time(offset),
        "estimated":    _sim_time(offset + delay),
        "actual":       _sim_time(offset) if status == "landed" else None,
        "status":       status,
        "delay_min":    delay or None,
        "gate":         f"{rng.choice('ABCDEFGH')}{rng.randint(1, 40):02d}",
        "terminal":     f"T{rng.randint(1, 5)}",
    }


def _sim_live_flights(n: int = 80) -> list[dict]:
    rng = random.Random(int(time.time() / 30))
    return [{
        "icao24":         f"sim{i:04x}",
        "callsign":       f"{c}{rng.randint(100,9999)}",
        "origin_country": rng.choice(["US","UK","DE","AE","JP","SG","FR","IN","AU"]),
        "latitude":       round(rng.uniform(-70, 70), 4),
        "longitude":      round(rng.uniform(-170, 170), 4),
        "altitude":       _ft(rng.uniform(5000, 12500)),
        "velocity":       _knots(rng.uniform(150, 280)),
        "heading":        round(rng.uniform(0, 359)),
        "vertical_rate":  round(rng.uniform(-5, 5), 1),
        "on_ground":      False,
    } for i, (_, c) in enumerate([rng.choice(AIRLINES_SIM) for _ in range(n)])]


# ─── Aviation Edge helpers ────────────────────────────────────────────────────

def _ae_flight(flight_iata: str) -> dict | None:
    """Call AE flights tracker by IATA flight number. Returns normalised dict or None."""
    if not AE_KEY:
        return None
    try:
        r = requests.get(
            f"{AE_BASE}/flights",
            params={"key": AE_KEY, "flightIata": flight_iata},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list) and data:
            f = data[0]
            geo   = f.get("geography") or {}
            spd   = f.get("speed") or {}
            dep   = f.get("departure") or {}
            arr   = f.get("arrival") or {}
            al    = f.get("airline") or {}
            fl    = f.get("flight") or {}
            ac    = f.get("aircraft") or {}
            alt_m = geo.get("altitude")
            return {
                "found":       True,
                "source":      "aviation_edge",
                "flight_no":   fl.get("iataNumber") or flight_iata,
                "airline":     al.get("iataCode", "") or "",
                "status":      f.get("status") or "unknown",
                "aircraft_reg": ac.get("regNumber"),
                "aircraft_type": ac.get("iataCode"),
                "origin": {
                    "iata": dep.get("iataCode", "").upper() or "—",
                    "name": "",
                    "scheduled": "", "actual": "", "gate": "—", "terminal": "—", "delay": None,
                },
                "destination": {
                    "iata": arr.get("iataCode", "").upper() or "—",
                    "name": "",
                    "scheduled": "", "estimated": "", "gate": "—", "terminal": "—", "delay": None,
                },
                "live": {
                    "latitude":      geo.get("latitude"),
                    "longitude":     geo.get("longitude"),
                    "altitude":      _ft(alt_m) if alt_m else None,
                    "speed_kph":     spd.get("horizontal"),
                    "heading":       geo.get("direction"),
                    "vertical_rate": spd.get("vspeed"),
                    "is_ground":     bool(spd.get("isGround", 0)),
                    "updated":       str(f.get("system", {}).get("updated", "")),
                },
                "timestamp": int(time.time()),
            }
    except Exception as exc:
        print(f"[AE flight] {exc}")
    return None


def _ae_timetable(iata: str, direction: str) -> list[dict] | None:
    """Call AE timetable endpoint. direction = 'departure' | 'arrival'. Returns list or None."""
    if not AE_KEY:
        return None
    try:
        r = requests.get(
            f"{AE_BASE}/timetable",
            params={"key": AE_KEY, "iataCode": iata, "type": direction},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, list):
            return None
        rows = []
        for f in data[:25]:
            dep = f.get("departure") or {}
            arr = f.get("arrival") or {}
            al  = f.get("airline") or {}
            fl  = f.get("flight") or {}
            if direction == "departure":
                other_iata = arr.get("iataCode", "").upper()
                sched      = dep.get("scheduledTime", "")
                est        = dep.get("estimatedTime") or sched
                actual     = dep.get("actualTime")
                gate       = dep.get("gate") or "—"
                terminal   = dep.get("terminal") or "—"
                delay      = dep.get("delay")
            else:
                other_iata = dep.get("iataCode", "").upper()
                sched      = arr.get("scheduledTime", "")
                est        = arr.get("estimatedTime") or sched
                actual     = arr.get("actualTime")
                gate       = arr.get("gate") or "—"
                terminal   = arr.get("terminal") or "—"
                delay      = arr.get("delay")

            other_apt   = _airport(other_iata) or {}
            other_name  = other_apt.get("name", other_iata) if isinstance(other_apt, dict) else other_iata
            other_city  = other_apt.get("city", "") if isinstance(other_apt, dict) else ""

            status_raw = f.get("status") or ("landed" if actual else ("active" if est else "scheduled"))
            if delay:
                status_raw = "delayed"

            rows.append({
                "flight_no":    fl.get("iataNumber") or fl.get("icaoNumber") or "—",
                "airline":      al.get("name") or al.get("iataCode") or "—",
                "airport_iata": other_iata or "—",
                "airport_name": other_name,
                "airport_city": other_city,
                "scheduled":    sched,
                "estimated":    est,
                "actual":       actual,
                "status":       status_raw,
                "delay_min":    int(delay) if delay else None,
                "gate":         gate,
                "terminal":     terminal,
            })
        return rows
    except Exception as exc:
        print(f"[AE timetable {direction}] {exc}")
    return None


# ─── AviationStack helpers ────────────────────────────────────────────────────

def _as_flight(flight_iata: str) -> dict | None:
    if not AS_KEY:
        return None
    try:
        r = requests.get(
            f"{AS_BASE}/flights",
            params={"access_key": AS_KEY, "flight_iata": flight_iata, "limit": 1},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        items = data.get("data") or []
        if items:
            f   = items[0]
            dep = f.get("departure") or {}
            arr = f.get("arrival") or {}
            lv  = f.get("live") or {}
            al  = f.get("airline") or {}
            fl  = f.get("flight") or {}
            return {
                "found":       True,
                "source":      "aviationstack",
                "flight_no":   fl.get("iata") or flight_iata,
                "airline":     al.get("name") or "—",
                "status":      f.get("flight_status") or "unknown",
                "aircraft_reg": None,
                "aircraft_type": None,
                "origin": {
                    "iata":      dep.get("iata") or "—",
                    "name":      dep.get("airport") or "—",
                    "scheduled": dep.get("scheduled") or "—",
                    "actual":    dep.get("actual") or dep.get("estimated") or "—",
                    "gate":      dep.get("gate") or "—",
                    "terminal":  dep.get("terminal") or "—",
                    "delay":     dep.get("delay"),
                },
                "destination": {
                    "iata":      arr.get("iata") or "—",
                    "name":      arr.get("airport") or "—",
                    "scheduled": arr.get("scheduled") or "—",
                    "estimated": arr.get("estimated") or "—",
                    "gate":      arr.get("gate") or "—",
                    "terminal":  arr.get("terminal") or "—",
                    "delay":     arr.get("delay"),
                },
                "live": {
                    "latitude":      lv.get("latitude"),
                    "longitude":     lv.get("longitude"),
                    "altitude":      lv.get("altitude"),
                    "speed_kph":     lv.get("speed_horizontal"),
                    "heading":       lv.get("direction"),
                    "vertical_rate": lv.get("speed_vertical"),
                    "is_ground":     lv.get("is_ground"),
                    "updated":       lv.get("updated"),
                },
                "timestamp": int(time.time()),
            }
    except Exception as exc:
        print(f"[AS flight] {exc}")
    return None


def _as_board(iata: str, direction: str) -> list[dict] | None:
    if not AS_KEY:
        return None
    param_key = "dep_iata" if direction == "departure" else "arr_iata"
    try:
        r = requests.get(
            f"{AS_BASE}/flights",
            params={"access_key": AS_KEY, param_key: iata, "limit": 25},
            timeout=10,
        )
        r.raise_for_status()
        items = r.json().get("data") or []
        rows = []
        for f in items:
            dep = f.get("departure") or {}
            arr = f.get("arrival") or {}
            al  = f.get("airline") or {}
            fl  = f.get("flight") or {}
            ddir = direction == "departure"
            other_iata = (arr if ddir else dep).get("iata") or "—"
            other_name = (arr if ddir else dep).get("airport") or "—"
            sched = (dep if ddir else arr).get("scheduled") or "—"
            est   = (dep if ddir else arr).get("estimated") or sched
            actual = (dep if ddir else arr).get("actual")
            gate   = (dep if ddir else arr).get("gate") or "—"
            term   = (dep if ddir else arr).get("terminal") or "—"
            delay  = (dep if ddir else arr).get("delay")
            status = f.get("flight_status") or "scheduled"
            rows.append({
                "flight_no":    fl.get("iata") or "—",
                "airline":      al.get("name") or "—",
                "airport_iata": other_iata,
                "airport_name": other_name,
                "airport_city": other_iata,
                "scheduled":    sched,
                "estimated":    est,
                "actual":       actual,
                "status":       status,
                "delay_min":    int(delay) if delay else None,
                "gate":         gate,
                "terminal":     term,
            })
        return rows if rows else None
    except Exception as exc:
        print(f"[AS board {direction}] {exc}")
    return None


def _sim_flight(flight_iata: str) -> dict:
    rng = random.Random(flight_iata)
    al_name, _ = rng.choice(AIRLINES_SIM)
    orig  = rng.choice(WORLD_AIRPORTS)
    dest  = rng.choice([a for a in WORLD_AIRPORTS if a["iata"] != orig["iata"]])
    prog  = rng.randint(15, 85) / 100
    cur_lat = orig["lat"] + (dest["lat"] - orig["lat"]) * prog
    cur_lon = orig["lon"] + (dest["lon"] - orig["lon"]) * prog
    heading = (math.degrees(math.atan2(dest["lon"] - orig["lon"], dest["lat"] - orig["lat"])) + 360) % 360
    return {
        "found": True, "source": "simulated",
        "flight_no": flight_iata, "airline": al_name,
        "status": rng.choice(["active", "active", "active", "delayed", "scheduled"]),
        "aircraft_reg": None, "aircraft_type": None,
        "origin": {
            "iata": orig["iata"], "name": orig["name"],
            "scheduled": _sim_time(-int(prog * 480)),
            "actual":    _sim_time(-int(prog * 480)),
            "gate": f"{rng.choice('ABCDEFGH')}{rng.randint(1,30):02d}",
            "terminal": f"T{rng.randint(1,5)}", "delay": None,
        },
        "destination": {
            "iata": dest["iata"], "name": dest["name"],
            "scheduled": _sim_time(int((1 - prog) * 480)),
            "estimated": _sim_time(int((1 - prog) * 480)),
            "gate": f"{rng.choice('ABCDEFGH')}{rng.randint(1,30):02d}",
            "terminal": f"T{rng.randint(1,5)}", "delay": None,
        },
        "live": {
            "latitude":  round(cur_lat, 4), "longitude": round(cur_lon, 4),
            "altitude":  rng.randint(28000, 42000), "speed_kph": rng.randint(750, 950),
            "heading":   round(heading), "vertical_rate": round(rng.uniform(-1, 1), 1),
            "is_ground": False, "updated": datetime.now(timezone.utc).isoformat(),
        },
        "timestamp": int(time.time()),
    }


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route('/api/status')
def status():
    return jsonify({
        "status":           "healthy",
        "service":          "Nimbus API",
        "version":          "5.1.0",
        "aviation_edge":    bool(AE_KEY),
        "aviationstack":    bool(AS_KEY),
        "time":             datetime.now(timezone.utc).isoformat(),
    })


@app.route('/api/flights/live')
def live_flights():
    limit = min(int(request.args.get('limit', 80)), 250)
    try:
        r = requests.get(OPENSKY_URL, timeout=OPENSKY_TIMEOUT,
                         headers={"User-Agent": "Nimbus/5.1"})
        r.raise_for_status()
        states = r.json().get("states") or []
        flights = [
            {
                "icao24": sv[0], "callsign": (sv[1] or "").strip() or sv[0],
                "origin_country": sv[2] or "",
                "latitude": sv[6], "longitude": sv[5],
                "altitude": _ft(sv[7]), "velocity": _knots(sv[9]),
                "heading": sv[10], "vertical_rate": sv[11], "on_ground": bool(sv[8]),
            }
            for sv in states[:limit] if sv[5] is not None and sv[6] is not None
        ]
        return jsonify({"count": len(flights), "flights": flights, "source": "opensky", "timestamp": int(time.time())})
    except Exception:
        flights = _sim_live_flights(limit)
        return jsonify({"count": len(flights), "flights": flights, "source": "simulated", "timestamp": int(time.time())})


# ─── India bounding box: lat 6–37, lon 68–97 ─────────────────────────────────
INDIA_BBOX = dict(lamin=6.0, lomin=68.0, lamax=37.0, lomax=97.0)

# Simulated Indian domestic flights (used as fallback)
INDIA_AIRPORTS_SIM = [
    ("DEL", "New Delhi",   28.5562,  77.1000),
    ("BOM", "Mumbai",      19.0896,  72.8656),
    ("BLR", "Bengaluru",   13.1986,  77.7066),
    ("MAA", "Chennai",     12.9941,  80.1709),
    ("HYD", "Hyderabad",   17.2313,  78.4298),
    ("CCU", "Kolkata",     22.6547,  88.4467),
    ("AMD", "Ahmedabad",   23.0771,  72.6347),
    ("COK", "Kochi",       10.1520,  76.4019),
    ("PNQ", "Pune",        18.5822,  73.9197),
    ("GOI", "Goa",         15.3808,  73.8314),
    ("JAI", "Jaipur",      26.8242,  75.8122),
    ("LKO", "Lucknow",     26.7606,  80.8893),
    ("PAT", "Patna",       25.5913,  85.0880),
    ("IXC", "Chandigarh",  30.6735,  76.7888),
    ("BHO", "Bhopal",      23.2875,  77.3374),
    ("NAG", "Nagpur",      21.0922,  79.0472),
    ("VTZ", "Visakhapatnam", 17.7212, 83.2245),
    ("IXB", "Bagdogra",    26.6812,  88.3286),
    ("GAU", "Guwahati",    26.1061,  91.5856),
    ("CJB", "Coimbatore",  11.0300,  77.0435),
]
INDIA_AIRLINES_SIM = [
    ("IndiGo", "6E"), ("Air India", "AI"), ("SpiceJet", "SG"),
    ("Akasa Air", "QP"), ("Vistara", "UK"), ("Go First", "G8"),
    ("Air India Express", "IX"), ("Star Air", "S5"),
]

def _sim_india_flights(n: int = 60) -> list[dict]:
    rng = random.Random(int(time.time() / 30))
    flights = []
    for i in range(n):
        airline_name, code = rng.choice(INDIA_AIRLINES_SIM)
        num = rng.randint(100, 3999)
        orig = rng.choice(INDIA_AIRPORTS_SIM)
        dest = rng.choice([a for a in INDIA_AIRPORTS_SIM if a[0] != orig[0]])
        # Random position partway between origin and destination
        prog = rng.uniform(0.1, 0.9)
        lat = orig[2] + (dest[2] - orig[2]) * prog + rng.uniform(-0.5, 0.5)
        lon = orig[3] + (dest[3] - orig[3]) * prog + rng.uniform(-0.5, 0.5)
        heading = (math.degrees(math.atan2(dest[3] - orig[3], dest[2] - orig[2])) + 360) % 360
        # Clip to India bounding box
        lat = max(6.5, min(36.5, lat))
        lon = max(68.5, min(96.5, lon))
        flights.append({
            "icao24":         f"ind{i:04x}",
            "callsign":       f"{code}{num}",
            "origin_country": "India",
            "latitude":       round(lat, 4),
            "longitude":      round(lon, 4),
            "altitude":       _ft(rng.uniform(6000, 11500)),
            "velocity":       _knots(rng.uniform(180, 250)),
            "heading":        round(heading),
            "vertical_rate":  round(rng.uniform(-3, 3), 1),
            "on_ground":      False,
            "from_iata":      orig[0],
            "to_iata":        dest[0],
            "airline":        airline_name,
        })
    return flights


@app.route('/api/flights/india')
def india_flights():
    """
    Returns live flights within Indian airspace (bounding box 6–37°N, 68–97°E).
    Primary: OpenSky with bbox filter. Fallback: simulated Indian domestic flights.
    Also tries Aviation Edge for depIata-based Indian airline flights if key set.
    """
    limit = min(int(request.args.get('limit', 80)), 200)

    # ── Aviation Edge: fetch live flights for Indian carriers ────────────────
    if AE_KEY:
        try:
            ae_flights = []
            for airline_code in ["6E", "AI", "SG", "QP", "UK"]:
                r = requests.get(
                    f"{AE_BASE}/flights",
                    params={"key": AE_KEY, "airlineIata": airline_code},
                    timeout=8,
                )
                if r.ok:
                    data = r.json()
                    if isinstance(data, list):
                        for f in data:
                            geo = f.get("geography") or {}
                            spd = f.get("speed") or {}
                            dep = f.get("departure") or {}
                            arr = f.get("arrival") or {}
                            al  = f.get("airline") or {}
                            fl  = f.get("flight") or {}
                            lat = geo.get("latitude")
                            lon = geo.get("longitude")
                            if lat is None or lon is None:
                                continue
                            ae_flights.append({
                                "icao24":         f.get("aircraft", {}).get("icao24") or fl.get("icaoNumber") or f"ae{len(ae_flights):04x}",
                                "callsign":       fl.get("iataNumber") or fl.get("icaoNumber") or "—",
                                "origin_country": "India",
                                "latitude":       lat,
                                "longitude":      lon,
                                "altitude":       _ft(geo.get("altitude")),
                                "velocity":       round((spd.get("horizontal") or 0) * 0.539957),  # kph→knots
                                "heading":        geo.get("direction"),
                                "vertical_rate":  spd.get("vspeed"),
                                "on_ground":      bool(spd.get("isGround", 0)),
                                "from_iata":      dep.get("iataCode", "").upper(),
                                "to_iata":        arr.get("iataCode", "").upper(),
                                "airline":        al.get("iataCode", ""),
                            })
            if ae_flights:
                ae_flights = ae_flights[:limit]
                return jsonify({
                    "count": len(ae_flights),
                    "flights": ae_flights,
                    "source": "aviation_edge",
                    "timestamp": int(time.time()),
                })
        except Exception as exc:
            print(f"[AE india] {exc}")

    # ── OpenSky with bounding box ────────────────────────────────────────────
    try:
        params = {**INDIA_BBOX}
        r = requests.get(
            OPENSKY_URL,
            params=params,
            timeout=OPENSKY_TIMEOUT,
            headers={"User-Agent": "Nimbus/5.1"},
        )
        r.raise_for_status()
        states = r.json().get("states") or []
        flights = [
            {
                "icao24":         sv[0],
                "callsign":       (sv[1] or "").strip() or sv[0],
                "origin_country": sv[2] or "",
                "latitude":       sv[6],
                "longitude":      sv[5],
                "altitude":       _ft(sv[7]),
                "velocity":       _knots(sv[9]),
                "heading":        sv[10],
                "vertical_rate":  sv[11],
                "on_ground":      bool(sv[8]),
                "from_iata":      "",
                "to_iata":        "",
                "airline":        "",
            }
            for sv in states if sv[5] is not None and sv[6] is not None
        ]
        flights = flights[:limit]
        if flights:
            return jsonify({
                "count": len(flights),
                "flights": flights,
                "source": "opensky",
                "timestamp": int(time.time()),
            })
    except Exception as exc:
        print(f"[OpenSky india] {exc}")

    # ── Simulated Indian domestic fallback ──────────────────────────────────
    flights = _sim_india_flights(limit)
    return jsonify({
        "count": len(flights),
        "flights": flights,
        "source": "simulated",
        "timestamp": int(time.time()),
    })


@app.route('/api/flights/by-number')
def flight_by_number():
    iata = request.args.get('flight', '').strip().upper().replace(" ", "")
    if not iata:
        return jsonify({"error": "Missing 'flight' query param"}), 400

    # 1 → Aviation Edge (has live lat/lon directly)
    result = _ae_flight(iata)
    # 2 → AviationStack
    if result is None:
        result = _as_flight(iata)
    # 3 → Simulated
    if result is None:
        result = _sim_flight(iata)

    return jsonify(result)


@app.route('/api/airports')
def airports():
    return jsonify({"airports": WORLD_AIRPORTS, "count": len(WORLD_AIRPORTS)})


@app.route('/api/airport/<iata>/board')
def airport_board(iata: str):
    iata = iata.upper()
    apt  = _airport(iata)
    if not apt:
        return jsonify({"error": f"Airport '{iata}' not found"}), 404

    limit = min(int(request.args.get('limit', 20)), 50)
    source = "simulated"

    # Try Aviation Edge timetable first
    arrivals   = _ae_timetable(iata, "arrival")
    departures = _ae_timetable(iata, "departure")
    if arrivals is not None and departures is not None:
        source = "aviation_edge"
    else:
        # Try AviationStack board
        arrivals   = _as_board(iata, "arrival")
        departures = _as_board(iata, "departure")
        if arrivals is not None and departures is not None:
            source = "aviationstack"
        else:
            arrivals   = [_board_row(f"{iata}-arr-{i}", iata, "arr") for i in range(limit)]
            departures = [_board_row(f"{iata}-dep-{i}", iata, "dep") for i in range(limit)]

    return jsonify({
        "airport": apt, "arrivals": arrivals[:limit],
        "departures": departures[:limit],
        "source": source, "timestamp": int(time.time()),
    })


if __name__ == '__main__':
    app.run(port=5001, debug=True, use_reloader=True)
