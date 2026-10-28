#!/usr/bin/env bash
# Manual deploy entry: ./deploy.sh --rollback brings back the previous backend slot (kept 5 min after a deploy)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

node "$ROOT/deploy/deploy.mjs" "$@"
