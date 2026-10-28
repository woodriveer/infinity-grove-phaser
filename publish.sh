#!/usr/bin/env bash
# Starts the blue-green stack (Postgres, the active backend slot, the nginx proxy, Dozzle), opens a public Cloudflare
# quick tunnel to the proxy, publishes the Worker of the last handled commit through it and starts the deploy watcher,
# which deploys every new commit on origin/main (deploy/watcher.mjs). Only commit trees go out, never the working tree.
# The first run (no .deploy-state) builds origin/main into the blue slot. A second run while one is up only prints its
# tunnel and active slot.
# Usage: ./publish.sh [--no-deploy] [--force]
#   --no-deploy  does not publish the Worker on start (the watcher still runs)
#   --force      with a run already up, publishes the Worker of the handled commit again
set -eo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_PORT=8080
PROXY=infinity-grove-proxy
COMPOSE=(docker compose -f backend/docker-compose.yml --profile deploy)
TUNNEL_LOG="$(mktemp)"
PIDS=()
DEPLOY=1
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --no-deploy) DEPLOY=0 ;;
    --force) FORCE=1 ;;
  esac
done

cd "$ROOT"

docker info >/dev/null 2>&1 || { echo "Docker is not running"; exit 1; }
command -v cloudflared >/dev/null || { echo "cloudflared not found (winget install Cloudflare.cloudflared)"; exit 1; }

# PIDs listening on a TCP port (Windows netstat output)
listening() {
  netstat -ano 2>/dev/null | tr -d '\r' | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" { print $5 }' | sort -u
}

# A quick tunnel that is gone answers 530 or nothing; the backend behind a live one answers (401 without a token)
tunnel_alive() {
  local code
  code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$1/progress" || true)"
  [ -n "$code" ] && [ "$code" != "000" ] && [ "${code:0:1}" != "5" ]
}

# One field of .deploy-state by its dotted path (active.slot); empty when the file or the field is missing
state_get() {
  [ -f .deploy-state ] || return 0
  node -e 'const s = JSON.parse(require("fs").readFileSync(".deploy-state", "utf8"));
const v = process.argv[1].split(".").reduce((o, k) => o?.[k], s);
if (v != null) process.stdout.write(String(v));' "$1"
}

# Writes the state of this run: the active slot and commit, the handled commit and the tunnel (previous is kept)
save_state() {
  node --input-type=module -e 'import { readState, writeState } from "./deploy/lib/state.mjs";
const [slot, commit, handled, tunnel] = process.argv.slice(1);
const state = readState(".deploy-state");
writeState(".deploy-state", { active: { slot, commit }, previous: state?.previous ?? null, handled, tunnel });' "$@"
}

# The Worker built from the commit tree (deploy/lib/workerPublish.mjs), pointing at the tunnel
publish_worker() {
  echo "Publishing the Worker of ${1:0:7}..."
  node --input-type=module -e 'import { publishWorker } from "./deploy/lib/workerPublish.mjs";
import { run } from "./deploy/lib/run.mjs";
const [hash, tunnel] = process.argv.slice(1);
process.exit(publishWorker({ exec: run, root: process.cwd(), hash, tunnel, log: console.log }) ? 0 : 1);' "$1" "$2"
  echo "Published: https://infinity-grove.yan-tapajos.workers.dev/"
}

# A run is already up (its tunnel answers): nothing is restarted
TUNNEL="$(state_get tunnel)"
if [ -n "$TUNNEL" ] && tunnel_alive "$TUNNEL"; then
  ACTIVE="$(state_get active.commit)"
  echo "Already running: tunnel $TUNNEL, slot $(state_get active.slot) (${ACTIVE:0:7})"
  [ "$FORCE" = 1 ] && publish_worker "$(state_get handled)" "$TUNNEL"
  exit 0
fi

if [ -n "$(listening "$PROXY_PORT")" ] && [ "$(docker inspect -f '{{.State.Running}}' "$PROXY" 2>/dev/null)" != "true" ]; then
  echo "Port $PROXY_PORT is in use by another process; stop it first (an old bootRun?)."
  exit 1
fi

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  echo "Stopping the watcher, the tunnel and the deploy containers..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  "${COMPOSE[@]}" stop proxy dozzle backend-blue backend-green >/dev/null 2>&1 || true
  rm -f "$TUNNEL_LOG"
  exit "$status"
}
trap cleanup EXIT INT TERM

git fetch origin main || echo "Could not fetch origin/main; using the last fetched commit"

# A deploy cut short by a restart leaves its lock behind; no watcher runs now
rm -f .deploy.lock

# Local only: the same default signing key as start.sh; both slots get it, so tokens survive a switch
export JWT_SECRET="${JWT_SECRET:-dev-only-insecure-secret-change-me-0123456789}"

if [ -f .deploy-state ]; then
  SLOT="$(state_get active.slot)"
  COMMIT="$(state_get active.commit)"
  HANDLED="$(state_get handled)"
else
  SLOT=blue
  COMMIT="$(git rev-parse origin/main)"
  HANDLED="$COMMIT"
fi
IMAGE="infinity-grove-backend:${COMMIT:0:7}"
IMAGE_VAR="$(echo "$SLOT" | tr '[:lower:]' '[:upper:]')_IMAGE"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Building $IMAGE from the commit tree..."
  git archive --format=tar "$COMMIT:backend" | docker build -t "$IMAGE" -
fi

# The proxy conf names only the active slot, and nginx resolves it on start, so the slot comes up first
node --input-type=module -e 'import { writeConf } from "./deploy/lib/proxy.mjs"; writeConf("deploy/nginx", process.argv[1]);' "$SLOT"
echo "Starting Postgres, Dozzle and backend-$SLOT ($IMAGE)..."
env "$IMAGE_VAR=$IMAGE" "${COMPOSE[@]}" up -d --wait postgres dozzle "backend-$SLOT"
"${COMPOSE[@]}" up -d --wait proxy
docker exec "$PROXY" nginx -s reload >/dev/null

echo "Waiting for the backend behind the proxy on :$PROXY_PORT..."
for _ in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$PROXY_PORT/progress" || true)" = 401 ] && break
  sleep 3
done
[ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$PROXY_PORT/progress" || true)" = 401 ] \
  || { echo "The backend did not answer 401 on /progress in 180 s"; exit 1; }

echo "Opening the tunnel..."
cloudflared tunnel --url "http://127.0.0.1:$PROXY_PORT" >"$TUNNEL_LOG" 2>&1 &
PIDS+=($!)

TUNNEL=""
for _ in $(seq 1 30); do
  TUNNEL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)"
  [ -n "$TUNNEL" ] && break
  sleep 1
done
[ -n "$TUNNEL" ] || { echo "The tunnel did not give an address:"; cat "$TUNNEL_LOG"; exit 1; }
echo "Backend tunnel: $TUNNEL"
save_state "$SLOT" "$COMMIT" "$HANDLED" "$TUNNEL"

# A new tunnel is a new address, so the Worker is published again
[ "$DEPLOY" = 1 ] && publish_worker "$HANDLED" "$TUNNEL"

node deploy/watcher.mjs &
PIDS+=($!)

echo "Running: slot $SLOT (${COMMIT:0:7}), proxy http://localhost:$PROXY_PORT, Dozzle http://localhost:8888."
echo "The watcher deploys every new commit on origin/main. Ctrl+C stops the watcher, the tunnel and the deploy containers."
wait
