# 0016. Several talent levels in one upgrade

## Status

Accepted, 2026-11-27, spec `ui-polish`.

## Context

Holding Shift in the Talentos screen buys the most levels the points pay for. One request per level costs N round trips and can stop halfway when a request fails, leaving the player with a part of the purchase.

## Decision

`POST /talents/{id}/upgrade` reads an optional `levels` in the body. It is an integer from 1 to the `maxLevel` of the talent; an absent key and an explicit `null` both mean 1. Any other type (`"2"`, `1.5`, `true`) answers 400 `INVALID_TALENT_REQUEST` with `levels must be an integer`, and a number outside the range answers 400 with `levels must be an integer between 1 and <maxLevel>`.

The checks run in the order of spec `ui-polish` UIP-08 AC 7:

1. `fromLevel` is not the stored level: 409 `TALENT_LEVEL_MISMATCH`.
2. The grade is locked: 409 `TALENT_LOCKED`.
3. The stored level is already the top level: 409 `TALENT_MAX_LEVEL`, `Talent '<id>' is already at the maximum level`.
4. The stored level plus `levels` passes the top level: 409 `TALENT_MAX_LEVEL`, `Talent '<id>' at level <stored> cannot rise <levels> levels`.
5. The points available are fewer than `levels` times the cost of a level: 409 `NOT_ENOUGH_TALENT_POINTS`, `<levels> talent levels cost <cost> points, the player has <available>` (the one level text is unchanged).

The purchase is all or nothing: the service reads the player under the `progress` lock, checks, and stores the new level in the same transaction, so two requests with the same `fromLevel` and `levels` succeed once and the other answers 409. The answer shape (`TalentsResponse`) is unchanged.

## Consequences

- The previous backend ignores `levels` and buys one level, so a game that sends `levels` during the deploy window gets one level and shows the answered tree.
- No data changes: no migration, no new route, no new column (`AD-016`).
- The game shows the tree the backend answers, so a purchase of fewer levels than asked is visible and consistent.

## Alternatives considered

- N requests of one level each: rejected, a failure leaves a partial purchase and the player waits for N round trips.
- Clamping the count to what the points pay: rejected, the button promised a target level and a silent clamp would break that promise; the player gets the refusal instead.
