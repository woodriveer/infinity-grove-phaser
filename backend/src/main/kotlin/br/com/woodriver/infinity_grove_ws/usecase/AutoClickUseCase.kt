package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.PlayerAutoClick

interface GetAutoClickUseCase {
    /** Returns the auto click level and the crystals of the player. */
    fun get(username: String): PlayerAutoClick
}

interface UpgradeAutoClickUseCase {
    /**
     * Raises the auto click by one level for its crystals, under the progress lock of the player. [fromLevel] is the level the player saw:
     * a request made for another stored level changes and costs nothing.
     */
    fun upgrade(
        username: String,
        fromLevel: Int,
    ): PlayerAutoClick
}
