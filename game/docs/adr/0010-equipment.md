# ADR 0010: Equipment in the game (collection service, attacker from worn pieces, DOM screen)

- Status: Accepted
- Date: 2026-10-18

## Context

The backend (ADR 0008 of the backend) rolls the equipment a won boss drops, stores the pieces and prices every refine, reroll and sale. The game shows the pieces, lets the player act on them and fights with the pieces the leader wears. Combat still runs in the browser (`AD-002`), so the damage is computed here from values the server already refined.

## Decision

**Rules in the domain.** `domain/equipment/equipment.js` is pure: `wornBy`, `attackerFor(base, pieces)` (base damage plus the weapon click damage, times the click damage percent; crit chance capped at 100; crit multiplier; armor pierce; boss damage), `bossTimeBonusMs`, the Portuguese labels, `describeAffix`, `formatCopper` (gold, silver and copper, zero parts left out) and `applyEquipmentDrop`. `domain/combat/damage.js` reads `attacker.armorPierce` and `attacker.bossDamage` and a `boss` flag; an attacker without them deals what it dealt before. With no worn piece `attackerFor` returns the base attacker itself.

**Collection service.** `application/equipment/equipmentCollection.js` keeps the pieces like `heroCollection` keeps the heroes: `load()` (one request at a time, a drop that arrives while it loads triggers one more load), `equip`, `unequip`, `refine`, `reroll`, `sell` (each takes the pieces from the answer), `applyDrop` (a drop sold because the bag was full is not added) and `onWallet`, fired with the wallet that refine, reroll and sell answer. `WalletLedger.setBase` and `walletSync.setWallet` show that wallet at once and keep the coins that landed and are not confirmed yet.

**Drops.** `campaignSession.onEquipmentDrop` fires for the `equipmentDrop` of each accepted report; the farm win result carries the field and `ClickerGame` reads it. Both show `Equipamento encontrado: <raridade> <slot>` for 3 s in the card notice.

**Combat.** `ClickerGame.hitMonster` builds the attacker from the leader and its worn pieces and passes `boss: this.countdown !== null`; a boss countdown starts at the encounter limit plus the extra seconds of the pieces. The equipment loads with the scene and again on every tick while it has not loaded; until then, or when it fails, the click keeps the base attacker.

**Screen.** `HeroUi` gains the sixth HUD button and `render_equipment`: `equipmentView.renderEquipment` (the four slots of every owned hero and the bag) and `renderPieceDetail` (affixes, Equipar em, Remover, Refinar, one Rerrolar per affix from +5, Vender, each with its cost, disabled when the wallet of the scene holds less). An action shows the piece again, or the list when the piece is gone; a refusal shows `Não foi possível concluir a ação.`; a load failure shows `Equipamento indisponível`.

## Consequences

- A forged client can overstate its damage as before; it cannot choose a drop or a cost.
- After a drop sold into a full bag the wallet text catches up at the next kill sync.
- The equipment screen refreshes from the answer of each action, not from a push; two tabs see each other changes on the next load.
- The e2e fake backend implements the equipment routes and the `equipmentDrop` of the progress and farm answers.

## Alternatives considered

- Computing damage on the server per click: rejected, a request per click does not scale (`AD-002`).
- Reloading the list after every action: rejected, every action already answers with the new list.
- Showing equipment on the hero detail screen: rejected for now; one screen for slots and bag keeps the actions in one place.
