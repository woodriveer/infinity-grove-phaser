package br.com.woodriver.infinity_grove_ws.domain

/** An auto click request the client built wrongly (400). */
class AutoClickRequestException(
    message: String,
) : BusinessException("INVALID_AUTO_CLICK_REQUEST", message)

/** Base type for an auto click upgrade that is valid but does not apply to the player as they stand (409). */
open class AutoClickConflictException(
    code: String,
    message: String,
) : BusinessException(code, message)

/**
 * The player saw another level than the stored one: a repeated or stale request, nothing is charged. [current] is the stored state and
 * [rules] the rules it was read against, so the answer can show it.
 */
class AutoClickLevelMismatchException(
    val current: PlayerAutoClick,
    val rules: AutoClickRules,
    sent: Int,
) : AutoClickConflictException(
        "AUTO_CLICK_LEVEL_MISMATCH",
        "The auto click is at level ${current.level}, the request was made for level $sent",
    )

class AutoClickMaxLevelException : AutoClickConflictException("AUTO_CLICK_MAX_LEVEL", "The auto click is already at the maximum level")

/** The campaign is still in chapter 1: the auto click opens with chapter 2. */
class AutoClickLockedException : AutoClickConflictException("AUTO_CLICK_LOCKED", "The auto click opens after chapter 1")

/** The player holds fewer crystals than the upgrade costs; nothing is spent. */
class NotEnoughCrystalsException(
    crystals: Long,
    price: Long,
) : AutoClickConflictException("NOT_ENOUGH_CRYSTALS", "The upgrade costs $price crystals, the player has $crystals")
