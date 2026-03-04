"""Route lookup and real-time generation via Claude API."""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional

# In-memory cache for runtime-generated routes
_runtime_cache: Dict[str, dict] = {}


def _cache_key(origin: str, resort: str) -> str:
    """Build cache key: '{origin_lower}::{resort_lower}'."""
    return f"{origin.lower().strip()}::{resort.lower().strip()}"


def load_route_cache(data_dir: Path) -> dict:
    """Load pre-generated route cache from routes_london_all.json."""
    path = data_dir / "routes_london_all.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def lookup_routes(origin: str, resort_name: str, data_dir: Path) -> Optional[dict]:
    """
    Look up routes for origin→resort.

    Priority:
    1. Runtime cache (previously generated in this session)
    2. Pre-generated file cache (routes_london_all.json)
    3. None (caller should generate via Claude API)
    """
    key = _cache_key(origin, resort_name)

    # Runtime cache
    if key in _runtime_cache:
        return _runtime_cache[key]

    # File cache
    file_cache = load_route_cache(data_dir)
    if key in file_cache:
        return file_cache[key]

    return None


def generate_routes(origin: str, resort_name: str) -> dict:
    """
    Call Claude API to generate routes for a non-cached origin→resort pair.
    Caches the result in runtime cache.
    Returns {"routes": [...]} dict.
    """
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "error": "ANTHROPIC_API_KEY not set. Cannot generate routes for non-London origins.",
            "routes": [],
        }

    system_prompt = """You are a European ski travel route planner. Given an origin city and a ski resort, generate ALL viable multi-modal transport routes.

RULES:
- Generate 5-8 routes with flights, trains, buses, shuttles, creative combos
- Include budget (Ryanair, easyJet, FlixBus) and premium (BA, SWISS, Eurostar)
- Consider ALL nearby airports including secondary ones
- Route names in Chinese describing HOW you travel, not carrier names
- Do NOT invent prices, categorize as budget/mid/premium
- Include Eurostar Snow train if relevant (London→Lille→Alps, Saturdays Dec-Mar)
- Include overnight bus/train if saves accommodation

Respond ONLY valid JSON:
{"routes":[{"id":"R1","name":"中文路线名","name_en":"English name","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[{"from":"...","to":"...","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":"实用贴士"}]}]}

TAGS: 最快, 最便宜, 最热门, 最舒适, 风景最美, 夜车省住宿, 纯火车, 仅限冬季, 需要转车多, 创意路线"""

    user_prompt = f"Origin: {origin}\nDestination: {resort_name}\nGenerate all viable routes. Chinese names. JSON only."

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-sonnet-4-5-20250514",
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = "".join(
        block.text for block in response.content if hasattr(block, "text")
    )
    clean = text.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(clean)
    except json.JSONDecodeError:
        return {"error": f"Failed to parse Claude response: {clean[:200]}", "routes": []}

    # Cache in runtime
    key = _cache_key(origin, resort_name)
    _runtime_cache[key] = data

    return data


def select_routes(routes: list[dict], ids: list[str]) -> list[dict]:
    """Pick specific routes by their id field (e.g. ['R1', 'R3', 'R5'])."""
    id_set = {i.upper() for i in ids}
    return [r for r in routes if r.get("id", "").upper() in id_set]
