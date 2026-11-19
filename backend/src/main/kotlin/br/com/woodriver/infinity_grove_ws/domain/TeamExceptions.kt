package br.com.woodriver.infinity_grove_ws.domain

/** A team body the client built wrongly: not 4 entries, an entry that is not a hero id or null, a hero twice, the leader (400). */
class InvalidTeamException(
    reason: String,
) : HeroRequestException("INVALID_TEAM", "The team is invalid: $reason")

/** A slot purchase the client built wrongly: `fromSlots` missing, not an integer or negative (400). */
class InvalidTeamSlotRequestException(
    reason: String,
) : HeroRequestException("INVALID_TEAM_SLOT_REQUEST", "The slot purchase is invalid: $reason")

/** The player never won the chapter 5 boss, so the team cannot be saved yet (409). */
class TeamLockedException : HeroConflictException("TEAM_LOCKED", "The team opens with the first win of the chapter 5 boss")

/** A hero sits in ally slot [slot], which the player has not bought (409). */
class TeamSlotNotBoughtException(
    slot: Int,
) : HeroConflictException("TEAM_SLOT_NOT_BOUGHT", "Ally slot $slot is not bought")

/** Every open slot is bought; the next one opens with the next chapter boss (409). */
class TeamSlotLockedException : HeroConflictException("TEAM_SLOT_LOCKED", "The next ally slot is not open yet")

/** All 4 ally slots are bought (409). */
class TeamSlotsMaxException : HeroConflictException("TEAM_SLOTS_MAX", "All 4 ally slots are bought")

/** The player saw another bought count than the stored one: a repeated or stale request. [current] is the stored team (409). */
class TeamSlotMismatchException(
    val current: TeamView,
    sent: Int,
) : HeroConflictException(
        "TEAM_SLOT_MISMATCH",
        "The team has ${current.boughtSlots} bought slots, the request was made for $sent",
    )
