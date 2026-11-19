package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/**
 * The ally slots one player bought and the hero in each (spec hero-team). Index 0 of [allies] is ally slot 1; an entry is a hero id
 * or null. Every change returns a new value; the services store it under the `player_cards` row lock.
 */
data class Team(
    val boughtSlots: Int = 0,
    val allies: List<String?> = EMPTY_ALLIES,
) {
    init {
        require(boughtSlots in 0..MAX_ALLIES) { "Bought slots $boughtSlots must be between 0 and $MAX_ALLIES" }
        require(allies.size == MAX_ALLIES) { "A team has $MAX_ALLIES ally entries, got ${allies.size}" }
        require(allies.drop(boughtSlots).all { it == null }) { "Allies $allies sit in slots that are not bought ($boughtSlots bought)" }
        require(allies.filterNotNull().let { it.size == it.toSet().size }) { "Allies $allies name a hero twice" }
    }

    /**
     * Buys the next ally slot. [fromSlots] is the bought count the player saw. The checks run in order: request, mismatch, max,
     * locked; a refusal changes nothing. The price is taken by the service.
     */
    fun buy(
        username: String,
        fromSlots: Int,
        bosses: BossRecord,
    ): Team {
        if (fromSlots < 0) {
            logger.warn("Team slot purchase refused, invalid request username={} fromSlots={}", username, fromSlots)
            throw InvalidTeamSlotRequestException("fromSlots must be an integer of at least 0")
        }

        if (fromSlots != boughtSlots) {
            logger.warn("Team slot purchase refused, mismatch username={} sent={} stored={}", username, fromSlots, boughtSlots)
            throw TeamSlotMismatchException(TeamView.of(this, bosses), fromSlots)
        }

        if (boughtSlots == MAX_ALLIES) {
            logger.warn("Team slot purchase refused, max username={}", username)
            throw TeamSlotsMaxException()
        }

        val open = openSlots(bosses)

        if (boughtSlots >= open) {
            logger.warn("Team slot purchase refused, locked username={} bought={} open={}", username, boughtSlots, open)
            throw TeamSlotLockedException()
        }

        val bought = copy(boughtSlots = boughtSlots + 1)
        logger.info("Team slot bought username={} slot={}", username, bought.boughtSlots)
        return bought
    }

    /**
     * The team with [allies] (4 entries, index 0 = slot 1) in place of the current ones. [known] tells whether an id is in the
     * catalog. The checks run in order: invalid, not found, locked, not bought, not owned; a refusal changes nothing.
     */
    fun withAllies(
        allies: List<String?>,
        cards: PlayerCards,
        known: (String) -> Boolean,
    ): Team {
        val ids = allies.filterNotNull()

        if (allies.size != MAX_ALLIES) throw refused(cards, InvalidTeamException("allies must have $MAX_ALLIES entries"))

        val twice = ids.firstOrNull { id -> ids.count { it == id } > 1 }
        if (twice != null) throw refused(cards, InvalidTeamException("hero $twice is named twice"))

        if (cards.leaderId in ids) throw refused(cards, InvalidTeamException("hero ${cards.leaderId} is the leader"))

        val unknown = ids.firstOrNull { !known(it) }
        if (unknown != null) throw refused(cards, HeroNotFoundException(unknown))

        if (!unlocked(cards.bosses)) throw refused(cards, TeamLockedException())

        val notBought = allies.indices.firstOrNull { it >= boughtSlots && allies[it] != null }
        if (notBought != null) throw refused(cards, TeamSlotNotBoughtException(notBought + 1))

        val notOwned = ids.firstOrNull { !cards.owned(it) }
        if (notOwned != null) throw refused(cards, HeroNotOwnedException(notOwned))

        logger.info("Team saved username={} allies={}", cards.username, allies)
        return copy(allies = allies.toList())
    }

    /** The team after [newLeaderId] took the lead from [oldLeaderId]: the slot of the new leader takes the old one; otherwise unchanged. */
    fun afterLeaderChange(
        oldLeaderId: String,
        newLeaderId: String,
    ): Team {
        val index = allies.indexOf(newLeaderId)
        if (index < 0 || oldLeaderId == newLeaderId) return this
        return copy(allies = allies.toMutableList().also { it[index] = oldLeaderId })
    }

    private fun refused(
        cards: PlayerCards,
        error: BusinessException,
    ): BusinessException {
        logger.warn("Team save refused username={} code={}", cards.username, error.code)
        return error
    }

    companion object {
        private val logger = LoggerFactory.getLogger(Team::class.java)
        const val MAX_ALLIES = 4

        /** The copper of ally slots 1 to 4 (1, 2, 3 and 4 ouro). */
        val SLOT_PRICES: List<Long> = listOf(10_000L, 20_000L, 30_000L, 40_000L)

        /** The chapter whose first boss win opens ally slots 1 to 4. */
        val SLOT_CHAPTERS: List<Int> = listOf(5, 6, 7, 8)
        val EMPTY_ALLIES: List<String?> = listOf(null, null, null, null)

        fun unlocked(bosses: BossRecord) = bosses.hasWon(SLOT_CHAPTERS.first())

        fun openSlots(bosses: BossRecord) = SLOT_CHAPTERS.count { bosses.hasWon(it) }
    }
}

/** The team as the player sees it: whether it is unlocked, the open and bought slots, their prices and the allies. */
data class TeamView(
    val unlocked: Boolean,
    val openSlots: Int,
    val boughtSlots: Int,
    val slotPrices: List<Long>,
    val allies: List<String?>,
) {
    companion object {
        fun of(
            team: Team,
            bosses: BossRecord,
        ) = TeamView(Team.unlocked(bosses), Team.openSlots(bosses), team.boughtSlots, Team.SLOT_PRICES, team.allies)
    }
}

/** A leader change or a team save: the leader and the team after it. */
data class LeaderChange(
    val leaderId: String,
    val team: TeamView,
)

/** A bought slot: the team after it and the wallet after the price. */
data class SlotPurchase(
    val team: TeamView,
    val wallet: Wallet,
)
