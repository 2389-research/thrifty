#!/usr/bin/env bash
# Serve the game over HTTP (ES modules will not load via file://).
set -e
cd "$(dirname "$0")"
PORT="${1:-8777}"
echo "Serving Asteroids at http://localhost:$PORT  (Ctrl-C to stop)"
exec python3 -m http.server "$PORT"
