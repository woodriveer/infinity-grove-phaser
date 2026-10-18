package br.com.woodriver.infinity_grove_ws.domain

/** Base type for a hero request the client built wrongly (400). */
open class HeroRequestException(
    code: String,
    message: String,
) : BusinessException(code, message)

class InvalidStartingElementException(
    value: String?,
) : HeroRequestException("INVALID_STARTING_ELEMENT", "Starting element '$value' is invalid, choose FIRE, WATER or NATURE")

class InvalidFusionException(
    reason: String,
) : HeroRequestException("INVALID_FUSION", "Fusion is invalid: $reason")

class HeroNotFoundException(
    heroId: String,
) : BusinessException("HERO_NOT_FOUND", "Hero '$heroId' not found")

/** Base type for a hero request that is valid but does not apply to the player's current state (409). */
open class HeroConflictException(
    code: String,
    message: String,
) : BusinessException(code, message)

class NotEnoughCardsException(
    heroId: String,
    stars: Int,
) : HeroConflictException("NOT_ENOUGH_CARDS", "Fewer than 3 cards of hero '$heroId' with $stars stars")

class HeroNotOwnedException(
    heroId: String,
) : HeroConflictException("HERO_NOT_OWNED", "Hero '$heroId' is not owned")

class DailyLimitReachedException(
    limit: Int,
) : HeroConflictException("DAILY_LIMIT_REACHED", "The chapter boss was already won $limit times today")

class BossNotAvailableException(
    boss: String,
) : HeroConflictException("BOSS_NOT_AVAILABLE", "Boss '$boss' has not been beaten yet")

class FarmTooFastException(
    minIntervalMs: Long,
) : HeroConflictException("FARM_TOO_FAST", "A farm win needs at least $minIntervalMs ms after the previous one")

/** A player created before hero cards existed has no cards row. */
class PlayerCardsMissingException(
    username: String,
) : BusinessException("PLAYER_WITHOUT_HEROES", "Player '$username' has no heroes")
