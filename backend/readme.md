# Infinity Grove backend

Spring Boot (Kotlin) API of the game. Decisions live in `docs/adr`.

## Production

The backend runs on Google Cloud Run: service `infinity-grove-backend`, region `southamerica-east1`, 1 vCPU and 1 GiB, scaled to zero when idle (ADR 0012). Its URL is the GitHub variable `BACKEND_URL` (`https://infinity-grove-backend-<project number>.southamerica-east1.run.app`). `GET /health` (public) answers `{"status":"UP","commit":"<commit>"}` once `select 1` works; the startup and liveness probes call it.

A push to `main` that changes a path of `.github/workflows/deploy.yml` starts it. The backend job deploys only when the newest commit of `backend/` is not the one `/health` answers: `./gradlew ktlintCheck test`, the image built from `Dockerfile` with the API regression (`deploy/regression.mjs`) on a throwaway Postgres, a push to Artifact Registry, a new revision with no traffic, `/health` and the regression on its tag URL, then all the traffic and a check of the service URL, with the traffic sent back to the previous revision when it fails. A run first looks for the image of its commit and skips the tests, the build, the regression and the push when that image exists.

A run by hand (`workflow_dispatch`) takes one mode: `deploy` (the release, the default), `build-only` (tests, build and push of the newest backend commit, no deploy) or `rehearsal` (build-only, then reads the service). Nothing deploys while the repository variable `CLOUD_RUN_PRODUCTION` is not `true`.

- Logs: `gcloud run services logs read infinity-grove-backend --region southamerica-east1 --limit 200`.
- Rollback by hand: `gcloud run revisions list --service infinity-grove-backend --region southamerica-east1`, then `gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions <revision>=100`. A rollback does not undo a migration: every Flyway migration keeps the previous backend working (expand/contract, AD-016).
- Secrets (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`) live in Secret Manager and are created by the owner only, never in a file of the repository.

## Database

Production uses the Supabase Postgres of project `jnqlrdnwwqslihncszej` through the Session pooler (`aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`), with a Hikari pool of 5 and 1 idle connection (ADR 0012).

Locally, `docker compose up -d` starts PostgreSQL 16 on `localhost:5432` (database, user and password `infinity_grove` / `infinity` / `infinity`); `./gradlew bootRun` and `start.sh` use it.

Flyway owns the schema: on startup it applies the migrations in `src/main/resources/db/migration`, and Hibernate only validates the entities against them (ADR 0009). The seeders then fill the heroes, chapters, enemies and drop rules.

### Copy to Supabase

`node deploy/db/copyToSupabase.mjs check`, then `copy`, from the repository root, with the repo-root `.env` in Supabase mode (template `.env.example`), `publish.sh` stopped and no backend slot container left. `verify` compares both databases at any time. The cutover runbook is in `.specs/features/supabase-postgres/design.md`.

### Never `docker compose down -v` on the deploy machine

The local volume `backend_postgres_data` is the way back for 30 days after the cutover, and `down -v` deletes it with every player. A database created before Flyway (Hibernate `ddl-auto: update`) has tables but no Flyway history; recreate it only on a development machine.

## Tests

```sh
./gradlew ktlintCheck test
```

Integration tests start their own PostgreSQL with Testcontainers (Docker must run) and apply the same migrations. They never reach Supabase, even with `SPRING_DATASOURCE_URL` set (`TestDatabaseIsolationIT`).

## Way back

Until 30 days after the cutover, `./publish.sh --way-back` at the repository root brings back the local blue-green stack (slots `backend-blue` and `backend-green` behind Traefik on `localhost:8080`, the local Postgres, a Cloudflare tunnel and the watcher). Set the GitHub variable `CLOUD_RUN_PRODUCTION` to `false` first.
