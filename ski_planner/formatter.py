"""Format route data for display — matches ski_route_planner.jsx UI layout."""

MODE_ICONS = {
    "flight": "✈️",
    "train": "🚆",
    "bus": "🚌",
    "shuttle": "🚐",
    "car": "🚗",
    "ferry": "⛴️",
    "cable_car": "🚡",
    "walk": "🚶",
}

MODE_CN = {
    "flight": "飞行",
    "train": "火车",
    "bus": "巴士",
    "shuttle": "接驳车",
    "car": "自驾",
    "ferry": "渡轮",
    "cable_car": "缆车",
    "walk": "步行",
}

PRICE_DISPLAY = {
    "budget": "💰 经济",
    "mid": "💎 中档",
    "premium": "👑 高端",
}

COMPLEXITY_CN = {
    "simple": "简单",
    "moderate": "适中",
    "complex": "复杂",
}

NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]


def _build_city_chain(legs):
    """Build city chain matching JSX RouteCard: London ―✈️― Geneva ―🚐― Chamonix"""
    if not legs:
        return ""
    parts = [legs[0].get("from", "?")]
    for leg in legs:
        icon = MODE_ICONS.get(leg.get("mode", ""), "→")
        parts.append(f"―{icon}―")
        parts.append(leg.get("to", "?"))
    return " ".join(parts)


def format_route_summary(origin, resort, routes):
    """Format all routes as numbered cards — matches JSX SkiRoutePlanner results."""
    lines = [
        f"⛷️ **{origin} → {resort}**  ·  {len(routes)} 条路线",
        "",
    ]

    for i, route in enumerate(routes):
        num = NUMBER_EMOJIS[i] if i < len(NUMBER_EMOJIS) else f"({i+1})"
        price = PRICE_DISPLAY.get(route.get("price_tier", ""), route.get("price_tier", ""))
        complexity = COMPLEXITY_CN.get(route.get("complexity", ""), route.get("complexity", ""))
        duration = route.get("total_duration_hours", "?")
        tags = route.get("tags", [])
        tag_str = "  ".join(f"`{t}`" for t in tags) if tags else ""
        chain = _build_city_chain(route.get("legs", []))

        # Line 1: number + name + tags (matches JSX card title row)
        title = f"{num} **{route.get('name', '')}**"
        if tag_str:
            title += f"  {tag_str}"
        lines.append(title)

        # Line 2: English name
        name_en = route.get("name_en", "")
        if name_en:
            lines.append(f"    {name_en}")

        # Line 3: city chain (matches JSX cityChain)
        lines.append(f"    {chain}")

        # Line 4: stats row (matches JSX right side: duration + tier + complexity)
        lines.append(f"    ⏱ {duration}h · {price} · {complexity}")
        lines.append("")

    lines.append('回复路线编号选择（可多选，如 **1 3 5**）')
    return "\n".join(lines)


def format_route_detail(route):
    """Format a single route with full leg timeline — matches JSX LegTimeline."""
    price = PRICE_DISPLAY.get(route.get("price_tier", ""), route.get("price_tier", ""))
    duration = route.get("total_duration_hours", "?")
    tags = route.get("tags", [])
    tag_str = "  ".join(f"`{t}`" for t in tags) if tags else ""

    lines = [
        "━" * 32,
        "",
        f"✅ **{route.get('id', '?')} | {route.get('name', '')}**",
    ]
    if tag_str:
        lines.append(f"    {tag_str}")
    lines.append(f"    {route.get('name_en', '')}  ·  ⏱ {duration}h  ·  {price}")
    lines.append("")

    # Leg timeline — matches JSX LegTimeline component
    legs = route.get("legs", [])
    for i, leg in enumerate(legs):
        icon = MODE_ICONS.get(leg.get("mode", ""), "🔹")
        mode_cn = MODE_CN.get(leg.get("mode", ""), leg.get("mode", ""))
        dur = leg.get("duration_hours", "?")
        dist = leg.get("distance_km", "?")
        carriers = " / ".join(leg.get("typical_carriers", []))
        notes = leg.get("notes", "")

        # From → To with codes
        header = f"  {icon} **{leg.get('from', '?')} → {leg.get('to', '?')}**"
        codes = ""
        if leg.get("from_code") and leg.get("to_code"):
            codes = f"  `{leg['from_code']} → {leg['to_code']}`"
        lines.append(header + codes)

        # Mode · duration · distance
        lines.append(f"      {mode_cn} · {dur}h · {dist}km")

        # Carriers
        if carriers:
            lines.append(f"      {carriers}")

        # Notes (tip box — matches JSX ACCENT border-left style)
        if notes:
            lines.append(f"      💡 {notes}")

        # Connector line between legs
        if i < len(legs) - 1:
            lines.append("      │")

    lines.append("")
    return "\n".join(lines)


def format_selected_details(routes):
    """Format multiple selected routes with full details."""
    parts = [format_route_detail(r) for r in routes]
    parts.append("━" * 32)
    parts.append("")
    parts.append('回复 **确认** 继续查询实时价格 🔎')
    return "\n".join(parts)


def format_confirmed_payload(origin, resort, routes):
    """Build the JSON payload to pass back to the LLM after user confirms."""
    selected = []
    for r in routes:
        selected.append(
            {
                "id": r.get("id"),
                "name": r.get("name"),
                "name_en": r.get("name_en"),
                "total_duration_hours": r.get("total_duration_hours"),
                "price_tier": r.get("price_tier"),
                "legs": [
                    {
                        "from": leg.get("from"),
                        "to": leg.get("to"),
                        "mode": leg.get("mode"),
                        "typical_carriers": leg.get("typical_carriers", []),
                    }
                    for leg in r.get("legs", [])
                ],
            }
        )
    return {
        "action": "ski_route_confirmed",
        "origin": origin,
        "resort": resort,
        "selected_routes": selected,
    }
