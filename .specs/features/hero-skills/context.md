# Hero Skills Context

**Gathered:** 2026-10-20
**Spec:** `.specs/features/hero-skills/spec.md`
**Status:** Ready for design

---

## Feature Boundary

The leader's three skills on the combat skill bar become usable: each of the 15 skills of the five heroes runs its mechanic in the browser fight, adapted to the clicker as it is today (one leader, one monster at a time, damage only from clicks).

---

## Implementation Decisions

### Who uses skills

- Only the leader. The bar shows the leader's three skills, as today; the player switches leader to use another hero's skills.
- "Buff de grupo" effects apply to the player's clicks (and hits), not to a party.
- A team of several active heroes stays a later feature.

### Effects without a mechanic in the game

- Adapted to the click (user decision). Attack speed becomes click damage percent; Strength becomes physical damage percent; "all enemies" / "area" is the current monster; "Submundo" is the DARKNESS element; stun and root pause the boss countdown.
- Effects with no equivalent (Precisão of Bênção, "não erram" of Bomba de Fumaça) have no effect.
- Carrilhão da Aurora is a time shield: +4 s on the boss countdown at once (user choice among slower timer, no effect, time shield).
- The full skill map (proposed by the agent, accepted without change) is the Skill Mechanics table of the spec.

### Leader bonuses

- None in this feature, Lyra's included (user decision).

### Agent's Discretion

- Exact on-screen texts of the cooldown, the cast and the effect tags (L-010 applied: they are fixed in the spec).
- Damage of a skill hit: a percent of the damage base of a leader click, through the click formula.
- Durations, ticks and refresh rules not written in the README.

### Declined / Undiscussed Gray Areas → Assumptions

All logged in the spec's Assumptions table.

---

## Specific References

- README "Sinergias entre habilidades": bonuses of attack speed add up (Bênção + Ventos Ligeiros); Bomba de Fumaça + Tiro Preciso.

---

## Deferred Ideas

- Leader bonuses (Kael boss damage, Lyra Ventos duration, Orina arcane power, Seraphine +15 % Seiva, Vex damage on DoT targets).
- Auto attack, accuracy/evasion, boss interruption and debuffs, Underworld tag, hero resistance.
- A party of several active heroes.
