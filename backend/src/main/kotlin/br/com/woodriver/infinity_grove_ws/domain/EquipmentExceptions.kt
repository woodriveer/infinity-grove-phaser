package br.com.woodriver.infinity_grove_ws.domain

/** Base type for an equipment request the client built wrongly (400). */
open class EquipmentRequestException(
    code: String,
    message: String,
) : BusinessException(code, message)

class InvalidAffixException(
    index: Int,
    count: Int,
) : EquipmentRequestException("INVALID_AFFIX", "Affix $index does not exist, the piece has $count")

/** The piece does not exist or belongs to another account (404); the two cases look the same on purpose. */
class EquipmentNotFoundException(
    pieceId: String,
) : BusinessException("EQUIPMENT_NOT_FOUND", "Piece '$pieceId' not found")

/** Base type for an equipment request that is valid but does not apply to the piece or wallet as they are (409). */
open class EquipmentConflictException(
    code: String,
    message: String,
) : BusinessException(code, message)

class NotEnoughCopperException(
    needed: Long,
) : EquipmentConflictException("NOT_ENOUGH_COPPER", "The wallet holds less than the $needed copper this costs")

class MaxRefineException : EquipmentConflictException("MAX_REFINE", "The piece is already at the maximum refine level")

class RefineTooLowException(
    required: Int,
) : EquipmentConflictException("REFINE_TOO_LOW", "Rerolling needs a refine level of at least $required")

class NoAffixLeftException : EquipmentConflictException("NO_AFFIX_LEFT", "The piece already has every affix type its slot allows")
