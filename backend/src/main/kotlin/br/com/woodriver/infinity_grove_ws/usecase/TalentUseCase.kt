package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.PlayerTalents
import br.com.woodriver.infinity_grove_ws.domain.Wallet

/** The talents and the wallet of the player after an upgrade took copper. */
data class TalentChange(
    val talents: PlayerTalents,
    val wallet: Wallet,
)

interface ListTalentsUseCase {
    /** Returns the level of every talent of the player. */
    fun list(username: String): PlayerTalents
}

interface UpgradeTalentUseCase {
    /**
     * Raises [talentId] by one level for the copper it costs, in one transaction with the wallet. [fromLevel] is the level the player saw:
     * a request made for another stored level changes and costs nothing.
     */
    fun upgrade(
        username: String,
        talentId: String,
        fromLevel: Int,
    ): TalentChange
}
