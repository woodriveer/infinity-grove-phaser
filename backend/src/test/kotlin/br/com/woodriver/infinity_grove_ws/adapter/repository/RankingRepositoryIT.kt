package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingEntry
import br.com.woodriver.infinity_grove_ws.domain.RankingMe
import br.com.woodriver.infinity_grove_ws.domain.RunClock
import br.com.woodriver.infinity_grove_ws.port.RankingRepositoryPort
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RankingRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var rankings: RankingRepositoryPort

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun fortune(
        username: String,
        copper: Long,
    ) = jdbc.update("insert into player_fortune (username, peak_copper, achieved_at) values (?, ?, ?)", username, copper, 1L)

    private fun bossAchievedAt(username: String): Long =
        jdbc.queryForObject("select achieved_at from player_boss_times where username = ? and chapter = 3", Long::class.java, username)!!

    /** Players `p01` to `p12`: chapter 3 times of 1 000 x n ms reached at n, and `bob` with 500 ms in chapter 4. */
    private fun twelveInChapterThree() {
        val names = (1..12).map { "p%02d".format(it) }
        users("bob", *names.toTypedArray())
        names.forEachIndexed { index, name -> rankings.improveBossTime(name, 3, 1_000L * (index + 1), (index + 1).toLong()) }
        rankings.improveBossTime("bob", 4, 500, 1)
    }

    @Test
    fun `a player without a clock row has both clocks null`() {
        users("ana")

        assertEquals(RunClock("ana"), rankings.clock("ana"))
    }

    @Test
    fun `a saved clock reads back and the next save overwrites both values`() {
        users("ana")

        rankings.saveClock(RunClock("ana", 5, 7))
        assertEquals(RunClock("ana", 5, 7), rankings.clock("ana"))

        rankings.saveClock(RunClock("ana", 5, null))
        assertEquals(RunClock("ana", 5, null), rankings.clock("ana"))
    }

    @Test
    fun `a first boss time is stored and a smaller one replaces it`() {
        users("ana")

        assertTrue(rankings.improveBossTime("ana", 3, 12_345, 1))
        assertTrue(rankings.improveBossTime("ana", 3, 9_000, 2))

        assertEquals(listOf(RankingEntry(1, "ana", 9000.0)), rankings.top(RankingBoard.BOSS_TIME, 3, 10))
    }

    @Test
    fun `an equal or larger boss time is not stored`() {
        users("ana")
        rankings.improveBossTime("ana", 3, 12_345, 1)

        assertFalse(rankings.improveBossTime("ana", 3, 15_000, 2))
        assertFalse(rankings.improveBossTime("ana", 3, 12_345, 3))

        assertEquals(listOf(RankingEntry(1, "ana", 12345.0)), rankings.top(RankingBoard.BOSS_TIME, 3, 10))
        assertEquals(1L, bossAchievedAt("ana"))
    }

    @Test
    fun `the story time and the click power keep the better value`() {
        users("ana", "bob")

        assertTrue(rankings.improveStoryTime("ana", 3_600_000, 1))
        assertFalse(rankings.improveStoryTime("ana", 4_000_000, 2))
        assertTrue(rankings.improveStoryTime("ana", 3_000_000, 3))
        assertEquals(listOf(RankingEntry(1, "ana", 3_000_000.0)), rankings.top(RankingBoard.STORY_TIME, null, 10))

        assertTrue(rankings.improveClickPower("ana", 41.0, 1))
        assertFalse(rankings.improveClickPower("ana", 33.0, 2))
        assertTrue(rankings.improveClickPower("ana", 50.0, 3))
        assertEquals(50.0, rankings.clickPower("ana"))
        assertNull(rankings.clickPower("bob"))
    }

    @Test
    fun `the boss board lists one chapter in ascending time, at most the limit`() {
        twelveInChapterThree()

        val top = rankings.top(RankingBoard.BOSS_TIME, 3, 10)

        assertEquals(10, top.size)
        assertEquals((1..10).toList(), top.map { it.position })
        assertEquals((1..10).map { "p%02d".format(it) }, top.map { it.username })
        assertEquals((1..10).map { 1000.0 * it }, top.map { it.value })
        assertFalse(top.any { it.username == "bob" })
    }

    @Test
    fun `a tie goes to the earlier record, then to the username in code-point order`() {
        users("ana", "cid", "Bob")
        rankings.improveBossTime("ana", 3, 5_000, 20)
        rankings.improveBossTime("cid", 3, 5_000, 10)
        rankings.improveBossTime("Bob", 3, 5_000, 20)

        assertEquals(listOf("cid", "Bob", "ana"), rankings.top(RankingBoard.BOSS_TIME, 3, 10).map { it.username })
    }

    @Test
    fun `the power and fortune boards list the largest first and the fortune board leaves out 0`() {
        users("ana", "bob", "cid")
        rankings.improveClickPower("ana", 41.0, 1)
        rankings.improveClickPower("bob", 16.5, 1)
        fortune("ana", 500)
        fortune("bob", 0)
        fortune("cid", 700)

        assertEquals(listOf(41.0, 16.5), rankings.top(RankingBoard.CLICK_POWER, null, 10).map { it.value })
        assertEquals(listOf("cid", "ana"), rankings.top(RankingBoard.FORTUNE, null, 10).map { it.username })
    }

    @Test
    fun `me gives the caller's position and value`() {
        twelveInChapterThree()

        assertEquals(RankingMe(12, "p12", 12000.0), rankings.me(RankingBoard.BOSS_TIME, 3, "p12"))
        assertEquals(1, rankings.me(RankingBoard.BOSS_TIME, 3, "p01")!!.position)
    }

    @Test
    fun `me is null without a record and for a fortune peak of 0`() {
        users("ana", "bob")
        fortune("bob", 0)

        assertNull(rankings.me(RankingBoard.STORY_TIME, null, "ana"))
        assertNull(rankings.me(RankingBoard.FORTUNE, null, "bob"))
    }

    @Test
    fun `the story board orders ascending`() {
        users("ana", "bob")
        rankings.improveStoryTime("ana", 3_600_000, 1)
        rankings.improveStoryTime("bob", 1_365_000, 2)

        assertEquals(listOf("bob", "ana"), rankings.top(RankingBoard.STORY_TIME, null, 10).map { it.username })
    }
}
