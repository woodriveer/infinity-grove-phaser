# ADR 0002: Environment configuration

- Status: Accepted
- Date: 2026-10-17

## Context

The game runs against different backends (local, staging, production). The backend has no CORS configuration, so a browser on another origin is blocked.

## Decision

- Use Vite env files selected by mode: `.env.development`, `.env.staging`, `.env.production`. Local overrides go in `.env.local` / `.env.*.local` (git-ignored).
- Only `VITE_`-prefixed variables reach the browser: `VITE_APP_ENV`, `VITE_API_BASE_URL`, `VITE_API_TIMEOUT_MS`. Read them only in `src/api/config.js`.
- Scripts: `npm run dev` (development), `npm run dev:staging`, `npm run build` (production), `npm run build:staging`.
- In development `VITE_API_BASE_URL=/api` and the dev server proxies it to `API_PROXY_TARGET` (`http://localhost:8080`), stripping the `/api` prefix. `API_PROXY_TARGET` has no `VITE_` prefix so it never ships in the bundle.
- Staging and production use absolute URLs; the backend must allow those origins via CORS (not yet implemented).
- Env files hold no secrets. Anything in them is public once built.

## Consequences

- No code changes between environments; only the mode differs.
- Production/staging hostnames in the env files are placeholders to replace.
- `npm run dev:staging` is cross-origin (no proxy), so it needs CORS on staging.

## Alternatives considered

- A runtime `config.json` loaded at startup: allows one build for all environments, but adds a boot step. Reconsider if build-per-environment becomes painful.
- Enabling CORS on the backend for local dev: rejected, the proxy keeps dev closer to a same-origin deployment.
