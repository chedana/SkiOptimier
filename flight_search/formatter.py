"""Flight sorting and formatting for Discord display.

LLM extracts raw flight data from Google Flights → this module sorts
deterministically and formats for Discord. No LLM judgment needed.
"""

import re

# ── Emoji numbers ──────────────────────────────────────────────
EMOJI_NUMS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"]

# ── Airline short names ────────────────────────────────────────
AIRLINE_SHORT = {
    "british airways": "BA",
    "ba": "BA",
    "ryanair": "Ryanair",
    "easyjet": "easyJet",
    "wizz air": "Wizz Air",
    "wizzair": "Wizz Air",
    "swiss": "SWISS",
    "swiss international air lines": "SWISS",
    "air france": "Air France",
    "lufthansa": "Lufthansa",
    "klm": "KLM",
    "vueling": "Vueling",
    "transavia": "Transavia",
    "jet2": "Jet2",
    "norwegian": "Norwegian",
    "tap portugal": "TAP",
    "tap air portugal": "TAP",
    "iberia": "Iberia",
    "aer lingus": "Aer Lingus",
    "eurowings": "Eurowings",
    "volotea": "Volotea",
}

# ── LCC (low-cost carrier) set ─────────────────────────────────
LCC_NAMES = {
    "ryanair", "easyjet", "wizz air", "wizzair", "vueling", "transavia",
    "jet2", "norwegian", "eurowings", "volotea",
}

# ── Direction labels ───────────────────────────────────────────
DIR_LABELS = {
    "outbound": "去程",
    "return": "回程",
}
DIR_ICONS = {
    "outbound": "✈️",
    "return": "✈️",
}


def _parse_time(t: str) -> float:
    """Parse time string to float hours. Handles '+1' next-day marker.

    '17:25' → 17.417
    '00:05+1' → 24.083  (next day = after midnight)
    """
    next_day = False
    t = t.strip()
    if "+1" in t:
        next_day = True
        t = t.replace("+1", "").strip()
    parts = t.split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    val = h + m / 60.0
    if next_day:
        val += 24.0
    return val


def _airline_short(airline: str) -> str:
    """Get short display name for airline."""
    key = airline.strip().lower()
    return AIRLINE_SHORT.get(key, airline)


def _airline_type_label(airline: str, type_str: str) -> str:
    """Return '廉航' or '全服务' based on type field or airline name."""
    if type_str and type_str.lower() in ("lcc", "low_cost", "budget"):
        return "廉航"
    if type_str and type_str.lower() in ("full_service", "full", "legacy"):
        return "全服务"
    # Fallback: check airline name
    if airline.strip().lower() in LCC_NAMES:
        return "廉航"
    return "全服务"


def parse_preference(text: str, direction: str):
    """Parse preference text into sort/filter rules.

    Returns dict: {
        "sort_key": "arrival_time" | "departure_time" | "price",
        "sort_order": "asc" | "desc",
        "filters": [{"type": "time_range", "field": ..., "min": ..., "max": ...}, ...]
    }
    """
    text = (text or "").strip().lower()
    filters = []
    sort_key = "price"  # default
    sort_order = "asc"  # default

    # ── Filters ──
    if re.search(r"不要红眼|no\s*red.?eye", text):
        filters.append({"type": "time_range", "field": "departure_time", "min": 6.0, "max": 22.0})

    if re.search(r"全服务|full.?service", text):
        filters.append({"type": "carrier_type", "value": "full_service"})

    if direction == "outbound":
        # 上午到
        m = re.search(r"上午到|上午|morning", text)
        if m:
            filters.append({"type": "time_range", "field": "arrival_time", "max": 12.0})

        # N点前到
        m = re.search(r"(\d{1,2})[点时]前到", text)
        if m:
            filters.append({"type": "time_range", "field": "arrival_time", "max": float(m.group(1))})

    if direction == "return":
        if re.search(r"下午走|下午出发|afternoon", text):
            filters.append({"type": "time_range", "field": "departure_time", "min": 12.0, "max": 18.0})

    # ── Sort key ──
    has_early_arrive = bool(re.search(r"早到|早点到|早些到|early.?arriv", text))
    has_late_depart = bool(re.search(r"晚回|晚点走|晚走|晚些走|晚出发|late.?depart|late.?return", text))
    has_cheap = bool(re.search(r"最便宜|便宜|cheapest|cheap|省钱", text))

    if direction == "outbound":
        if has_early_arrive:
            sort_key = "arrival_time"
            sort_order = "asc"
        elif has_cheap:
            sort_key = "price"
            sort_order = "asc"
        # default: price asc
    elif direction == "return":
        if has_late_depart:
            sort_key = "departure_time"
            sort_order = "desc"
        elif has_cheap:
            sort_key = "price"
            sort_order = "asc"
        # default: price asc

    return {"sort_key": sort_key, "sort_order": sort_order, "filters": filters}


def filter_flights(flights: list, filters: list) -> list:
    """Apply filters to flight list."""
    result = flights
    for f in filters:
        if f["type"] == "time_range":
            field = f["field"]
            min_val = f.get("min", 0)
            max_val = f.get("max", 48)
            result = [
                fl for fl in result
                if min_val <= _parse_time(fl.get(field, "12:00")) <= max_val
            ]
        elif f["type"] == "carrier_type":
            val = f["value"]
            if val == "full_service":
                result = [
                    fl for fl in result
                    if fl.get("airline", "").strip().lower() not in LCC_NAMES
                    and fl.get("type", "").lower() not in ("lcc", "low_cost", "budget")
                ]
    # If filtering removed too many, return original with note
    if len(result) < 2 and len(flights) >= 2:
        # Mark that we relaxed filters
        for fl in flights:
            if fl not in result:
                fl["_relaxed"] = True
        return flights
    return result


def sort_flights(flights: list, sort_key: str, sort_order: str) -> list:
    """Sort flights deterministically."""
    def key_fn(fl):
        if sort_key in ("arrival_time", "departure_time"):
            return _parse_time(fl.get(sort_key, "12:00"))
        elif sort_key == "price":
            return fl.get("price", 9999)
        return 0

    reverse = sort_order == "desc"
    return sorted(flights, key=key_fn, reverse=reverse)


def _sort_description(sort_key: str, sort_order: str, direction: str) -> str:
    """Human-readable sort description for header."""
    if sort_key == "arrival_time" and sort_order == "asc":
        return "按到达时间排序"
    if sort_key == "departure_time" and sort_order == "desc":
        return "晚出发优先"
    if sort_key == "departure_time" and sort_order == "asc":
        return "按出发时间排序"
    if sort_key == "price" and sort_order == "asc":
        return "按价格排序"
    return ""


def format_flights(data: dict) -> str:
    """Main entry point. Takes full JSON input, returns formatted Discord text.

    Input keys: direction, date, origin, destination, preference, flights[]
    """
    direction = data.get("direction", "outbound")
    date = data.get("date", "")
    origin = data.get("origin", "")
    destination = data.get("destination", "")
    preference = data.get("preference", "")
    flights = data.get("flights", [])

    if not flights:
        dir_label = DIR_LABELS.get(direction, direction)
        return f"✈️ {dir_label} {date}: {origin} → {destination}（单程）\n\n暂无直飞航班"

    # Parse preference → sort/filter rules
    pref = parse_preference(preference, direction)

    # Filter
    filtered = filter_flights(flights, pref["filters"])

    # Sort
    sorted_flights = sort_flights(filtered, pref["sort_key"], pref["sort_order"])

    # Build header
    dir_label = DIR_LABELS.get(direction, direction)
    sort_desc = _sort_description(pref["sort_key"], pref["sort_order"], direction)
    header = f"✈️ {dir_label} {date}: {origin} → {destination}（单程，{sort_desc}）"

    # Build flight lines
    lines = [header, ""]
    for i, fl in enumerate(sorted_flights):
        if i >= 8:
            break
        emoji = EMOJI_NUMS[i] if i < len(EMOJI_NUMS) else f"{i+1}."
        star = " ⭐" if i < 2 else ""

        # Flight number
        fn = fl.get("flight_number", "").strip()
        airline = fl.get("airline", "").strip()
        if not fn:
            fn = _airline_short(airline)

        # Airline type
        type_label = _airline_type_label(airline, fl.get("type", ""))
        short_name = _airline_short(airline)

        # Price
        currency = fl.get("currency", "£")
        price = fl.get("price", "?")

        # Line 1: number + star + flight_number · airline type · price
        line1 = f"{emoji}{star} {fn} · {short_name} {type_label} · {currency}{price}"

        # Line 2: times + airports + carryon
        dep_time = fl.get("departure_time", "?")
        arr_time = fl.get("arrival_time", "?")
        dep_apt = fl.get("departure_airport", "?")
        arr_apt = fl.get("arrival_airport", "?")
        carryon = fl.get("carryon", False)
        carryon_icon = "✅" if carryon else "❌"

        relaxed = " ⚠️已放宽筛选" if fl.get("_relaxed") else ""
        line2 = f"{dep_time} {dep_apt} → {arr_time} {arr_apt} · 🧳 carry-on {carryon_icon}{relaxed}"

        lines.append(line1)
        lines.append(line2)
        lines.append("")

    # Footer
    dir_emoji = "🛫" if direction == "outbound" else "🛬"
    lines.append(f"选一个航班编号（1-{min(len(sorted_flights), 8)}）{dir_emoji}")

    return "\n".join(lines)
