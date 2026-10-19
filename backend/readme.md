# Infinity Grove backend

Spring Boot (Kotlin) API of the game. Decisions live in `docs/adr`.

## Database

`docker compose up -d` starts PostgreSQL 16 on `localhost:5432` (database, user and password `infinity_grove` / `infinity` / `infinity`).

Flyway owns the schema: on startup it applies the migrations in `src/main/resources/db/migration`, and Hibernate only validates the entities against them (ADR 0009). The seeders then fill the heroes, chapters, enemies and drop rules.

### One-time reset

A database created before Flyway (by Hibernate `ddl-auto: update`) has tables but no Flyway history, and Flyway refuses to migrate a non-empty schema without history. Recreate the volume once:

```sh
docker compose down -v
docker compose up -d
```

This deletes every player, wallet, card and piece of equipment of the local database.

## Tests

```sh
./gradlew ktlintCheck test
```

Integration tests start their own PostgreSQL with Testcontainers (Docker must run) and apply the same migrations.
