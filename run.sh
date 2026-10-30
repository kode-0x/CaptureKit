#!/usr/bin/env bash
# CaptureKit launcher for macOS and Linux.
# Forwards all arguments to scripts/run.mjs. See: ./run.sh --help
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "[run] Node.js is required but was not found on PATH. Install Node 22.13+, 24.x, or 26+." >&2
  exit 1
fi

exec node "$script_dir/scripts/run.mjs" "$@"
