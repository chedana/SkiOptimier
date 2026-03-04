#!/usr/bin/env bash
# Ski Route Planner wrapper script
# Usage: ski-run.sh <command> [args...]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export SKI_DATA_DIR="${SKI_DATA_DIR:-$SCRIPT_DIR}"

# Use the installed CLI if available, otherwise run as module
if command -v ski &>/dev/null; then
    exec ski "$@"
else
    exec python3 -m ski_planner.cli "$@"
fi
