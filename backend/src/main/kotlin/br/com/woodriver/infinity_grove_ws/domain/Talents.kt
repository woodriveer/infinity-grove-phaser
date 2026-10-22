package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

enum class TalentBranch { TIME, BREAK, POWER, COMBO }

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

/** The 9 talents of the four branches: Tempo, Quebra de defesa, Poder do clique and Combo (the cap of the combo bonus). */
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
            TalentDefinition("COMBO", TalentBranch.COMBO, "Limite de dano do combo", "%", 5),
        )

    fun find(id: String): TalentDefinition = all.firstOrNull { it.id == id } ?: throw TalentNotFoundException(id)
}

/** A first clear of a position: the key that makes it pay once and the points it pays. */
data class TalentAward(
    val key: String,
    val points: Int,
)

/**
 * The numbers an operator tunes (`app.talents`): what one talent level costs in talent points and what the first clear of a phase, a
 * miniboss and a chapter boss pays.
 */
data class TalentRules(
    val costPerLevel: Int = 1,
    val pointsPerPhase: Int = 1,
    val pointsPerMiniboss: Int = 2,
    val pointsPerChapterBoss: Int = 5,
) {
    init {
        require(costPerLevel >= 1) { "cost-per-level $costPerLevel must be at least 1" }
        require(pointsPerPhase >= 0 && pointsPerMiniboss >= 0 && pointsPerChapterBoss >= 0) { "Points per clear must not be negative" }
    }

    /** What clearing [position] pays; its key is the same for every clear of that position, so only the first one pays. */
    fun award(position: ProgressPosition): TalentAward =
        TalentAward(
            key = "${position.chapter}:${position.stage}:${position.encounter}:${position.phase}",
            points =
                when (position.encounter) {
                    Encounter.PHASE -> pointsPerPhase
                    Encounter.MINIBOSS -> pointsPerMiniboss
                    Encounter.CHAPTER_BOSS -> pointsPerChapterBoss
                },
        )
}

/** The talent points of a player: what the first clears paid, what the levels took and what is left. */
data class TalentPoints(
    val earned: Int,
    val spent: Int,
) {
    val available: Int get() = earned - spent
}

/** A talent raised by one level and the points it cost. */
data class TalentUpgrade(
    val talents: PlayerTalents,
    val cost: Int,
)

/**
 * The levels one player has bought and the points their first clears paid ([earned]). A talent with no entry is at level 0. Every change
 * returns a new value; the service stores it under the progress lock.
 */
data class PlayerTalents(
    val username: String,
    val levels: Map<String, Int> = emptyMap(),
    val earned: Int = 0,
) {
    init {
        require(levels.keys.all { id -> TalentCatalog.all.any { it.id == id } }) { "Every talent of $username must be in the catalog" }
        require(levels.values.all { it in 1..TalentDefinition.MAX_LEVEL }) {
            "Stored levels must be between 1 and ${TalentDefinition.MAX_LEVEL}"
        }
        require(earned >= 0) { "Earned points $earned must not be negative" }
    }

    fun level(id: String): Int = levels[id] ?: 0

    /** The points the levels already bought took. */
    fun points(rules: TalentRules) = TalentPoints(earned, levels.values.sum() * rules.costPerLevel)

    /** The points of the next level of [definition], null at its top level. */
    fun nextCost(
        definition: TalentDefinition,
        rules: TalentRules,
    ): Int? = rules.costPerLevel.takeIf { level(definition.id) < definition.maxLevel }

    /**
     * Raises [definition] by one level. [fromLevel] is the level the player saw: any other stored level means a repeated or stale request
     * and nothing changes. Returns the new levels and the points the level costs; they are derived from the levels, so the caller stores only the level.
     */
    fun upgrade(
        definition: TalentDefinition,
        fromLevel: Int,
        rules: TalentRules,
    ): TalentUpgrade {
        val stored = level(definition.id)

        if (fromLevel != stored) {
            logger.warn(
                "Talent upgrade refused, level mismatch username={} talent={} sent={} stored={}",
                username,
                definition.id,
                fromLevel,
                stored,
            )
            throw TalentLevelMismatchException(definition.id, fromLevel, stored)
        }

        if (stored >= definition.maxLevel) {
            logger.warn("Talent upgrade refused, max level username={} talent={}", username, definition.id)
            throw TalentMaxLevelException(definition.id)
        }

        val cost = rules.costPerLevel
        val available = points(rules).available

        if (available < cost) {
            logger.warn(
                "Talent upgrade refused, not enough points username={} talent={} available={} cost={}",
                username,
                definition.id,
                available,
                cost,
            )
            throw NotEnoughTalentPointsException(available, cost)
        }

        logger.info("Talent upgrade accepted username={} talent={} level={} points={}", username, definition.id, stored + 1, cost)
        return TalentUpgrade(copy(levels = levels + (definition.id to stored + 1)), cost)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(PlayerTalents::class.java)
    }
}
