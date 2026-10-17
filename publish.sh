#!/usr/bin/env bash
# Starts everything (start.sh), opens a public Cloudflare quick tunnel to the backend and publishes the latest game
# to the Worker pointing at that tunnel. The tunnel address changes on every run, so each run redeploys.
# Usage: ./publish.sh [--no-deploy]   (--no-deploy only starts the stack and the tunnel and prints its address)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8080
FRONTEND_PORT=8081
TUNNEL_LOG="$(mktemp)"
PIDS=()
DEPLOY=1
[ "$1" = "--no-deploy" ] && DEPLOY=0

command -v cloudflared >/dev/null || { echo "cloudflared not found (winget install Cloudflare.cloudflared)"; exit 1; }

# PIDs listening on a TCP port (Windows netstat output)
listening() {
  netstat -ano 2>/dev/null | tr -d '\r' | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" { print $5 }' | sort -u
}

# gradlew leaves the backend JVM behind when it is killed, so stop whatever still listens on the app ports
free_ports() {
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    for pid in $(listening "$port"); do
      taskkill //F //PID "$pid" >/dev/null 2>&1 || true
    done
  done
}

cleanup() {
  echo "Stopping services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  free_ports
  rm -f "$TUNNEL_LOG"
}
trap cleanup EXIT INT TERM

if [ -n "$(listening "$BACKEND_PORT")" ]; then
  echo "Port $BACKEND_PORT is already in use; stop the running backend first."
  exit 1
fi

"$ROOT/start.sh" &
PIDS+=($!)

echo "Waiting for the backend on :$BACKEND_PORT..."
until curl -s -o /dev/null "http://localhost:$BACKEND_PORT/progress"; do
  sleep 3
done

echo "Opening the tunnel..."
cloudflared tunnel --url "http://localhost:$BACKEND_PORT" >"$TUNNEL_LOG" 2>&1 &
PIDS+=($!)

BACKEND_URL=""
for _ in $(seq 1 30); do
  BACKEND_URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)"
  [ -n "$BACKEND_URL" ] && break
  sleep 1
done
[ -n "$BACKEND_URL" ] || { echo "The tunnel did not give an address:"; cat "$TUNNEL_LOG"; exit 1; }
echo "Backend tunnel: $BACKEND_URL"

if [ "$DEPLOY" = 1 ]; then
  echo "Publishing the game..."
  (cd "$ROOT/game" && { [ -d node_modules ] || npm install; } && BACKEND_URL="$BACKEND_URL" npm run deploy)
  echo "Published: https://infinity-grove.yan-tapajos.workers.dev/"
fi

echo "Running. Ctrl+C stops the backend and the tunnel."
wait
