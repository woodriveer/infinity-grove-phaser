package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class BossRecordTest {
    private val today = LocalDate.of(2026, 10, 18)
    private val tomorrow = today.plusDays(1)

    @Test
    fun `a chapter boss win adds the chapter and one win for today`() {
        val record = BossRecord().afterChapterBossWin(1, today)

        assertTrue(record.hasWon(1))
        assertFalse(record.hasWon(2))
        assertEquals(9, record.winsLeft(today, 10))
    }

    @Test
    fun `wins of the same day add up`() {
        val record = BossRecord().afterChapterBossWin(1, today).afterChapterBossWin(1, today).afterChapterBossWin(1, today)

        assertEquals(7, record.winsLeft(today, 10))
    }

    @Test
    fun `the count starts from zero on a new date`() {
        val record = (1..10).fold(BossRecord()) { acc, _ -> acc.afterChapterBossWin(1, today) }

        assertEquals(0, record.winsLeft(today, 10))
        assertEquals(10, record.winsLeft(tomorrow, 10))
        assertEquals(9, record.afterChapterBossWin(1, tomorrow).winsLeft(tomorrow, 10))
    }

    @Test
    fun `wins left never go below zero`() {
        val record = (1..12).fold(BossRecord()) { acc, _ -> acc.afterChapterBossWin(1, today) }

        assertEquals(0, record.winsLeft(today, 10))
    }

    @Test
    fun `the tenth win is allowed and the eleventh is refused`() {
        val nine = (1..9).fold(BossRecord()) { acc, _ -> acc.afterChapterBossWin(1, today) }
        nine.requireWinsLeft(today, 10)

        val ten = nine.afterChapterBossWin(1, today)

        assertFailsWith<DailyLimitReachedException> { ten.requireWinsLeft(today, 10) }
        ten.requireWinsLeft(tomorrow, 10)
    }

    @Test
    fun `a farm win needs at least the interval after the previous one`() {
        val record = BossRecord().afterFarmWin(now = 100_000, minIntervalMs = 5000)

        assertEquals(100_000L, record.lastFarmWinAt)
        assertFailsWith<FarmTooFastException> { record.afterFarmWin(now = 104_999, minIntervalMs = 5000) }
        assertEquals(105_000L, record.afterFarmWin(now = 105_000, minIntervalMs = 5000).lastFarmWinAt)
    }

    @Test
    fun `the first farm win is never too fast`() {
        assertEquals(1L, BossRecord().afterFarmWin(now = 1, minIntervalMs = 5000).lastFarmWinAt)
    }
}
