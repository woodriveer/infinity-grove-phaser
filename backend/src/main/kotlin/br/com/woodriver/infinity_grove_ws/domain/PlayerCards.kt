package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/** A stack of identical cards: [stars] 0 is a blank card, 9 the best a hero can reach. */
data class CopyKey(
    val heroId: String,
    val stars: Int,
)

/**
 * Everything one player holds about hero cards: the starting element, the leader, the bag (copies per hero and stars)
 * and what they did against chapter bosses. Every change returns a new value; the service stores it under the row lock.
 */
data class PlayerCards(
    val username: String,
    val startingElement: Element,
    val leaderId: String,
    val copies: Map<CopyKey, Int> = emptyMap(),
    val bosses: BossRecord = BossRecord(),
) {
    init {
        require(copies.values.all { it >= 1 }) { "Copy counts must be at least 1, got $copies" }
        require(copies.keys.all { it.stars in 0..MAX_STARS }) { "Stars must be between 0 and $MAX_STARS, got ${copies.keys}" }
    }

    fun copiesOf(
        heroId: String,
        stars: Int,
    ) = copies[CopyKey(heroId, stars)] ?: 0

    fun owned(heroId: String) = copies.keys.any { it.heroId == heroId }

    /** The highest stars among the hero's cards; 0 when the hero holds only blank cards or none. */
    fun starsOf(heroId: String) = copies.keys.filter { it.heroId == heroId }.maxOfOrNull { it.stars } ?: 0

    /** Adds one blank card of [heroId]. */
    fun add(heroId: String): PlayerCards = withCopies(heroId, 0, copiesOf(heroId, 0) + 1)

    /** Turns [FUSION_SIZE] cards of [stars] into one card of the next stars. */
    fun fuse(
        heroId: String,
        stars: Int,
    ): PlayerCards {
        if (stars !in 0..LAST_FUSIBLE_STARS) throw InvalidFusionException("stars $stars cannot be fused")
        if (copiesOf(heroId, stars) < FUSION_SIZE) throw NotEnoughCardsException(heroId, stars)
        logger.info("Fusing cards username={} hero={} stars={}", username, heroId, stars)
        val spent = withCopies(heroId, stars, copiesOf(heroId, stars) - FUSION_SIZE)
        return spent.withCopies(heroId, stars + 1, spent.copiesOf(heroId, stars + 1) + 1)
    }

    fun withLeader(heroId: String): PlayerCards {
        if (!owned(heroId)) throw HeroNotOwnedException(heroId)
        logger.info("Changing leader username={} hero={}", username, heroId)
        return copy(leaderId = heroId)
    }

    fun withBosses(bosses: BossRecord) = copy(bosses = bosses)

    private fun withCopies(
        heroId: String,
        stars: Int,
        count: Int,
    ): PlayerCards {
        val key = CopyKey(heroId, stars)
        return copy(copies = if (count <= 0) copies - key else copies + (key to count))
    }

    companion object {
        private val logger = LoggerFactory.getLogger(PlayerCards::class.java)
        const val FUSION_SIZE = 3
        const val MAX_STARS = 9

        /** The highest stars a fusion takes: 2 until hero-ascension T3 opens the fusions of 3 to 8 stars. */
        const val LAST_FUSIBLE_STARS = 2

        /** A new player: one blank card of the hero of [startingElement], who is also the leader. */
        fun start(
            username: String,
            startingElement: Element,
            heroes: List<Hero>,
        ): PlayerCards {
            ChapterOrder.elements(startingElement)
            val hero = heroes.firstOrNull { it.element == startingElement } ?: error("No hero has the element $startingElement")
            logger.info("Starting cards username={} element={} hero={}", username, startingElement, hero.id)
            return PlayerCards(username, startingElement, hero.id, mapOf(CopyKey(hero.id, 0) to 1))
        }
    }
}
