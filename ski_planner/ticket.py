"""Lift pass and rental info for ski resorts."""

import math
import json
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

from .matcher import load_resorts, _normalize

# Module-level cache
_ticket_data: Optional[dict] = None


def _parse_hhmm(time_str: str) -> int:
    """Convert 'HH:MM' to minutes since midnight. Returns -1 on failure."""
    try:
        parts = time_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError, AttributeError):
        return -1


def _date_range_label(arrival_date, days):
    """Return 'March 2026' style label from arrival date for search hints."""
    if not arrival_date:
        return ""
    try:
        d = date.fromisoformat(arrival_date)
        end = d + timedelta(days=max(0, days - 1))
        if d.month == end.month:
            return d.strftime("%B %Y")
        return f"{d.strftime('%B')}-{end.strftime('%B %Y')}"
    except (ValueError, TypeError):
        return ""


def load_ticket_data(data_dir: Path) -> dict:
    """Load ticket_data.json from data_dir, cached in module-level variable.

    Returns empty dict if the file does not exist.
    """
    global _ticket_data
    if _ticket_data is not None:
        return _ticket_data

    path = data_dir / "ticket_data.json"
    if not path.exists():
        _ticket_data = {}
        return _ticket_data

    try:
        with open(path, encoding="utf-8") as f:
            _ticket_data = json.load(f)
    except (json.JSONDecodeError, OSError):
        _ticket_data = {}

    return _ticket_data


def get_resort_ticket_info(resort_name: str, data_dir: Path) -> dict:
    """Look up a resort in ticket_data.json.

    If found (curated), returns the data with ``"data_quality": "curated"``.
    If not found, builds a basic fallback using ski_resorts_v2.json and returns
    with ``"data_quality": "basic"``.
    """
    data = load_ticket_data(data_dir)

    # Try to find an exact or case-insensitive match inside ticket_data["resorts"]
    resorts_map = data.get("resorts", {})
    resort_name_norm = _normalize(resort_name)

    matched_key = None
    for key in resorts_map:
        if _normalize(key) == resort_name_norm:
            matched_key = key
            break

    if matched_key is not None:
        entry = dict(resorts_map[matched_key])
        entry["data_quality"] = "curated"
        return entry

    # --- Fallback: build basic info from ski_resorts_v2.json ---
    all_resorts = load_resorts(data_dir)
    resort_rec = None
    for r in all_resorts:
        if _normalize(r["name"]) == resort_name_norm:
            resort_rec = r
            break
    # If still nothing, take the first entry whose name contains the query
    if resort_rec is None:
        for r in all_resorts:
            if resort_name_norm in _normalize(r["name"]):
                resort_rec = r
                break

    if resort_rec is None:
        # Cannot find anything — return a minimal shell
        return {
            "data_quality": "basic",
            "ski_areas": [],
            "pass_systems": [],
            "rental": {
                "shops": [],
                "search_hints": [f"{resort_name} ski rental 2025/26"],
                "airline_ski_bag": "Check airline website for ski equipment fees",
            },
            "night_skiing": None,
            "typical_hours": {},
        }

    ski_area = resort_rec.get("ski_area", resort_name)

    return {
        "data_quality": "basic",
        "ski_areas": [ski_area],
        "pass_systems": [],
        "rental": {
            "shops": [],
            "search_hints": [
                f"{resort_name} ski rental 2025/26",
                f"{ski_area} ski hire shop",
            ],
            "airline_ski_bag": "Check airline website for ski equipment fees",
        },
        "night_skiing": None,
        "typical_hours": {},
    }


def calculate_ski_days(
    arrival_date: Optional[str],
    departure_date: Optional[str] = None,
    trip_days: int = 7,
    arrival_time: str = "14:00",
    departure_time: str = "10:00",
    typical_hours: Optional[dict] = None,
) -> dict:
    """Calculate skiing days given arrival/departure dates and times.

    Args:
        arrival_date: ISO date string (YYYY-MM-DD) or None.
        departure_date: ISO date string (YYYY-MM-DD) or None.
        trip_days: Total days of the trip (used if departure_date not provided).
        arrival_time: Arrival time as 'HH:MM' string.
        departure_time: Departure time as 'HH:MM' string.
        typical_hours: Dict with first_lift, last_lift, half_day_start keys (HH:MM strings).

    Returns a dict with breakdown and pass recommendation.
    """
    if typical_hours is None:
        typical_hours = {}

    # Parse typical_hours defaults
    first_lift = _parse_hhmm(typical_hours.get("first_lift", "08:30"))
    last_lift = _parse_hhmm(typical_hours.get("last_lift", "16:30"))
    half_day_start = _parse_hhmm(typical_hours.get("half_day_start", "12:30"))

    if first_lift < 0:
        first_lift = 8 * 60 + 30
    if last_lift < 0:
        last_lift = 16 * 60 + 30
    if half_day_start < 0:
        half_day_start = 12 * 60 + 30

    # Resolve trip_days from dates if both provided
    if arrival_date and departure_date:
        try:
            d1 = date.fromisoformat(arrival_date)
            d2 = date.fromisoformat(departure_date)
            trip_days = (d2 - d1).days + 1
        except (ValueError, TypeError):
            pass

    if trip_days <= 0:
        return {
            "arrival_date": arrival_date,
            "departure_date": departure_date,
            "trip_days": trip_days,
            "arrival_time": arrival_time,
            "departure_time": departure_time,
            "full_ski_days": 0,
            "half_days": 0,
            "arrival_day": "none",
            "departure_day": "none",
            "total_ski_equivalent": 0.0,
            "recommended_pass": "no pass needed",
            "alternative": None,
        }

    # Parse arrival/departure times
    arr_mins = _parse_hhmm(arrival_time)
    if arr_mins < 0:
        arr_mins = 14 * 60  # default 14:00

    dep_mins = _parse_hhmm(departure_time)
    if dep_mins < 0:
        dep_mins = 10 * 60  # default 10:00

    # Classify arrival day
    if arr_mins <= half_day_start:
        arrival_day = "full"
    elif arr_mins < last_lift:
        arrival_day = "half_day_pm"
    else:
        arrival_day = "none"

    # Classify departure day (subtract 2h buffer from departure_time)
    effective_end = dep_mins - 2 * 60
    if effective_end > half_day_start:
        departure_day = "full"
    elif first_lift <= effective_end <= half_day_start:
        departure_day = "half_day_am"
    else:
        departure_day = "none"

    def _day_contribution(classification):
        if classification == "full":
            return 1, 0
        elif classification in ("half_day_pm", "half_day_am"):
            return 0, 1
        else:
            return 0, 0

    if trip_days == 1:
        # Take the worse of arrival/departure classification
        order = {"full": 2, "half_day_pm": 1, "half_day_am": 1, "none": 0}
        arr_rank = order.get(arrival_day, 0)
        dep_rank = order.get(departure_day, 0)
        effective_day = arrival_day if arr_rank <= dep_rank else departure_day
        full_ski_days, half_days = _day_contribution(effective_day)
        # For single day, report arrival_day as the effective classification
        arrival_day = effective_day
        departure_day = "none"
    else:
        # trip_days >= 2
        middle_full = max(0, trip_days - 2)

        arr_full, arr_half = _day_contribution(arrival_day)
        dep_full, dep_half = _day_contribution(departure_day)

        full_ski_days = middle_full + arr_full + dep_full
        half_days = arr_half + dep_half

    total_ski_equivalent = full_ski_days + 0.5 * half_days

    # Pass recommendation
    if total_ski_equivalent <= 0:
        recommended_pass = "no pass needed"
        alternative = None
    elif total_ski_equivalent <= 0.5:
        recommended_pass = "half-day pass"
        alternative = None
    elif total_ski_equivalent <= 1.0:
        recommended_pass = "day pass"
        alternative = "half-day pass (if arriving late)"
    elif total_ski_equivalent <= 2.0:
        recommended_pass = "2-day pass or day passes"
        alternative = "individual day passes (more flexible)"
    else:
        days_ceil = math.ceil(total_ski_equivalent)
        recommended_pass = f"{days_ceil}-day pass"
        shorter = days_ceil - 1
        if shorter >= 1:
            alternative = f"{shorter}-day pass + 1 half-day supplement (if arriving late)"
        else:
            alternative = None

    return {
        "arrival_date": arrival_date,
        "departure_date": departure_date,
        "trip_days": trip_days,
        "arrival_time": arrival_time,
        "departure_time": departure_time,
        "full_ski_days": full_ski_days,
        "half_days": half_days,
        "arrival_day": arrival_day,
        "departure_day": departure_day,
        "total_ski_equivalent": total_ski_equivalent,
        "recommended_pass": recommended_pass,
        "alternative": alternative,
    }


def build_ticket_response(
    resort_name: str,
    data_dir: Path,
    dates: Optional[str] = None,
    departure_date: Optional[str] = None,
    days: int = 7,
    adults: int = 2,
    children: int = 0,
    arrival_time: str = "14:00",
    departure_time: str = "10:00",
) -> dict:
    """Assemble the full ticket-info JSON response for a resort.

    Args:
        resort_name: Resolved resort name (already matched).
        data_dir: Path to the data directory (same as DATA_DIR in cli.py).
        dates: Arrival date as YYYY-MM-DD string or None.
        departure_date: Departure date as YYYY-MM-DD string or None.
        days: Total trip length in days (used if departure_date not provided).
        adults: Number of adult skiers.
        children: Number of child skiers.
        arrival_time: Arrival time as 'HH:MM' string.
        departure_time: Departure time as 'HH:MM' string.

    Returns a dict suitable for JSON output.
    """
    resort_data = get_resort_ticket_info(resort_name, data_dir)
    is_curated = resort_data.get("data_quality") == "curated"

    typical_hours = resort_data.get("typical_hours", {})

    ski_day_calc = calculate_ski_days(
        dates,
        departure_date,
        days,
        arrival_time,
        departure_time,
        typical_hours,
    )

    # Date label for search hints
    date_label = _date_range_label(dates, days)

    # Build rental section — curated data uses "rental_shops" + "airline_ski_bag" as separate keys
    if is_curated:
        rental_shops = resort_data.get("rental_shops", [])
        airline_ski_bag = resort_data.get("airline_ski_bag", "Check airline website for ski equipment fees")
        shop_names = [s.get("name", "") for s in rental_shops]
        if date_label:
            rental_hints = [f"{name} ski rental prices {date_label}" for name in shop_names if name]
        else:
            rental_hints = [f"{name} ski rental prices 2025/26" for name in shop_names if name]
        if not rental_hints:
            rental_hints = [f"{resort_name} ski rental {date_label}" if date_label else f"{resort_name} ski rental 2025/26"]
        rental_section = {
            "shops": rental_shops,
            "search_hints": rental_hints,
            "airline_ski_bag": airline_ski_bag,
        }
    else:
        rental_section = resort_data.get("rental", {
            "shops": [],
            "search_hints": [f"{resort_name} ski rental {date_label}" if date_label else f"{resort_name} ski rental 2025/26"],
            "airline_ski_bag": "Check airline website for ski equipment fees",
        })

    # Override pass system search_hint with date-aware version
    pass_systems = resort_data.get("pass_systems", [])
    for ps in pass_systems:
        ps_name = ps.get("name", resort_name)
        if date_label:
            ps["search_hint"] = f"{ps_name} price {date_label} adult"
        else:
            ps["search_hint"] = f"{ps_name} price 2025/26 adult"

    # Build group search hints
    if date_label:
        group_hints = [f"{resort_name} adult ski pass price {date_label}"]
        if children > 0:
            group_hints.append(f"{resort_name} child ski pass price {date_label}")
        if adults + children >= 4:
            group_hints.append(f"{resort_name} group ski pass discount {date_label}")
    else:
        group_hints = [f"{resort_name} adult ski pass price 2025/26"]
        if children > 0:
            group_hints.append(f"{resort_name} child ski pass price 2025/26")
        if adults + children >= 4:
            group_hints.append(f"{resort_name} group ski pass discount 2025/26")

    # Night skiing — curated uses "night_skiing_available", basic uses "night_skiing"
    night_skiing = resort_data.get("night_skiing_available", resort_data.get("night_skiing", False))

    return {
        "status": "ok",
        "resort": resort_name,
        "data_quality": resort_data.get("data_quality", "basic"),
        "ski_day_calculation": ski_day_calc,
        "ski_areas": resort_data.get("ski_areas", []),
        "pass_systems": pass_systems,
        "rental": rental_section,
        "night_skiing": night_skiing,
        "typical_hours": typical_hours,
        "group": {
            "adults": adults,
            "children": children,
            "search_hints": group_hints,
        },
    }
