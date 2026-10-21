package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory
import kotlin.math.pow

enum class TalentBranch { TIME, BREAK, POWER }

/**
 * One talent of the tree. [perLevel] is what one level gives, in [unit] (`s` seconds, `points`, `%`): the game turns the value of a TIME or
 * POWER talent into a bonus and the value of a BREAK talent into a reduction of the monster stat it names.
 */
data class TalentDefinition(
    val id: String,
    val branch: TalentBranch,
    val label: String,
    val unit: String,
    val perLevel: Int,
    val maxLevel: Int = MAX_LEVEL,
) {
    init {
        require(perLevel >= 1) { "Talent $id per-level $perLevel must be at least 1" }
        require(maxLevel >= 1) { "Talent $id max-level $maxLevel must be at least 1" }
    }

    /** What [level] levels give. */
    fun valueAt(level: Int): Int = level * perLevel

    /** A level the client claims to have seen must lie between 0 and the top level. */
    fun requireSeenLevel(level: Int?): Int {
        if (level == null || level < 0 || level > maxLevel) {
            throw TalentRequestException("fromLevel must be an integer between 0 and $maxLevel")
        }
        return level
    }

    companion object {
        const val MAX_LEVEL = 10
    }
}

/** The 8 talents of the three branches: Tempo, Quebra de defesa and Poder do clique. */
object TalentCatalog {
    val all: List<TalentDefinition> =
        listOf(
            TalentDefinition("MINIBOSS_TIME", TalentBranch.TIME, "Tempo do miniboss", "s", 2),
            TalentDefinition("BOSS_TIME", TalentBranch.TIME, "Tempo do chefe do capítulo", "s", 3),
            TalentDefinition("PHYSICAL_BREAK", TalentBranch.BREAK, "Quebra de defesa física", "points", 1),
            TalentDefinition("MAGICAL_BREAK", TalentBranch.BREAK, "Quebra de defesa mágica", "points", 1),
            TalentDefinition("CRIT_RESIST_BREAK", TalentBranch.BREAK, "Quebra de resistência a crítico", "points", 1),
            TalentDefinition("CLICK_DAMAGE", TalentBranch.POWER, "Dano de clique", "%", 3),
            TalentDefinition("CRIT_CHANCE", TalentBranch.POWER, "Chance de crítico", "points", 1),
            TalentDefinition("CRIT_DAMAGE", TalentBranch.POWER, "Dano crítico", "%", 5),
        )

    fun find(id: String): TalentDefinition = all.firstOrNull { it.id == id } ?: throw TalentNotFoundException(id)
}

/** The numbers an operator tunes (`app.talents`): the upgrade from level `n` costs `round(baseCost x growth^n)` copper, the same curve for every talent. */
data class TalentRules(
    val baseCost: Long = 300,
    val growth: Double = 1.6,
) {
    init {
        require(baseCost >= 0) { "base-cost $baseCost must not be negative" }
        require(growth >= 1.0) { "growth $growth must be at least 1" }
    }

    /** The copper that raises a talent from [level] to the next one. */
    fun cost(level: Int): Long = Math.round(baseCost * growth.pow(level))
}

/** A talent raised by one level and what it cost. */
data class TalentUpgrade(
    val talents: PlayerTalents,
    val cost: Long,
)

/**
 * The levels one player has bought. A talent with no entry is at level 0. Every change returns a new value; the service stores it under
 * the wallet lock.
 */
data class PlayerTalents(
    val username: String,
    val levels: Map<String, Int> = emptyMap(),
) {
    init {
        require(levels.keys.all { id -> TalentCatalog.all.any { it.id == id } }) { "Every talent of $username must be in the catalog" }
        require(levels.values.all { it in 1..TalentDefinition.MAX_LEVEL }) { "Stored levels must be between 1 and ${TalentDefinition.MAX_LEVEL}" }
    }

    fun level(id: String): Int = levels[id] ?: 0

    /** The copper of the next level of [definition], null at its top level. */
    fun nextCost(
        definition: TalentDefinition,
        rules: TalentRules,
    ): Long? = level(definition.id).takeIf { it < definition.maxLevel }?.let(rules::cost)

    /**
     * Raises [definition] by one level. [fromLevel] is the level the player saw: any other stored level means a repeated or stale request
     * and nothing changes. Returns the new levels and the copper the level costs; the caller takes the copper in the same transaction.
     */
    fun upgrade(
        definition: TalentDefinition,
        fromLevel: Int,
        rules: TalentRules,
    ): TalentUpgrade {
        val stored = level(definition.id)

        if (fromLevel != stored) {
            logger.warn("Talent upgrade refused, level mismatch username={} talent={} sent={} stored={}", username, definition.id, fromLevel, stored)
            throw TalentLevelMismatchException(definition.id, fromLevel, stored)
        }

        if (stored >= definition.maxLevel) {
            logger.warn("Talent upgrade refused, max level username={} talent={}", username, definition.id)
            throw TalentMaxLevelException(definition.id)
        }

        val cost = rules.cost(stored)
        logger.info("Talent upgrade accepted username={} talent={} level={} copper={}", username, definition.id, stored + 1, cost)
        return TalentUpgrade(copy(levels = levels + (definition.id to stored + 1)), cost)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(PlayerTalents::class.java)
    }
}
