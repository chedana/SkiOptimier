"""CLI entry point for Flight Search."""

import json
import sys

import click

from .formatter import format_flights
from .scrape import scrape_flights


@click.group()
def cli():
    """Flight Search — scrape and format flight data."""
    pass


@cli.command("scrape-flights")
@click.argument("from_city")
@click.argument("to_city")
@click.argument("date")
@click.option("--headless/--no-headless", default=True, help="Run browser in headless mode")
@click.option("--timeout", default=30, type=int, help="Page load timeout in seconds")
@click.option("--chromium-path", default=None, help="Path to Chromium binary")
@click.option("--max-results", default=0, type=int, help="Max flights to return (0=all)")
def scrape_flights_cmd(from_city, to_city, date, headless, timeout, chromium_path, max_results):
    """Scrape Google Flights for nonstop flight data.

    Opens Google Flights with Playwright, clicks 'Show more flights',
    expands flight details, and returns structured JSON.

    Examples:
      flight scrape-flights London Venice 2026-03-29
      flight scrape-flights London Geneva 2026-03-15 --no-headless
    """
    result = scrape_flights(
        origin=from_city,
        destination=to_city,
        date=date,
        headless=headless,
        timeout=timeout,
        chromium_path=chromium_path,
        max_results=max_results,
    )
    click.echo(json.dumps(result, ensure_ascii=False, indent=2))
    if result.get("status") != "ok":
        sys.exit(1)


@cli.command("format-flights")
@click.argument("json_data")
def format_flights_cmd(json_data: str):
    """Sort and format flight search results for Discord display.

    JSON_DATA: JSON string with flight data.

    Example:
      flight format-flights '{"direction":"outbound","date":"3/29","origin":"London",
        "destination":"Venice","preference":"早到","flights":[...]}'
    """
    data = json.loads(json_data)
    click.echo(format_flights(data))


def main():
    cli()


if __name__ == "__main__":
    main()
