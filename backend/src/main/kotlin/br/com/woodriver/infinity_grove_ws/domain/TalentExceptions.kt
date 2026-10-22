package br.com.woodriver.infinity_grove_ws.domain

/** A talent request the client built wrongly (400). */
class TalentRequestException(
    message: String,
) : BusinessException("INVALID_TALENT_REQUEST", message)

/** The talent is not in the catalog (404). */
class TalentNotFoundException(
    talentId: String,
) : BusinessException("TALENT_NOT_FOUND", "Talent '$talentId' not found")

/** Base type for a talent request that is valid but does not apply to the talent as it stands (409). */
open class TalentConflictException(
    code: String,
    message: String,
) : BusinessException(code, message)

/** The player saw another level than the stored one: a repeated or stale request, nothing is charged. */
class TalentLevelMismatchException(
    talentId: String,
    sent: Int,
    stored: Int,
) : TalentConflictException("TALENT_LEVEL_MISMATCH", "Talent '$talentId' is at level $stored, the request was made for level $sent")

class TalentMaxLevelException(
    talentId: String,
) : TalentConflictException("TALENT_MAX_LEVEL", "Talent '$talentId' is already at the maximum level")

/** The player holds fewer talent points than a level costs; nothing is spent. */
class NotEnoughTalentPointsException(
    available: Int,
    cost: Int,
) : TalentConflictException("NOT_ENOUGH_TALENT_POINTS", "A talent level costs $cost points, the player has $available")
