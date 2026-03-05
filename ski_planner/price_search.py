"""Generate search queries and URLs for each leg of a ski route.

The OpenClaw bot uses these plans with its web_search and browser tools
to find real prices for every leg of a multi-modal ski journey.
"""

import json
import re
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def _load_travel_sites() -> dict:
    """Load travel_sites.json from the same directory as this file."""
    data_path = Path(__file__).resolve().parent / "travel_sites.json"
    with open(data_path, encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

_MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _format_date_human(date_str: str) -> str:
    """'2026-03-15' -> '15 March 2026'"""
    parts = date_str.split("-")
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    return f"{day} {_MONTH_NAMES[month]} {year}"


def _format_date_skyscanner(date_str: str) -> str:
    """'2026-03-15' -> '260315'"""
    parts = date_str.split("-")
    year_short = parts[0][2:]   # last 2 digits of year
    month = parts[1]
    day = parts[2]
    return f"{year_short}{month}{day}"


def _format_date_flixbus(date_str: str) -> str:
    """'2026-03-15' -> '15.03.2026'"""
    parts = date_str.split("-")
    return f"{parts[2]}.{parts[1]}.{parts[0]}"


def _month_year(date_str: str) -> str:
    """'2026-03-15' -> 'March 2026'"""
    parts = date_str.split("-")
    year, month = int(parts[0]), int(parts[1])
    return f"{_MONTH_NAMES[month]} {year}"


# ---------------------------------------------------------------------------
# City normalisation
# ---------------------------------------------------------------------------

# Suffixes that are stripped so that e.g. "London St Pancras" -> "London"
_STRIP_SUFFIXES = [
    "Airport", "International Airport", "St Pancras", "Gare de Lyon",
    "Gare du Nord", "Gare Centrale", "Central", "Hauptbahnhof", "Hbf",
    "Station", "Bus Station", "Train Station",
]

# Resort suffix words that are stripped for shuttle key lookups
_RESORT_SUFFIXES = [
    "Mont-Blanc", "sur-Mer", "les-Bains", "en-Vercors",
]


def _normalize_city(name: str) -> str:
    """Strip station/airport qualifiers to get a bare city name.

    Examples:
        'London St Pancras'  -> 'London'
        'Paris Gare de Lyon' -> 'Paris'
        'Geneva Airport'     -> 'Geneva'
        'Milan Malpensa'     -> 'Milan'
    """
    result = name.strip()
    for suffix in _STRIP_SUFFIXES:
        # strip trailing suffix (case-insensitive)
        pattern = re.compile(r"\s+" + re.escape(suffix) + r"$", re.IGNORECASE)
        result = pattern.sub("", result).strip()
    return result


# ---------------------------------------------------------------------------
# Skyscanner place ID helpers
# ---------------------------------------------------------------------------

def _skyscanner_place(code_or_city: str, sites: dict) -> Optional[str]:
    """Return a lowercase Skyscanner place ID for an IATA code or city name.

    Handles multi-airport codes like 'LGW/LHR' by checking city_to_airport
    first, then individual codes.

    Returns None when no mapping is found.
    """
    sky = sites.get("skyscanner_places", {})
    c2a = sites.get("city_to_airport", {})

    # Direct IATA (possibly with slash e.g. LGW/LHR)
    if "/" in code_or_city:
        # Try city code from city_to_airport using the bare city name derived
        # from the from/to field — caller should pass city name separately.
        # Fall back to the first code in the slash list.
        first_code = code_or_city.split("/")[0].strip()
        place_id = sky.get(first_code.upper())
        if place_id:
            return place_id.lower()
        return first_code.lower()

    upper = code_or_city.upper()
    if upper in sky:
        return sky[upper].lower()

    # Maybe it is a city name — look up via city_to_airport then skyscanner
    if code_or_city in c2a:
        airport_code = c2a[code_or_city]
        if airport_code.upper() in sky:
            return sky[airport_code.upper()].lower()
        return airport_code.lower()

    # Last resort: lowercase the raw value
    return code_or_city.lower()


def _skyscanner_place_for_city(city: str, sites: dict) -> str:
    """Return Skyscanner place ID from a plain city name."""
    c2a = sites.get("city_to_airport", {})
    sky = sites.get("skyscanner_places", {})

    normalized = _normalize_city(city)
    if normalized in c2a:
        airport_code = c2a[normalized]
        if airport_code.upper() in sky:
            return sky[airport_code.upper()].lower()
        return airport_code.lower()
    return normalized.lower().replace(" ", "-")


# ---------------------------------------------------------------------------
# Per-mode builders
# ---------------------------------------------------------------------------

def _build_flight_plan(leg: dict, date_human: str, date_sky: str, date_str: str, sites: dict) -> dict:
    from_city = leg["from"]
    to_city = leg["to"]
    from_code = leg.get("from_code", "")
    to_code = leg.get("to_code", "")
    month_year = _month_year(date_str)

    # Search queries — always one-way
    queries = [
        f"{from_city} to {to_city} one way flights {date_human}",
    ]
    if from_code and to_code:
        queries.append(f"{from_code} {to_code} one way flights {date_human} price schedule")

    # Google Flights — one-way nonstop search
    primary_q = quote_plus(f"{from_city} to {to_city} {date_human} one way nonstop")
    primary_url = f"https://www.google.com/travel/flights?q={primary_q}"

    return {
        "web_search_queries": queries,
        "urls": {
            "primary": primary_url,
        },
        "fallback_query": f"{from_city} {to_city} flights {month_year}",
    }


def _build_train_plan(leg: dict, date_human: str, date_str: str, sites: dict) -> dict:
    from_city = leg["from"]
    to_city = leg["to"]
    carriers = leg.get("typical_carriers", [])
    month_year = _month_year(date_str)

    queries = [
        f"{from_city} to {to_city} train {date_human} price",
    ]
    if carriers:
        queries.append(f"{from_city} to {to_city} {carriers[0]} {date_human} ticket price")

    # Trainline URN lookup — try full name, then normalized (bare city)
    stations = sites.get("trainline_stations", {})

    def _urn(name: str) -> Optional[str]:
        if name in stations:
            return stations[name]
        normalized = _normalize_city(name)
        return stations.get(normalized)

    from_urn = _urn(from_city)
    to_urn = _urn(to_city)

    google_q = quote_plus(f"{from_city} to {to_city} train {date_human} price")
    google_url = f"https://www.google.com/search?q={google_q}"

    if from_urn and to_urn:
        iso_datetime = f"{date_str}T08:00:00"
        from_enc = quote_plus(from_urn)
        to_enc = quote_plus(to_urn)
        primary_url = (
            f"https://www.thetrainline.com/book/results"
            f"?origin={from_enc}&destination={to_enc}"
            f"&outwardDate={iso_datetime}&outwardDateType=departAfter"
        )
        alt_url = google_url
    else:
        primary_url = google_url
        alt_url = google_url

    return {
        "web_search_queries": queries,
        "urls": {
            "primary": primary_url,
            "alt": alt_url,
        },
        "fallback_query": f"{from_city} {to_city} train ticket price {month_year}",
    }


def _build_bus_plan(leg: dict, date_human: str, date_str: str, sites: dict) -> dict:
    from_city = leg["from"]
    to_city = leg["to"]
    month_year = _month_year(date_str)
    flixbus_date = _format_date_flixbus(date_str)

    queries = [
        f"{from_city} to {to_city} bus {date_human} price",
        f"{from_city} to {to_city} FlixBus {date_human}",
    ]

    flixbus = sites.get("flixbus_cities", {})
    from_norm = _normalize_city(from_city)
    to_norm = _normalize_city(to_city)
    from_uuid = flixbus.get(from_city) or flixbus.get(from_norm)
    to_uuid = flixbus.get(to_city) or flixbus.get(to_norm)

    google_q = quote_plus(f"{from_city} to {to_city} bus {date_human} price")
    google_url = f"https://www.google.com/search?q={google_q}"

    if from_uuid and to_uuid:
        primary_url = (
            f"https://shop.flixbus.com/search"
            f"?departureCity={from_uuid}&arrivalCity={to_uuid}&rideDate={flixbus_date}"
        )
        alt_url = google_url
    else:
        primary_url = google_url
        alt_url = google_url

    return {
        "web_search_queries": queries,
        "urls": {
            "primary": primary_url,
            "alt": alt_url,
        },
        "fallback_query": f"{from_city} {to_city} bus ticket {month_year}",
    }


def _build_shuttle_plan(leg: dict, date_human: str, date_str: str, sites: dict) -> dict:
    from_city = leg["from"]
    to_city = leg["to"]
    month_year = _month_year(date_str)

    # Normalize cities for shuttle key lookup
    from_norm = _normalize_city(from_city)
    to_norm = _normalize_city(to_city)

    # Try both directions as the key
    shuttle_carriers = sites.get("shuttle_carriers", {})
    carrier_info = (
        shuttle_carriers.get(f"{from_norm}-{to_norm}")
        or shuttle_carriers.get(f"{from_city}-{to_city}")
        or shuttle_carriers.get(f"{from_norm}-{to_city}")
        or shuttle_carriers.get(f"{from_city}-{to_norm}")
    )

    carrier_name = carrier_info["name"] if carrier_info else "ski shuttle"

    queries = [
        f"{from_city} to {to_city} ski shuttle transfer price {carrier_name}",
        f"{from_city} to {to_city} airport transfer price",
    ]

    google_q = quote_plus(f"{from_city} to {to_city} airport transfer price")
    google_url = f"https://www.google.com/search?q={google_q}"

    if carrier_info:
        primary_url = carrier_info["url"]
        alt_url = google_url
    else:
        primary_url = google_url
        alt_url = google_url

    result = {
        "web_search_queries": queries,
        "urls": {
            "primary": primary_url,
            "alt": alt_url,
        },
        "fallback_query": f"{from_city} {to_city} ski transfer price",
    }
    if carrier_info:
        result["known_carrier"] = {
            "name": carrier_info["name"],
            "url": carrier_info["url"],
        }
    return result


def _build_minimal_plan(leg: dict, date_human: str, mode: str) -> dict:
    """Minimal plan for walk, cable_car, car, ferry — just a Google search query."""
    from_city = leg["from"]
    to_city = leg["to"]
    query = f"{from_city} to {to_city} {mode} {date_human}"
    return {
        "web_search_queries": [query],
        "urls": {},
        "fallback_query": query,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_search_plan(legs: list, depart_date: str, return_date: Optional[str] = None) -> list:
    """Build a list of search plans for every leg of a ski route.

    Args:
        legs: List of leg dicts from the route JSON.
        depart_date: Departure date as 'YYYY-MM-DD'.
        return_date: Optional return date as 'YYYY-MM-DD' (currently reserved
                     for future use — outbound legs always use depart_date).

    Returns:
        List of leg search plans. Each plan contains the original leg's
        ``from``, ``to``, and ``mode`` keys plus ``web_search_queries``,
        ``urls``, and ``fallback_query``.
    """
    sites = _load_travel_sites()
    date_human = _format_date_human(depart_date)
    date_sky = _format_date_skyscanner(depart_date)

    plans = []
    for leg in legs:
        mode = leg.get("mode", "")
        base = {
            "from": leg["from"],
            "to": leg["to"],
            "mode": mode,
        }

        if mode == "flight":
            extra = _build_flight_plan(leg, date_human, date_sky, depart_date, sites)
        elif mode == "train":
            extra = _build_train_plan(leg, date_human, depart_date, sites)
        elif mode == "bus":
            extra = _build_bus_plan(leg, date_human, depart_date, sites)
        elif mode == "shuttle":
            extra = _build_shuttle_plan(leg, date_human, depart_date, sites)
        else:
            # walk, cable_car, car, ferry — minimal
            extra = _build_minimal_plan(leg, date_human, mode)

        plans.append({**base, **extra})

    return plans
