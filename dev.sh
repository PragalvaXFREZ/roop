#!/usr/bin/env bash
# Start the API and the web app for local work.
# Press Ctrl+C to stop both.
# Run the setup steps in README.md before you use this script.
set -euo pipefail
cd "$(dirname "$0")"

(cd api && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --port 8000) &
(cd web && npm run dev) &

trap 'kill 0' EXIT
wait
