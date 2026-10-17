# ADR 0001: Logging

- Status: Accepted
- Date: 2026-10-17

## Context

The backend follows a DDD layout where services orchestrate and domain classes own business decisions. We need to trace what the application decided and did, without leaking personal data or credentials into logs.

## Decision

- Use SLF4J (`org.slf4j.LoggerFactory`) everywhere. Spring Boot provides Logback as the backend.
- Services and domain classes that contain behavior or orchestration must have a logger. Controllers, adapters and the exception handler may log when it helps tracing.
- Declare the logger in a `companion object` (domain, handler) or a `private companion object` (services):
  ```kotlin
  companion object {
      private val logger = LoggerFactory.getLogger(User::class.java)
  }
  ```
- Always use parameterized messages (`logger.info("Saving User username={}", username)`), never string concatenation or templates.
- Log levels:
  - `INFO`: business events and use case entry points (creating, deleting, login attempt, authentication succeeded).
  - `WARN`: expected business rejections (duplicate username, failed authentication, `BusinessException` handled by the advice, bad request).
  - `DEBUG`: fine-grained decision details.
  - `ERROR`: unexpected failures only, with the exception attached.
- Never log passwords (raw or hashed), tokens, secrets, full request payloads or other personal data. Identifiers such as `username` are allowed.

## Consequences

- Business flows are traceable end to end: service entry, domain decision, handler outcome.
- Log lines are searchable by `key=value` pairs.
- Reviewers must reject logs containing sensitive data. Logging is not covered by automated tests.

## Alternatives considered

- Logging in adapters only: rejected, because decisions made in the domain would be invisible.
- Kotlin logging wrappers (e.g. kotlin-logging): rejected to avoid an extra dependency for no real gain.
