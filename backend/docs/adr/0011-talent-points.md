# ADR 0011: Talent points (levels bought with first clears, and the COMBO talent)

- Status: Accepted
- Date: 2026-10-22
- Supersedes: the coin price of ADR 0010

## Context

Coins already pay for equipment, and the talent tree of ADR 0010 competed for them. The player wants progress in the campaign to buy talents, and the click combo, a fixed +50 % ceiling, to become something to upgrade.

## Decision

**Points come from first clears.** `TalentRules.award(position)` gives a key `chapter:stage:encounter:phase` and the points of the encounter: 1 for a phase, 2 for a miniboss, 5 for a chapter boss (`app.talents.points-per-phase`, `points-per-miniboss`, `points-per-chapter-boss`). `ProgressService.report` stores the award in the report transaction, after the move is accepted and only for `CLEARED`; a key already stored pays nothing, which keeps a phase replayed after a failed boss free. The response carries `talentPoints` (0 when nothing was paid). Farm wins never reach this code.

**One table, derived balance.** `talent_point_awards(username, award_key, points)` with the primary key `(username, award_key)` and a cascading foreign key to `users` (Flyway `V5`, AD-010). `earned` is the sum of the awards, `spent` is the sum of the levels times `app.talents.cost-per-level` (1), `available = earned - spent`. Nothing about spending is stored twice.

**An upgrade spends points, not copper.** It creates the progress row if missing and takes it `FOR UPDATE` (the first of the lock order), so an upgrade never reads points that a report is still adding and two upgrades of one player run in turn. `fromLevel`, `TALENT_LEVEL_MISMATCH`, `TALENT_MAX_LEVEL`, `TALENT_NOT_FOUND` and `INVALID_TALENT_REQUEST` are unchanged; `NOT_ENOUGH_TALENT_POINTS` (409) replaces `NOT_ENOUGH_COPPER`. `GET /talents` and the upgrade answer `{ talents, points: { earned, spent, available } }`, `nextCost` is the cost in points (null at the top level) and the wallet is no longer part of the answer. `base-cost` and `growth` are gone.

**COMBO.** The ninth talent, branch `COMBO`, label `Limite de dano do combo`, `%`, 5 per level up to level 10. Its value is the cap of the combo bonus: the game gives a click `min(streak, value)` percent, so level 0 gives no combo, level 4 caps at 20 % and level 10 at 50 %. The step (+1 % a click) and the 1.5 s idle limit are unchanged.

**Existing players.** `V5` inserts a `legacy` award equal to the levels a player already owns, so nobody holds levels the points do not cover. Clears made before `V5` earn nothing.

## Consequences

- Every point is traceable to a cleared position; a client cannot forge one, and cannot spend more than the awards cover.
- The talent price curve, its config and its tests are gone; balance is now the three point values and the cost per level.
- A new account has no combo until its first point is spent.
- Refunds and resets are still not offered.

## Alternatives considered

- Reading the cleared set from the stored `progress` position: rejected; a failed boss moves the position back, so a replayed phase would pay twice.
- A `talent_points` counter column: rejected; a counter can drift from the awards and levels, a sum cannot.
- Keeping copper as the price and adding points only for COMBO: rejected by the owner, every talent uses points.
