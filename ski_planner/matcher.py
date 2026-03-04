"""Resort fuzzy matching — 雪场名称模糊匹配"""

import json
import unicodedata
from pathlib import Path
from typing import List


def strip_accents(s: str) -> str:
    """Remove accent marks for matching (e.g. Méribel → Meribel)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def _normalize(s: str) -> str:
    """Normalize for matching: strip accents, lowercase, remove punctuation."""
    s = strip_accents(s.lower().strip())
    # Remove periods and apostrophes (st. → st, d' → d)
    s = s.replace(".", "").replace("'", "").replace("'", "")
    return s


def load_resorts(data_dir: Path) -> List[dict]:
    """Load all 43 resorts from ski_resorts_v2.json, flattened with country info."""
    with open(data_dir / "ski_resorts_v2.json", encoding="utf-8") as f:
        data = json.load(f)
    resorts = []
    for country in data["countries"]:
        for resort in country["resorts"]:
            r = dict(resort)
            r["country"] = country["country"]
            r["country_code"] = country["country_code"]
            resorts.append(r)
    return resorts


def match_resort(query: str, resorts: List[dict]) -> List[dict]:
    """
    Fuzzy match a resort name against the 43-resort list.

    Matching priority:
    1. Exact match (accent/case insensitive)
    2. Prefix match
    3. Substring match
    4. Word-start match
    5. Ski area name match

    Returns list of matching resorts (may be 0, 1, or multiple).
    """
    query_clean = _normalize(query)
    if not query_clean:
        return []

    # 1. Exact match
    for r in resorts:
        if _normalize(r["name"]) == query_clean:
            return [r]

    # 2. Prefix match
    prefix = [r for r in resorts if _normalize(r["name"]).startswith(query_clean)]
    if len(prefix) == 1:
        return prefix
    if prefix:
        return prefix

    # 3. Substring match
    sub = [r for r in resorts if query_clean in _normalize(r["name"])]
    if sub:
        return sub

    # 4. Word-start match (any word in the name starts with query)
    word = [
        r
        for r in resorts
        if any(
            w.startswith(query_clean)
            for w in _normalize(r["name"]).replace("-", " ").split()
        )
    ]
    if word:
        return word

    # 5. Ski area match
    area = [
        r
        for r in resorts
        if query_clean in _normalize(r.get("ski_area", ""))
    ]
    if area:
        return area

    return []
