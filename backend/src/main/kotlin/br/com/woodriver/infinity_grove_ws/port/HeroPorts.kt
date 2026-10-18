package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards

interface HeroRepositoryPort {
    /** Every hero of the catalog in catalog order. */
    fun findAll(): List<Hero>

    fun findById(id: String): Hero?

    fun existsById(id: String): Boolean

    /** Stores [hero] at position [order] of the catalog. */
    fun save(
        hero: Hero,
        order: Int,
    )
}

interface PlayerCardsRepositoryPort {
    /** Returns the player's cards and locks them until the surrounding transaction ends, so concurrent changes run one after the other. */
    fun findForUpdate(username: String): PlayerCards?

    /** Stores [cards] only when the player has none yet; a concurrent insert for the same player is not an error. */
    fun createIfAbsent(cards: PlayerCards)

    fun save(cards: PlayerCards): PlayerCards

    fun deleteByUsername(username: String)
}

interface ChanceRollerPort {
    /** Returns a uniform number from 0 (inclusive) to 1 (exclusive). */
    fun roll(): Double
}
