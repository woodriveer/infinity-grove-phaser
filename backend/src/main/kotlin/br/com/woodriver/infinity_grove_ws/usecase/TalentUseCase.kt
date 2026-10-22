package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.PlayerTalents

interface ListTalentsUseCase {
    /** Returns the level of every talent of the player and the points they earned. */
    fun list(username: String): PlayerTalents
}

interface UpgradeTalentUseCase {
    /**
     * Raises [talentId] by one level for the talent points it costs, under the progress lock of the player. [fromLevel] is the level the
     * player saw: a request made for another stored level changes and costs nothing.
     */
    fun upgrade(
        username: String,
        talentId: String,
        fromLevel: Int,
    ): PlayerTalents
}
