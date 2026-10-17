# ADR 0001: HTTP client and API layer

- Status: Accepted
- Date: 2026-10-17

## Context

The game needs to talk to the Kotlin backend (`/users`, `/users/login`). Scenes should not know about URLs, HTTP status codes or the HTTP library.

## Decision

- Use [axios](https://github.com/axios/axios) through a single shared instance (`src/api/httpClient.js`) configured with `baseURL` and `timeout` from the environment config.
- Keep all backend access in `src/api/`:
  - `config.js`: the only reader of `import.meta.env`.
  - `httpClient.js`: axios instance plus a response interceptor.
  - `ApiError.js`: normalized error (`message`, `status`, `code`). The interceptor maps backend `ProblemDetail` (`detail`, `code`) and network failures into it.
  - `userApi.js`: one function per endpoint, returning `response.data`.
  - `index.js`: public surface; scenes import from `../api` only.
- Scenes catch `ApiError` and show `error.message`. They never touch axios types.
- One module per backend resource (`userApi`, future `scoreApi`, ...).

## Consequences

- Swapping the HTTP library or adding auth headers/retries touches `httpClient.js` only.
- Error messages shown to players come from the backend `detail`, so backend wording is user-facing.
- No token is stored: the backend currently returns only the user on login. Revisit when it issues tokens.

## Alternatives considered

- Native `fetch`: no dependency, but needs hand-written timeout, JSON and error handling.
- Calling axios directly from scenes: rejected, couples game code to transport details.
