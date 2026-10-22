package br.com.woodriver.infinity_grove_ws.domain

/**
 * Rolls the pieces that bosses drop. Every random number comes from `chance`, a function returning a number from 0 (inclusive) to 1
 * (exclusive), read in a fixed order: the drop, the rarity, the slot, the weapon's click damage, then for each affix its type and value.
 */
object PieceRoller {
    private const val WEAPON_CLICK_MIN = 2
    private const val WEAPON_CLICK_MAX = 5

    /** The first chapter whose bosses can drop a rare piece; before it only common and uncommon ones fall. */
    const val RARE_FROM_CHAPTER = 4

    /** The first chapter whose boss can drop epic and legendary pieces; the chapter before it only reaches rare. */
    const val EPIC_FROM_CHAPTER = 5

    private val earlyMinibossWeights = listOf(Rarity.COMMON to 65, Rarity.UNCOMMON to 35)
    private val minibossWeights = listOf(Rarity.COMMON to 60, Rarity.UNCOMMON to 30, Rarity.RARE to 10)
    private val earlyChapterBossWeights = listOf(Rarity.COMMON to 30, Rarity.UNCOMMON to 70)
    private val rareChapterBossWeights = listOf(Rarity.UNCOMMON to 40, Rarity.RARE to 60)
    private val chapterBossWeights = listOf(Rarity.UNCOMMON to 40, Rarity.RARE to 40, Rarity.EPIC to 15, Rarity.LEGENDARY to 5)

    private fun minibossWeights(chapter: Int) = if (chapter >= RARE_FROM_CHAPTER) minibossWeights else earlyMinibossWeights

    private fun chapterBossWeights(chapter: Int) =
        when {
            chapter >= EPIC_FROM_CHAPTER -> chapterBossWeights
            chapter >= RARE_FROM_CHAPTER -> rareChapterBossWeights
            else -> earlyChapterBossWeights
        }

    /**
     * The piece a won [encounter] of [chapter] drops for [username], or null. A phase never drops; the chance of the others comes from
     * [rules] and the rarities that can fall grow with the chapter. The default [chapter] is the last one, where nothing is held back.
     */
    fun roll(
        encounter: Encounter,
        rules: EquipmentRules,
        username: String,
        id: String,
        chance: () -> Double,
        chapter: Int = ChapterOrder.MAX_CHAPTER,
    ): Piece? {
        val (rate, weights) =
            when (encounter) {
                Encounter.PHASE -> return null
                Encounter.MINIBOSS -> rules.minibossRate to minibossWeights(chapter)
                Encounter.CHAPTER_BOSS -> rules.chapterBossRate to chapterBossWeights(chapter)
            }
        if (chance() >= rate) return null
        val rarity = pickWeighted(weights, chance)
        val slot = Slot.entries[pick(Slot.entries.size, chance)]
        val baseClick = if (slot == Slot.WEAPON) rarity.scale(between(WEAPON_CLICK_MIN, WEAPON_CLICK_MAX, chance)) else null
        val remaining = AffixType.allowedOn(slot).toMutableList()
        val affixes =
            List(rarity.affixCount) {
                val type = remaining.removeAt(pick(remaining.size, chance))
                affix(type, rarity, chance)
            }
        return Piece(id, username, slot, rarity, baseClick, refine = 0, affixes = affixes)
    }

    /** An affix of [type] with a value drawn between its bounds and scaled by the [rarity] multiplier. */
    fun affix(
        type: AffixType,
        rarity: Rarity,
        chance: () -> Double,
    ): Affix = Affix(type, rarity.scale(between(type.min, type.max, chance)))

    /** An index from 0 to [size] - 1, uniform. */
    fun pick(
        size: Int,
        chance: () -> Double,
    ): Int = minOf(size - 1, (chance() * size).toInt())

    private fun between(
        min: Int,
        max: Int,
        chance: () -> Double,
    ): Int = min + pick(max - min + 1, chance)

    private fun pickWeighted(
        weights: List<Pair<Rarity, Int>>,
        chance: () -> Double,
    ): Rarity {
        val total = weights.sumOf { it.second }
        val point = chance() * total
        var upTo = 0
        for ((rarity, weight) in weights) {
            upTo += weight
            if (point < upTo) return rarity
        }
        return weights.last().first
    }
}
