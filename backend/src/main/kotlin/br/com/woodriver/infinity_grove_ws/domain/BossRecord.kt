package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate

/**
 * What a player has done against chapter bosses: the chapters whose boss they have beaten, how many chapter boss wins they made
 * on [winsDay] (a UTC date) and when their last farm win was (null when never).
 */
data class BossRecord(
    val clearedChapters: Set<Int> = emptySet(),
    val winsDay: LocalDate? = null,
    val winsToday: Int = 0,
    val lastFarmWinAt: Long? = null,
) {
    fun hasWon(chapter: Int) = chapter in clearedChapters

    /** Wins counted on [today]; a count of another date does not carry over. */
    private fun winsOn(today: LocalDate) = if (winsDay == today) winsToday else 0

    fun winsLeft(
        today: LocalDate,
        limit: Int,
    ) = maxOf(0, limit - winsOn(today))

    fun requireWinsLeft(
        today: LocalDate,
        limit: Int,
    ) {
        if (winsOn(today) >= limit) throw DailyLimitReachedException(limit)
    }

    fun afterChapterBossWin(
        chapter: Int,
        today: LocalDate,
    ) = copy(clearedChapters = clearedChapters + chapter, winsDay = today, winsToday = winsOn(today) + 1)

    /** Records a farm win at [now]; a win less than [minIntervalMs] after the previous one is refused. */
    fun afterFarmWin(
        now: Long,
        minIntervalMs: Long,
    ): BossRecord {
        val last = lastFarmWinAt
        if (last != null && now - last < minIntervalMs) throw FarmTooFastException(minIntervalMs)
        return copy(lastFarmWinAt = now)
    }
}
