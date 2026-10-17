# ADR 0003: Exception handling

- Status: Accepted
- Date: 2026-10-17

## Context

Business rule violations (user not found, duplicated username, bad credentials) must reach API clients as consistent, machine-readable errors, while the domain stays free of HTTP concerns.

## Decision

**Hierarchy (in `domain/BusinessException.kt`)**
```
BusinessException(code, message)          generic base for every rule violation
├── UserNotFoundException                 USER_NOT_FOUND
├── UserAlreadyExistsException            USER_ALREADY_EXISTS
└── LoginException                        base for login-specific failures
    ├── LoginUserNotFoundException        LOGIN_USER_NOT_FOUND
    └── InvalidPasswordException          LOGIN_INVALID_PASSWORD
```
- The domain throws these exceptions. They carry a stable `code` and no HTTP status.
- Input validation failures use `IllegalArgumentException` (`require(...)`).

**Translation (in `adapter/web/ApiExceptionHandler.kt`, a `@RestControllerAdvice`)**

| Exception | HTTP status |
|---|---|
| `LoginUserNotFoundException` | 404 |
| `LoginException` (e.g. `InvalidPasswordException`) | 401 |
| `UserNotFoundException` | 404 |
| `UserAlreadyExistsException` | 409 |
| any other `BusinessException` | 422 |
| `IllegalArgumentException` | 400 |

- Responses are RFC 7807 `ProblemDetail` objects with an extra `code` property, e.g.
  `{"status":401,"detail":"Password is invalid","code":"LOGIN_INVALID_PASSWORD"}`.
- Spring picks the most specific handler, so subclasses are listed explicitly and the base `BusinessException` handler is the fallback for new exceptions.
- Handled business exceptions are logged at `WARN` with code and status only (see ADR 0001).

**Adding a new exception**: extend `BusinessException` (or `LoginException`) with a unique `code`, throw it from the domain or service, and add a handler only if it needs a status other than 422.

## Consequences

- Clients branch on `code`, not on message text.
- Controllers contain no try/catch.
- Login distinguishes "user does not exist" from "wrong password". This makes it possible to enumerate valid usernames. If that becomes a concern, return the same exception for both cases.
- Unexpected exceptions are not business exceptions and fall through to Spring's default 500 handling.

## Alternatives considered

- Status codes on the exceptions: rejected; it leaks HTTP into the domain.
- A single generic exception with an error enum: rejected; a type hierarchy lets handlers and tests target specific cases.
