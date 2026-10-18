package br.com.woodriver.infinity_grove_ws.domain

/** The numbers behind the card drops: both chances (0 to 1), the chapter boss wins allowed per UTC day and the farm win spacing. */
data class CardDropRates(
    val minibossRate: Double,
    val chapterBossRate: Double,
    val chapterBossDailyLimit: Int,
    val farmMinIntervalMs: Long,
) {
    init {
        require(minibossRate in 0.0..1.0) { "miniboss-rate $minibossRate must be between 0 and 1" }
        require(chapterBossRate in 0.0..1.0) { "chapter-boss-rate $chapterBossRate must be between 0 and 1" }
        require(chapterBossDailyLimit >= 1) { "chapter-boss-daily-limit $chapterBossDailyLimit must be at least 1" }
        require(farmMinIntervalMs >= 0) { "farm-min-interval-ms $farmMinIntervalMs must not be negative" }
    }
}

/** The card a won boss dropped: the hero's id and name, and its stars (always 0, a blank card). */
data class CardDrop(
    val heroId: String,
    val heroName: String,
    val stars: Int = 0,
)

object CardDropper {
    /**
     * The hero whose blank card drops for a won [encounter] of [chapter], or null. A miniboss drops the hero of its chapter; the chapter
     * boss releases the hero of the next chapter (the last chapter's boss drops its own hero), with certainty on the player's
     * first win of it. [chance] returns a number from 0 (inclusive) to 1 and is read only when a roll is needed.
     */
    fun drop(
        encounter: Encounter,
        chapter: Int,
        startingElement: Element,
        firstChapterBossWin: Boolean,
        rates: CardDropRates,
        heroes: List<Hero>,
        chance: () -> Double,
    ): Hero? {
        val target =
            when (encounter) {
                Encounter.PHASE -> return null
                Encounter.MINIBOSS -> if (chance() < rates.minibossRate) chapter else return null
                Encounter.CHAPTER_BOSS ->
                    if (firstChapterBossWin || chance() < rates.chapterBossRate) {
                        minOf(chapter + 1, ChapterOrder.MAX_CHAPTER)
                    } else {
                        return null
                    }
            }
        val element = ChapterOrder.element(startingElement, target)
        return heroes.firstOrNull { it.element == element }
    }
}
