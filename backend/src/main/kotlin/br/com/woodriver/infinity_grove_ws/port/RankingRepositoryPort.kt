package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingEntry
import br.com.woodriver.infinity_grove_ws.domain.RankingMe
import br.com.woodriver.infinity_grove_ws.domain.RunClock

interface RankingRepositoryPort {
    /** The clocks of [username]; both null when the player has no row. */
    fun clock(username: String): RunClock

    /** Writes both clocks of [clock] (insert or update). */
    fun saveClock(clock: RunClock)

    /** Stores [ms] as the boss time of [chapter] at [at] when the player has none or a larger one; true when it was stored. */
    fun improveBossTime(
        username: String,
        chapter: Int,
        ms: Long,
        at: Long,
    ): Boolean

    /** Stores [ms] as the story time when the player has none or a larger one; true when it was stored. */
    fun improveStoryTime(
        username: String,
        ms: Long,
        at: Long,
    ): Boolean

    /** Stores [power] when the player has none or a smaller one; true when it was stored. */
    fun improveClickPower(
        username: String,
        power: Double,
        at: Long,
    ): Boolean

    /** The stored best click power; null when none. */
    fun clickPower(username: String): Double?

    /** The first [limit] rows of [board] ([chapter] only for BOSS_TIME), positions 1..n in board order. */
    fun top(
        board: RankingBoard,
        chapter: Int?,
        limit: Int,
    ): List<RankingEntry>

    /** The caller's row on [board]; null when they have none (a fortune peak of 0 is none). */
    fun me(
        board: RankingBoard,
        chapter: Int?,
        username: String,
    ): RankingMe?
}
