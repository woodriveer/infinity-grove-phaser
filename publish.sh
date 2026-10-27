#!/usr/bin/env bash
# Starts everything (start.sh), opens a public Cloudflare quick tunnel to the backend and publishes the latest game
# to the Worker pointing at that tunnel. The tunnel address changes on every run, so a fresh run always redeploys.
# When a previous run is still up (backend listening, its tunnel alive), nothing is restarted: the game is published
# again only if its code changed since the last publish, and a backend change asks for a restart.
# Usage: ./publish.sh [--no-deploy] [--force]
#   --no-deploy  only starts the stack and the tunnel and prints its address
#   --force      publishes even when the game did not change
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8080
FRONTEND_PORT=8081
TUNNEL_LOG="$(mktemp)"
# What the last publish used: the tunnel and the fingerprints of the game and the backend it ran with
STATE="$ROOT/.publish-state"
PIDS=()
DEPLOY=1
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --no-deploy) DEPLOY=0 ;;
    --force) FORCE=1 ;;
  esac
done

command -v cloudflared >/dev/null || { echo "cloudflared not found (winget install Cloudflare.cloudflared)"; exit 1; }

# PIDs listening on a TCP port (Windows netstat output)
listening() {
  netstat -ano 2>/dev/null | tr -d '\r' | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" { print $5 }' | sort -u
}

# One hash of every file (tracked or new, not ignored, tests left out) under the given paths, plus the extra files given
# after `--`; the working tree is what gets published, so uncommitted changes count
fingerprint() {
  local paths=() extra=()
  while [ $# -gt 0 ] && [ "$1" != "--" ]; do paths+=("$1"); shift; done
  [ "$1" = "--" ] && shift
  extra=("$@")
  (
    cd "$ROOT"
    { git ls-files -co --exclude-standard -- "${paths[@]}" | grep -vE '\.test\.js$'; for f in "${extra[@]}"; do [ -f "$f" ] && echo "$f"; done; } \
      | sort -u | while IFS= read -r f; do [ -f "$f" ] && sha256sum "$f"; done | sha256sum | cut -d' ' -f1
  )
}

game_fingerprint() {
  fingerprint game/src game/public game/worker game/index.html game/vite.config.js game/package.json game/wrangler.jsonc game/scripts/deploy.mjs \
    -- game/.env game/.env.pages game/.env.production
}

backend_fingerprint() {
  fingerprint backend/src/main backend/build.gradle.kts
}

state_get() {
  [ -f "$STATE" ] && grep -E "^$1=" "$STATE" | head -n 1 | cut -d= -f2-
}

save_state() {
  printf 'TUNNEL=%s\nGAME=%s\nBACKEND=%s\n' "$1" "$2" "$3" >"$STATE"
}

# A quick tunnel that is gone answers 530 or nothing; the backend behind a live one answers (401 without a token)
tunnel_alive() {
  local code
  code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$1/progress" || true)"
  [ -n "$code" ] && [ "$code" != "000" ] && [ "${code:0:1}" != "5" ]
}

publish_game() {
  echo "Publishing the game..."
  (cd "$ROOT/game" && { [ -d node_modules ] || npm install; } && BACKEND_URL="$1" npm run deploy)
  echo "Published: https://infinity-grove.yan-tapajos.workers.dev/"
}

# A previous run is still up: reuse its backend and tunnel instead of failing on the busy port
if [ -n "$(listening "$BACKEND_PORT")" ]; then
  TUNNEL="$(state_get TUNNEL)"
  if [ -z "$TUNNEL" ] || ! tunnel_alive "$TUNNEL"; then
    echo "Port $BACKEND_PORT is already in use and no live tunnel of a previous publish was found; stop the running backend first."
    exit 1
  fi
  echo "Reusing the running backend and its tunnel: $TUNNEL"

  if [ "$(backend_fingerprint)" != "$(state_get BACKEND)" ]; then
    echo "The backend code changed since it was started: stop the running publish (Ctrl+C) and run ./publish.sh again to restart it."
    exit 1
  fi

  GAME="$(game_fingerprint)"
  if [ "$DEPLOY" = 0 ]; then
    echo "Backend tunnel: $TUNNEL"
  elif [ "$FORCE" = 0 ] && [ "$GAME" = "$(state_get GAME)" ]; then
    echo "Nothing new to publish: the Worker already serves this game code through $TUNNEL"
  else
    publish_game "$TUNNEL"
    save_state "$TUNNEL" "$GAME" "$(state_get BACKEND)"
  fi
  exit 0
fi

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
  rm -f "$TUNNEL_LOG" "$STATE"
}
trap cleanup EXIT INT TERM

BACKEND="$(backend_fingerprint)"

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

# A new tunnel is a new address, so the Worker must be published again even when the game did not change
if [ "$DEPLOY" = 1 ]; then
  GAME="$(game_fingerprint)"
  publish_game "$BACKEND_URL"
  save_state "$BACKEND_URL" "$GAME" "$BACKEND"
else
  save_state "$BACKEND_URL" "" "$BACKEND"
fi

echo "Running. Ctrl+C stops the backend and the tunnel."
wait
