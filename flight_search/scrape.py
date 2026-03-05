"""Scrape Google Flights for nonstop flight data using Playwright.

Replaces the unreliable LLM-driven browser search with deterministic
code that clicks "Show more", expands flight details, and extracts
complete flight data.
"""

import os
import re
from datetime import datetime, timezone
from typing import Optional, Tuple
from urllib.parse import quote_plus

from .formatter import LCC_NAMES

# ── Month names for URL building ─────────────────────────────────
_MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# ── Airlines without free carry-on (basic fare) ─────────────────
_NO_CARRYON_AIRLINES = {"ryanair", "wizz air", "wizzair"}


def build_search_url(origin: str, destination: str, date: str) -> str:
    """Build Google Flights one-way nonstop search URL.

    Args:
        origin: City name (e.g. "London")
        destination: City name (e.g. "Venice")
        date: YYYY-MM-DD format
    """
    parts = date.split("-")
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    date_human = f"{day} {_MONTH_NAMES[month]} {year}"
    q = quote_plus(f"{origin} to {destination} {date_human} one way nonstop")
    return f"https://www.google.com/travel/flights?q={q}&hl=en"


def _detect_chromium(custom_path=None):
    # type: (Optional[str]) -> Optional[str]
    """Find Chromium binary path. Returns None to let Playwright auto-detect."""
    if custom_path and os.path.isfile(custom_path):
        return custom_path

    env_path = os.environ.get("CHROMIUM_PATH")
    if env_path and os.path.isfile(env_path):
        return env_path

    # Docker container symlink
    if os.path.isfile("/usr/bin/chromium"):
        return "/usr/bin/chromium"

    return None


def _parse_time_from_aria(aria_label: str) -> str:
    """Parse time from aria-label like 'Departure time: 6:15 AM' → '06:15'.

    Handles AM/PM conversion:
    - 'Departure time: 8:55 PM.' → '20:55'
    - 'Arrival time: 12:05 AM on Monday, March 30.' → '00:05'
    """
    m = re.search(r"(\d{1,2}):(\d{2})\s*(AM|PM)", aria_label, re.IGNORECASE)
    if not m:
        return ""
    hour = int(m.group(1))
    minute = int(m.group(2))
    ampm = m.group(3).upper()

    if ampm == "PM" and hour != 12:
        hour += 12
    elif ampm == "AM" and hour == 12:
        hour = 0

    return f"{hour:02d}:{minute:02d}"


def _parse_price_text(text: str) -> Tuple[int, str]:
    """Parse price text like '£45' → (45, '£') or '€89' → (89, '€')."""
    text = text.strip().replace(",", "")
    currency = "£"
    if "€" in text:
        currency = "€"
    elif "$" in text:
        currency = "$"

    m = re.search(r"[\d]+", text)
    if m:
        return int(m.group()), currency
    return 0, currency


def _clean_airline(text: str) -> str:
    """Clean airline name: remove 'Operated by ...' suffix."""
    if "Operated by" in text:
        return text.split("Operated by")[0].strip()
    return text.strip()


def _infer_type(airline: str) -> str:
    """Return 'lcc' or 'full_service' based on airline name."""
    if airline.strip().lower() in LCC_NAMES:
        return "lcc"
    return "full_service"


def _infer_carryon(airline: str) -> bool:
    """Infer carry-on from airline. True unless known no-carryon LCC."""
    return airline.strip().lower() not in _NO_CARRYON_AIRLINES


def scrape_flights(
    origin: str,
    destination: str,
    date: str,
    headless: bool = True,
    timeout: int = 30,
    chromium_path=None,  # type: Optional[str]
    max_results: int = 0,
) -> dict:
    """Scrape Google Flights for nonstop flights.

    Returns dict with 'status', 'flights', 'flight_count', 'search_url'.
    max_results=0 means no limit (return all nonstop flights found).
    """
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    url = build_search_url(origin, destination, date)

    # Parse date for output
    parts = date.split("-")
    date_short = f"{int(parts[1])}/{int(parts[2])}"

    result = {
        "status": "ok",
        "origin": origin,
        "destination": destination,
        "date": date_short,
        "flights": [],
        "flight_count": 0,
        "search_url": url,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }

    exe = _detect_chromium(chromium_path)
    launch_args = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]

    try:
        with sync_playwright() as p:
            launch_kwargs = {
                "headless": headless,
                "args": launch_args,
            }
            if exe:
                launch_kwargs["executable_path"] = exe

            browser = p.chromium.launch(**launch_kwargs)
            try:
                context = browser.new_context(
                    viewport={"width": 1280, "height": 800},
                    locale="en-GB",
                )
                page = context.new_page()

                # Navigate
                page.goto(url, wait_until="domcontentloaded", timeout=timeout * 1000)
                page.wait_for_timeout(2000)

                # Dismiss cookie consent (Google GDPR dialog)
                # After clicking, Google reloads the page with flight results
                try:
                    btn = page.locator("button:has-text('Accept all')").first
                    btn.click(timeout=3000)
                    page.wait_for_load_state("domcontentloaded", timeout=10000)
                    page.wait_for_timeout(3000)
                except Exception:
                    # No consent dialog or already accepted
                    page.wait_for_timeout(3000)

                # Wait for flight results
                try:
                    page.wait_for_selector("li.pIav2d", timeout=15000)
                except PWTimeout:
                    # Check for CAPTCHA
                    if page.query_selector("iframe[src*='recaptcha']"):
                        result["status"] = "error"
                        result["error"] = "captcha"
                        result["message"] = "Google CAPTCHA detected"
                        return result
                    # Check for no results
                    content = page.content()
                    if "No flights found" in content or "no results" in content.lower():
                        result["message"] = "No nonstop flights found"
                        return result
                    result["status"] = "error"
                    result["error"] = "timeout"
                    result["message"] = f"Flight results did not load within {timeout}s"
                    return result

                # Click "Show more flights" to expand full list
                for _ in range(5):
                    btn = page.query_selector('button[aria-label*="more flights"]')
                    if not btn:
                        btn = page.query_selector('button:has-text("more flights")')
                    if not btn:
                        break
                    btn.click()
                    page.wait_for_timeout(2000)

                page.wait_for_timeout(1000)

                # Get all flight rows
                rows = page.query_selector_all("li.pIav2d")
                flights = []
                seen = set()  # dedupe by (dep_time, dep_airport, airline)

                for row in rows:
                    if max_results and len(flights) >= max_results:
                        break
                    flight = _extract_one(page, row)
                    if flight:
                        key = (flight["departure_time"], flight["departure_airport"], flight["airline"])
                        if key in seen:
                            continue
                        seen.add(key)
                        flights.append(flight)

                result["flights"] = flights
                result["flight_count"] = len(flights)

            finally:
                browser.close()

    except Exception as e:
        result["status"] = "error"
        result["error"] = "browser_error"
        result["message"] = str(e)

    return result


def _extract_one(page, row):
    # type: (...) -> Optional[dict]
    """Extract data from a single flight row element."""
    try:
        # ── Must be nonstop — skip if not confirmed ──
        is_nonstop = False
        stops_el = row.query_selector("span.rGRiKd")
        if stops_el:
            stops_text = stops_el.text_content().strip().lower()
            if "nonstop" in stops_text or "non-stop" in stops_text:
                is_nonstop = True
        if not is_nonstop:
            # Fallback: check aria-label
            nonstop_aria = row.query_selector('[aria-label*="Nonstop"]')
            if nonstop_aria:
                is_nonstop = True
        if not is_nonstop:
            return None

        # ── Departure time (aria-label based — stable) ──
        dep_el = row.query_selector('span[aria-label^="Departure time"]')
        dep_time = ""
        if dep_el:
            dep_time = _parse_time_from_aria(dep_el.get_attribute("aria-label") or "")
        if not dep_time:
            return None

        # ── Arrival time ──
        arr_el = row.query_selector('span[aria-label^="Arrival time"]')
        arr_time = ""
        next_day = False
        if arr_el:
            arr_time = _parse_time_from_aria(arr_el.get_attribute("aria-label") or "")
            # +1 marker shown in the text content (e.g. "12:05 AM+1")
            arr_text = arr_el.text_content() or ""
            if "+1" in arr_text:
                next_day = True
            # Also check aria-label for "on Monday" etc. (different day = next day)
            arr_aria = arr_el.get_attribute("aria-label") or ""
            if " on " in arr_aria and "Arrival" in arr_aria:
                next_day = True

        if next_day and arr_time:
            arr_time = arr_time + "+1"

        # ── Airline (CSS class — may change) ──
        airline = ""
        airline_el = row.query_selector("div.sSHqwe.tPgKwe.ogfYpf")
        if airline_el:
            airline = _clean_airline(airline_el.text_content())

        # ── Airport codes (find 3-letter uppercase spans) ──
        dep_airport = ""
        arr_airport = ""
        seen_codes = []
        for span in row.query_selector_all("span"):
            text = span.text_content().strip()
            if re.match(r"^[A-Z]{3}$", text) and text not in seen_codes:
                seen_codes.append(text)
        if len(seen_codes) >= 2:
            dep_airport = seen_codes[0]
            arr_airport = seen_codes[1]

        # ── Price ──
        price = 0
        currency = "£"
        price_el = row.query_selector("div.FpEdX span")
        if price_el:
            price, currency = _parse_price_text(price_el.text_content())
        if not price:
            return None

        # ── Carry-on (from DOM — "overhead bin" button means NO carry-on) ──
        carryon_restriction = row.query_selector('[aria-label*="overhead bin"]')
        has_carryon = carryon_restriction is None

        # ── Flight number (expand details) ──
        flight_number = _extract_flight_number(page, row)

        return {
            "flight_number": flight_number,
            "airline": airline,
            "type": _infer_type(airline),
            "price": price,
            "currency": currency,
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "departure_airport": dep_airport,
            "arrival_airport": arr_airport,
            "carryon": has_carryon,
        }

    except Exception:
        return None


def _extract_flight_number(page, row) -> str:
    """Click 'Flight details' button, find flight number, collapse."""
    try:
        detail_btn = row.query_selector('button[aria-label*="Flight details"]')
        if not detail_btn:
            return ""

        detail_btn.click()
        page.wait_for_timeout(800)

        # Flight number appears in span.Xsgmwe after expansion
        # Pattern: "W4 6748", "BA 606", "FR 794"
        fn_spans = page.query_selector_all("span.Xsgmwe")
        flight_number = ""
        for fn_span in fn_spans:
            fn_text = fn_span.text_content().strip()
            if re.match(r"^[A-Z0-9]{2}\s+\d{1,5}$", fn_text):
                flight_number = fn_text
                break

        # Collapse details (click the button again)
        try:
            detail_btn = row.query_selector('button[aria-label*="Flight details"]')
            if detail_btn:
                detail_btn.click()
                page.wait_for_timeout(300)
        except Exception:
            pass

        return flight_number

    except Exception:
        return ""
