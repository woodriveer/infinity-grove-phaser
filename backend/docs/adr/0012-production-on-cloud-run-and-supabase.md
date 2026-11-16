# ADR 0012: Production on Google Cloud Run and Supabase Postgres

- Status: Accepted
- Date: 2026-11-16
- Extends: ADR 0009 (Flyway owns the schema); keeps the expand/contract rule of AD-016 and replaces its local blue-green deploy

## Context

The backend ran as two blue-green Docker slots on the owner's machine, on the local Postgres, behind a Cloudflare quick tunnel; the site worked only while `publish.sh` ran. Both move off the machine in one cutover, with the players' data.

## Decision

**Cloud Run, scale to zero.** Service `infinity-grove-backend` in `southamerica-east1`, built from `backend/Dockerfile`, image in Artifact Registry (`southamerica-east1-docker.pkg.dev/<project>/infinity-grove/backend:<commit>`). 1 vCPU, 1 GiB, startup CPU boost, request-based billing, `--min-instances=0`. At most one instance serves (`--max=1`) and each revision has at most one (`--max-instances=1`), because the instance of a new revision doubles the database connections. The container listens on `PORT` (`server.port: ${PORT:8080}`).

**Health check and release.** Public `GET /health` answers 200 `{"status":"UP","commit":...}` when `select 1` works and 503 `DOWN` when it does not; the startup and liveness probes call it. Each deploy creates a revision with no traffic and the tag `c-<short commit>` (`c-` and the first 7 characters of the commit). The workflow checks `/health` and runs the API regression on the tag URL, then sends 100 % of the traffic to the new revision and checks the service URL, and sends the traffic back to the previous revision when that check fails.

**Flyway at boot.** The first instance of a new revision migrates the production database while the previous revision serves. A failed revision or a traffic rollback does not undo a migration, so every migration keeps the previous backend working (AD-016).

**Deploy workflow.** `.github/workflows/deploy.yml` deploys the newest commit of `backend/` when it differs from the commit `/health` answers: `./gradlew ktlintCheck test`, the image with the API regression on a throwaway Postgres, a Workload Identity Federation sign-in (no service account key), a push to Artifact Registry, the revision, and `deploy/cloudrun/cloudRunRelease.mjs release`. Then it publishes the game Worker with `BACKEND_URL` set to the service URL. The repository variable `CLOUD_RUN_PRODUCTION` turns it on. A run by hand (`workflow_dispatch`) takes one mode: `deploy` (the release, the default), `build-only` (tests, build and push of the newest backend commit, no deploy) or `rehearsal` (build-only, then `cloudRunRelease.mjs inspect` reads the service). A run first looks for the image of its commit in Artifact Registry and skips the tests, the build, the regression and the push when that image exists.

**Supabase Session pooler.** `aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`. Hikari `maximum-pool-size: 5`, `minimum-idle: 1`: the serving instance and the new revision's take at most 10 of the pooler's 15.

**Secrets.** `JWT_SECRET` and `SPRING_DATASOURCE_*` are Secret Manager secrets (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`), read by the runtime service account as environment variables; `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are GitHub secrets. Only the owner creates them, piping the values from the gitignored repo-root `.env`. The datasource secrets were created only after the copy was verified, so no revision could migrate the empty Supabase.

**Schema `public`, closed to the Data API.** The copy revokes every grant of `anon`, `authenticated` and `service_role` there, and the project's Data API is off.

**One-time copy.** `node deploy/db/copyToSupabase.mjs check | copy | verify` dumps the local `public` schema with `pg_dump` and restores it with `pg_restore --single-transaction`, and compares row counts, sequences, the Flyway history and the grants.

**Cost guard.** An Artifact Registry cleanup policy (`deploy/cloudrun/artifact-cleanup.json`) keeps the 3 newest images and deletes older ones after 30 days; a billing budget mails at 10 %, 50 % and 100 %.

## Consequences

- The site no longer depends on the owner's machine. `publish.sh --way-back` brings back the local stack for 30 days after the cutover.
- An idle service scales to zero; the next visit pays a JVM start, and the start screen waits up to 60 s for `/health`.
- With the expected traffic, compute, requests, images and secrets stay in the free tier; internet egress to South America has no free allowance (a few cents a month).
- The integration tests still run on Testcontainers (`TestDatabaseIsolationIT`), also on the GitHub runner.
- The Free plan has no managed backup (TD-003), and `sslmode=require` does not verify the server certificate (TD-004).

## Alternatives considered

- Fly.io: dropped by the owner; its app never reached Supabase.
- Render: dropped by the owner.
- Cloud Build or the console's continuous deployment: no test gate before traffic.
- A service account JSON key in a GitHub secret: a long-lived credential; Workload Identity Federation gives short-lived tokens.
- `--min-instances=1`: no cold start, about US$ 18 a month in `southamerica-east1`.
- Direct connection `db.<ref>.supabase.co`: IPv6 only.
- Transaction pooler (6543): no prepared statements, no session state for Flyway.
- A `game` schema: needs a rename during the copy and changes in Flyway, Hibernate and the tests; the grants already close `public`.
