package br.com.woodriver.infinity_grove_ws.domain

import java.math.BigInteger

enum class Slot { WEAPON, ARMOR, RING, AMULET }

/**
 * How good a piece is: the number of [affixCount] affixes it rolls, the [valueMultiplier] applied to every rolled value and the
 * [costMultiplier] of its refine cost. [index] is 1 for the worst rarity and sets the sell price.
 */
enum class Rarity(
    val index: Int,
    val affixCount: Int,
    val valueMultiplier: Double,
    val costMultiplier: Int,
) {
    COMMON(1, 1, 1.0, 1),
    UNCOMMON(2, 2, 1.2, 2),
    RARE(3, 3, 1.5, 3),
    EPIC(4, 4, 1.8, 5),
    LEGENDARY(5, 4, 2.2, 8),
}

/** A kind of attribute a piece can carry, rolled between [min] and [max] before the rarity multiplier. The weapon has its own click damage. */
enum class AffixType(
    val min: Int,
    val max: Int,
    private val onWeapon: Boolean = true,
) {
    CLICK_DAMAGE_PCT(5, 15, onWeapon = false),
    CRIT_CHANCE(1, 5),
    CRIT_DAMAGE_PCT(10, 30),
    BOSS_DAMAGE_PCT(5, 15),
    BOSS_TIME_SECONDS(1, 3),
    ARMOR_PIERCE_PCT(5, 15),
    ;

    fun allowedOn(slot: Slot) = slot != Slot.WEAPON || onWeapon

    companion object {
        fun allowedOn(slot: Slot) = entries.filter { it.allowedOn(slot) }
    }
}

/** One attribute of a piece. [base] is the value as rolled (rarity multiplier included); the refine level is applied by [Piece.value]. */
data class Affix(
    val type: AffixType,
    val base: Int,
) {
    init {
        require(base >= 1) { "Affix $type base $base must be at least 1" }
    }
}

/** The numbers an operator tunes (`app.equipment`); the tables of affix ranges and rarities live in the enums above. */
data class EquipmentRules(
    val minibossRate: Double = 0.25,
    val chapterBossRate: Double = 1.0,
    val bagCapacity: Int = 100,
    val refineBaseCost: Long = 500,
    val rerollCost: Long = 5000,
) {
    init {
        require(minibossRate in 0.0..1.0) { "miniboss-rate $minibossRate must be between 0 and 1" }
        require(chapterBossRate in 0.0..1.0) { "chapter-boss-rate $chapterBossRate must be between 0 and 1" }
        require(bagCapacity >= 1) { "bag-capacity $bagCapacity must be at least 1" }
        require(refineBaseCost >= 0) { "refine-base-cost $refineBaseCost must not be negative" }
        require(rerollCost >= 0) { "reroll-cost $rerollCost must not be negative" }
    }

    companion object {
        const val MAX_REFINE = 10
        const val REROLL_MIN_REFINE = 5
    }
}

/**
 * A piece of equipment. A [Slot.WEAPON] carries [baseClick] (its own click damage, not an affix); every piece carries [affixes].
 * [heroId] is the hero wearing it, null while it sits in the bag. Stored values are base values; the getters apply the refine level.
 */
data class Piece(
    val id: String,
    val username: String,
    val slot: Slot,
    val rarity: Rarity,
    val baseClick: Int?,
    val refine: Int,
    val affixes: List<Affix>,
    val heroId: String? = null,
) {
    init {
        require(id.isNotBlank()) { "Piece id must not be blank" }
        require(refine in 0..EquipmentRules.MAX_REFINE) { "Refine $refine must be between 0 and ${EquipmentRules.MAX_REFINE}" }
        require((slot == Slot.WEAPON) == (baseClick != null)) { "Only a weapon carries base click damage, got $baseClick on $slot" }
        require(baseClick == null || baseClick >= 1) { "Base click damage $baseClick must be at least 1" }
        require(affixes.size <= rarity.affixCount) { "A $rarity piece holds at most ${rarity.affixCount} affixes, got ${affixes.size}" }
        require(affixes.map { it.type }.toSet().size == affixes.size) { "Affix types must not repeat, got ${affixes.map { it.type }}" }
        require(affixes.all { it.type.allowedOn(slot) }) { "Affixes ${affixes.map { it.type }} are not allowed on $slot" }
    }

    /** The value of [affix] at this refine level: the base times `1 + 0.1 * refine`, rounded down. */
    fun value(affix: Affix): Int = affix.base * (REFINE_STEPS + refine) / REFINE_STEPS

    /** The weapon's click damage at this refine level with one decimal; null for any other slot. */
    fun clickDamage(): Double? = baseClick?.let { it * (REFINE_STEPS + refine) / REFINE_STEPS.toDouble() }

    /** Copper to take the piece to the next refine level, or null at the maximum level. */
    fun refineCost(rules: EquipmentRules): Long? {
        if (refine >= EquipmentRules.MAX_REFINE) return null
        val grown = BigInteger.valueOf(rules.refineBaseCost) * GROWTH_NUMERATOR.pow(refine) / GROWTH_DENOMINATOR.pow(refine)
        return grown.toLong() * rarity.costMultiplier
    }

    /** Copper to reroll one affix, or null while the piece is below the level that allows it. */
    fun rerollCost(rules: EquipmentRules): Long? = if (refine >= EquipmentRules.REROLL_MIN_REFINE) rules.rerollCost else null

    /** Copper the piece sells for: `100 * rarity index * (1 + 0.5 * refine)`, rounded down. */
    fun sellPrice(): Long = SELL_BASE * rarity.index * (2 + refine) / 2

    private companion object {
        const val REFINE_STEPS = 10
        val GROWTH_NUMERATOR: BigInteger = BigInteger.valueOf(17)
        val GROWTH_DENOMINATOR: BigInteger = BigInteger.TEN
        const val SELL_BASE = 100L
    }
}
