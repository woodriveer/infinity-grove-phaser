package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.ProgressView

/** What a reset paid and left: the reward, the crystals and the resets after it, and the campaign back at its start. */
data class ResetResult(
    val reward: Int,
    val crystals: Long,
    val resets: Int,
    val view: ProgressView,
)

interface ResetAccountUseCase {
    /**
     * Gives up the campaign and the talents of the player for crystals, under their progress lock. [fromChapter] is the chapter the player
     * saw: a request made from another stored chapter changes nothing.
     */
    fun reset(
        username: String,
        fromChapter: Int,
    ): ResetResult
}
