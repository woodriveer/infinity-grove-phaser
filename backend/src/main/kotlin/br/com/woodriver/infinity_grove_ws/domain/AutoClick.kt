package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/**
 * The numbers an operator tunes (`app.auto-click`): the click interval of every level (level 0 first, each one faster) and the crystals
 * of the upgrade to each level after 0, so [prices] has one entry less than [intervalsMs].
 */
data class AutoClickRules(
    val intervalsMs: List<Int> = listOf(500, 250, 150, 100, 50),
    val prices: List<Long> = listOf(10, 25, 50, 100),
) {
    init {
        require(intervalsMs.size == prices.size + 1) { "intervals-ms needs one entry more than prices" }
        require(intervalsMs.all { it >= 1 }) { "Every interval must be at least 1 ms" }
        require(intervalsMs.zipWithNext().all { it.second < it.first }) { "Every interval must be faster than the one before" }
        require(prices.all { it >= 1 }) { "Every price must be at least 1 crystal" }
    }

    val maxLevel: Int get() = prices.size

    fun intervalAt(level: Int): Int = intervalsMs[level]

    /** The crystals of the upgrade that reaches [level] (1 to [maxLevel]). */
    fun priceTo(level: Int): Long = prices[level - 1]
}

/** The next upgrade of the auto click: the level it reaches, the interval of that level and its price in crystals. */
data class AutoClickStep(
    val level: Int,
    val intervalMs: Int,
    val price: Long,
)

/** The auto click opens once the chapter 1 boss is beaten: chapter 2 or later, or a completed campaign. */
fun autoClickUnlocked(progress: Progress): Boolean = progress.completed || progress.position.chapter >= 2

/** One player's auto click level and crystal balance. Every change returns a new value; the service stores it under the progress lock. */
data class PlayerAutoClick(
    val username: String,
    val level: Int = 0,
    val crystals: Long = 0,
) {
    init {
        require(level >= 0) { "Auto click level $level must not be negative" }
        require(crystals >= 0) { "Crystals $crystals must not be negative" }
    }

    fun intervalMs(rules: AutoClickRules): Int = rules.intervalAt(level)

    /** The upgrade after the current level, null at the top level. */
    fun next(rules: AutoClickRules): AutoClickStep? =
        if (level >= rules.maxLevel) null else AutoClickStep(level + 1, rules.intervalAt(level + 1), rules.priceTo(level + 1))

    /**
     * Raises the level by one for its price. [fromLevel] is the level the player saw: any other stored level means a repeated or stale
     * request. The checks run in order mismatch, max level, chapter, crystals, and a refusal changes nothing.
     */
    fun upgrade(
        fromLevel: Int,
        unlocked: Boolean,
        rules: AutoClickRules,
    ): PlayerAutoClick {
        if (fromLevel < 0) throw AutoClickRequestException("fromLevel must be an integer of at least 0")

        if (fromLevel != level) {
            logger.warn("Auto click upgrade refused, level mismatch username={} sent={} stored={}", username, fromLevel, level)
            throw AutoClickLevelMismatchException(this, rules, fromLevel)
        }

        val step = next(rules)

        if (step == null) {
            logger.warn("Auto click upgrade refused, max level username={} level={}", username, level)
            throw AutoClickMaxLevelException()
        }

        if (!unlocked) {
            logger.warn("Auto click upgrade refused, locked username={} level={}", username, level)
            throw AutoClickLockedException()
        }

        if (crystals < step.price) {
            logger.warn("Auto click upgrade refused, not enough crystals username={} crystals={} price={}", username, crystals, step.price)
            throw NotEnoughCrystalsException(crystals, step.price)
        }

        logger.info("Auto click upgraded username={} from={} to={} price={}", username, level, step.level, step.price)
        return copy(level = step.level, crystals = crystals - step.price)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(PlayerAutoClick::class.java)
    }
}
