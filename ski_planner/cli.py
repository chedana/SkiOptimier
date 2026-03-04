"""CLI entry point for Ski Route Planner."""

import json
import os
import sys
from pathlib import Path

import click

from .formatter import (
    format_confirmed_payload,
    format_route_summary,
    format_selected_details,
)
from .matcher import load_resorts, match_resort
from .routes import generate_routes, lookup_routes, select_routes

# Data directory: env override or same dir as the JSON files
DATA_DIR = Path(os.environ.get("SKI_DATA_DIR", Path(__file__).resolve().parent.parent))


@click.group()
def cli():
    """🏔️ Ski Route Planner — 欧洲滑雪场多模态交通路线查找"""
    pass


@cli.command()
@click.argument("origin")
@click.argument("resort_query")
@click.option("--json-output", "-j", is_flag=True, help="Output raw JSON instead of formatted text")
def search(origin: str, resort_query: str, json_output: bool):
    """Search routes from ORIGIN to RESORT_QUERY.

    Examples:
      ski search London Chamonix
      ski search Manchester Zermatt
      ski search "London" "Val d'Isère"
    """
    resorts = load_resorts(DATA_DIR)
    matches = match_resort(resort_query, resorts)

    if not matches:
        msg = {
            "error": "no_match",
            "message": f"未找到匹配 '{resort_query}' 的雪场",
            "available_resorts": [r["name"] for r in resorts],
        }
        if json_output:
            click.echo(json.dumps(msg, ensure_ascii=False, indent=2))
        else:
            click.echo(f"❌ 未找到匹配 '{resort_query}' 的雪场。")
            click.echo(f"可用雪场共 {len(resorts)} 个，用 'ski resorts' 查看完整列表。")
        sys.exit(1)

    if len(matches) > 1:
        msg = {
            "status": "multiple_matches",
            "query": resort_query,
            "matches": [
                {"name": r["name"], "country": r["country"], "ski_area": r.get("ski_area", "")}
                for r in matches
            ],
        }
        if json_output:
            click.echo(json.dumps(msg, ensure_ascii=False, indent=2))
        else:
            click.echo(f"🔍 '{resort_query}' 匹配到 {len(matches)} 个雪场，请选择：")
            for i, r in enumerate(matches, 1):
                click.echo(f"  {i}. {r['name']} ({r['country']}) — {r.get('ski_area', '')}")
        sys.exit(0)

    # Single match
    resort = matches[0]
    resort_name = resort["name"]

    # Look up routes
    result = lookup_routes(origin, resort_name, DATA_DIR)
    if result is None:
        # Cache miss — generate via Claude API
        click.echo(f"⏳ 正在为 {origin} → {resort_name} 生成路线（首次约 15-20 秒）...", err=True)
        result = generate_routes(origin, resort_name)

    routes = result.get("routes", [])
    if not routes:
        error = result.get("error", "未知错误")
        if json_output:
            click.echo(json.dumps({"error": error, "routes": []}, ensure_ascii=False, indent=2))
        else:
            click.echo(f"❌ 未找到路线: {error}")
        sys.exit(1)

    if json_output:
        output = {
            "status": "ok",
            "origin": origin,
            "resort": resort_name,
            "country": resort["country"],
            "route_count": len(routes),
            "routes": routes,
        }
        click.echo(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        click.echo(format_route_summary(origin, resort_name, routes))


@cli.command()
@click.argument("origin")
@click.argument("resort_query")
@click.argument("route_ids")
@click.option("--json-output", "-j", is_flag=True, help="Output raw JSON")
def details(origin: str, resort_query: str, route_ids: str, json_output: bool):
    """Show detailed info for selected routes.

    ROUTE_IDS: comma-separated route IDs, e.g. "R1,R3,R5" or "1,3,5"

    Examples:
      ski details London Chamonix "R1,R3,R5"
      ski details London Chamonix "1,3"
    """
    resorts = load_resorts(DATA_DIR)
    matches = match_resort(resort_query, resorts)

    if not matches:
        click.echo(f"❌ 未找到匹配 '{resort_query}' 的雪场")
        sys.exit(1)

    resort = matches[0]
    resort_name = resort["name"]

    result = lookup_routes(origin, resort_name, DATA_DIR)
    if result is None:
        result = generate_routes(origin, resort_name)

    routes = result.get("routes", [])
    if not routes:
        click.echo("❌ 未找到路线")
        sys.exit(1)

    # Parse route IDs: accept "R1,R3" or "1,3"
    raw_ids = [s.strip() for s in route_ids.replace(" ", ",").split(",") if s.strip()]
    normalized_ids = []
    for rid in raw_ids:
        if rid.upper().startswith("R"):
            normalized_ids.append(rid.upper())
        else:
            normalized_ids.append(f"R{rid}")

    selected = select_routes(routes, normalized_ids)
    if not selected:
        click.echo(f"❌ 未找到路线 ID: {route_ids}")
        available = [r.get("id", "?") for r in routes]
        click.echo(f"可用 ID: {', '.join(available)}")
        sys.exit(1)

    if json_output:
        payload = format_confirmed_payload(origin, resort_name, selected)
        click.echo(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        click.echo(format_selected_details(selected))


@cli.command()
@click.option("--country", "-c", default=None, help="Filter by country (france/italy/switzerland/austria)")
@click.option("--json-output", "-j", is_flag=True, help="Output raw JSON")
def resorts(country, json_output: bool):
    """List all 43 available ski resorts."""
    all_resorts = load_resorts(DATA_DIR)

    if country:
        filtered = [r for r in all_resorts if r["country"].lower() == country.lower()]
    else:
        filtered = all_resorts

    if json_output:
        click.echo(json.dumps(filtered, ensure_ascii=False, indent=2))
    else:
        current_country = None
        for r in filtered:
            if r["country"] != current_country:
                current_country = r["country"]
                click.echo(f"\n🏔️ {current_country}:")
            tags = ", ".join(r.get("tags", []))
            click.echo(f"  • {r['name']} — {r.get('ski_area', '')} ({r.get('piste_km', '?')}km) [{tags}]")
        click.echo(f"\n共 {len(filtered)} 个雪场")


@cli.command()
@click.argument("query")
@click.option("--json-output", "-j", is_flag=True, help="Output raw JSON")
def match(query: str, json_output: bool):
    """Fuzzy match a resort name.

    Examples:
      ski match cham
      ski match "val d'isere"
      ski match "3 valleys"
    """
    resorts_list = load_resorts(DATA_DIR)
    matches = match_resort(query, resorts_list)

    if json_output:
        click.echo(json.dumps(
            [{"name": r["name"], "country": r["country"], "ski_area": r.get("ski_area", "")} for r in matches],
            ensure_ascii=False, indent=2,
        ))
    else:
        if not matches:
            click.echo(f"❌ 未找到匹配 '{query}' 的雪场")
        elif len(matches) == 1:
            r = matches[0]
            click.echo(f"✅ {r['name']} ({r['country']}) — {r.get('ski_area', '')}")
        else:
            click.echo(f"🔍 '{query}' 匹配到 {len(matches)} 个雪场：")
            for r in matches:
                click.echo(f"  • {r['name']} ({r['country']}) — {r.get('ski_area', '')}")


def main():
    cli()


if __name__ == "__main__":
    main()
