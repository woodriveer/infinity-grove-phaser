#!/usr/bin/env bash
# Starts docker-compose (postgres + pgadmin), the backend and the frontend.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()

cleanup() {
  echo "Stopping services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  (cd "$ROOT/backend" && docker compose stop)
}
trap cleanup EXIT INT TERM

echo "Starting docker-compose (postgres + pgadmin)..."
(cd "$ROOT/backend" && docker compose up -d --wait)

# Local development only: insecure default signing key for access tokens (>= 32 bytes).
# Never use this value in production; set JWT_SECRET in the environment instead.
export JWT_SECRET="${JWT_SECRET:-dev-only-insecure-secret-change-me-0123456789}"

echo "Starting backend..."
(cd "$ROOT/backend" && ./gradlew bootRun) &
PIDS+=($!)

echo "Starting frontend..."
(cd "$ROOT/game" && { [ -d node_modules ] || npm install; } && npm run dev) &
PIDS+=($!)

echo "Postgres: localhost:5432 | pgAdmin: http://localhost:5050 | Frontend: http://localhost:8080 (vite default may vary)"
wait
