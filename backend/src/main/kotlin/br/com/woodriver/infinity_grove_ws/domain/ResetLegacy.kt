package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/** One chapter of a legacy: the chapter and its percent (50 or 100). */
data class LegacyChapter(
    val chapter: Int,
    val percent: Int,
)

/**
 * What the account resets of a player left (spec reset-legacy-drops): a percent per chapter, 50 or 100, raised by 50 by each reset at that
 * chapter. Only the best one acts: the chapter with the largest percent times its coin factor, the higher chapter on a tie. It adds a share
 * of that chapter's copper to every kill and lets pieces roll the rarity of that chapter.
 */
data class ResetLegacy(
    val username: String,
    val percents: Map<Int, Int> = emptyMap(),
) {
    init {
        require(percents.keys.all { it in 1..ChapterOrder.MAX_CHAPTER }) {
            "Legacy chapters of $username must be between 1 and ${ChapterOrder.MAX_CHAPTER}"
        }
        require(percents.values.all { it == STEP || it == MAX_PERCENT }) { "Legacy percents of $username must be $STEP or $MAX_PERCENT" }
    }

    /** The legacy after a reset that counts [chapter]: that chapter rises by [STEP] up to [MAX_PERCENT], the others stay. */
    fun afterReset(chapter: Int): ResetLegacy {
        require(chapter in 1..ChapterOrder.MAX_CHAPTER) { "Reset chapter $chapter must be between 1 and ${ChapterOrder.MAX_CHAPTER}" }
        val raised = minOf(MAX_PERCENT, (percents[chapter] ?: 0) + STEP)
        return copy(percents = percents + (chapter to raised))
    }

    /** The chapter whose percent times coin factor is largest, the higher chapter on a tie; null without legacy. */
    fun best(): LegacyChapter? =
        chapters().maxWithOrNull(
            compareBy<LegacyChapter> { it.percent * ChapterDefinition.coinFactor(it.chapter) }.thenBy { it.chapter },
        )

    /** Every stored chapter, ascending. */
    fun chapters(): List<LegacyChapter> = percents.toSortedMap().map { (chapter, percent) -> LegacyChapter(chapter, percent) }

    /**
     * The drop table of this player: each seeded rule (ids 1 to [SEEDED_RULES]) gains the best legacy's percent of the range of the same kind
     * of kill (phase, miniboss, boss) of the best chapter. Other rules, and a table without the legacy rule, stay as they are.
     */
    fun boost(table: DropTable): DropTable {
        val best = best() ?: return table
        return DropTable(
            table.rules.map { rule ->
                val legacy = legacyRule(table, best, rule.id)
                if (legacy == null) {
                    rule
                } else {
                    rule.copy(
                        minCopper = rule.minCopper + best.percent * legacy.minCopper / PERCENT,
                        maxCopper = rule.maxCopper + best.percent * legacy.maxCopper / PERCENT,
                    )
                }
            },
        )
    }

    /**
     * The chapter whose rarity weights a piece of [chapter] rolls: the best legacy chapter when it is above [chapter] and [chance] falls
     * below its percent, else [chapter]. [chance] is read only when the best chapter is above [chapter].
     */
    fun rarityChapter(
        chapter: Int,
        chance: () -> Double,
    ): Int {
        val best = best()
        if (best == null || best.chapter <= chapter) return chapter
        val rolled = if (chance() < best.percent / PERCENT.toDouble()) best.chapter else chapter
        logger.debug("Legacy rarity chapter={} best={} percent={} rarityChapter={}", chapter, best.chapter, best.percent, rolled)
        return rolled
    }

    private fun legacyRule(
        table: DropTable,
        best: LegacyChapter,
        id: Int,
    ): DropRule? =
        if (id in 1..SEEDED_RULES) {
            table.ruleFor(RULES_PER_CHAPTER * best.chapter - 2 + (id - 1) % RULES_PER_CHAPTER)
        } else {
            null
        }

    companion object {
        const val STEP = 50
        const val MAX_PERCENT = 100
        const val SEEDED_RULES = 45
        private const val RULES_PER_CHAPTER = 3
        private const val PERCENT = 100
        private val logger = LoggerFactory.getLogger(ResetLegacy::class.java)
    }
}
