# ADR 0002: Testing strategy

- Status: Accepted
- Date: 2026-10-17

## Context

Domain and service layers carry the business rules, so they are the most important to test and should be testable without Spring or infrastructure. Behavior that crosses a process boundary (HTTP, database) must also be proven against real implementations.

## Decision

**Unit tests (mandatory for every domain and service class)**
- Plain JUnit 5 with `kotlin.test`; no Spring context, no mocking framework.
- Output ports are replaced by hand-written fakes in `src/test/.../Fakes.kt` (`InMemoryUserRepository`, `FakePasswordHasher`).
- Domain tests cover validation, state transitions and exceptions (`UserTest`).
- Service tests cover orchestration and port interactions, including every failure path (`UserServiceTest`).
- Test names are backtick sentences describing behavior.

**Integration tests (whenever an external source is involved)**
- Extend `IntegrationTestBase`: `@SpringBootTest(webEnvironment = RANDOM_PORT)` with a real PostgreSQL 17 started by Testcontainers and wired through `@ServiceConnection`. No H2 or other substitute database.
- Endpoints are exercised over real HTTP with RestAssured (`UserControllerIT`), asserting status codes, response bodies and the `code` field of errors.
- The database is cleaned before each test (`jpaUserRepository.deleteAll()`), so tests are independent.
- JSON request bodies are built as strings, because the project uses Jackson 3 and RestAssured's object serialization targets Jackson 2.

**Conventions**
- Integration test classes end in `IT`.
- Docker must be running to execute the integration tests.
- `./gradlew ktlintCheck test` must pass before merging.

## Consequences

- Business rules are verified fast and in isolation; infrastructure is verified against the real database engine.
- Fakes must be kept in sync with the port interfaces, which the compiler enforces.
- The full test run needs Docker and is slower than unit tests alone.

## Alternatives considered

- Mockito/MockK for ports: rejected; fakes make behavior explicit and avoid extra dependencies.
- H2 for integration tests: rejected, because dialect and behavior differences from PostgreSQL hide real bugs.
- MockMvc instead of RestAssured: rejected, because it does not exercise the real server and serialization stack.
