package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryRankingRepository
import br.com.woodriver.infinity_grove_ws.InMemoryResetRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTeamRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.RunClock
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.domain.User
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RecordKeeperTest {
    private val clock = MutableClock(0)
    private val rankings = InMemoryRankingRepository()
    private val users = InMemoryUserRepository()
    private val resets = InMemoryResetRepository()
    private val chapters = InMemoryChapterRepository(*(1..15).map(ChapterDefinition::of).toTypedArray())
    private val cards = InMemoryPlayerCardsRepository()
    private val equipment = InMemoryEquipmentRepository()
    private val teams = InMemoryTeamRepository()
    private val talents = InMemoryTalentRepository()
    private val keeper = RecordKeeper(rankings, users, resets, chapters, cards, equipment, teams, talents, clock)

    init {
        users.save(User("ana", "h", createdAt = 0, lastLoginAt = 0))
        cards.save(PlayerCards("ana", Element.FIRE, "kael", mapOf(CopyKey("kael", 0) to 1)))
    }

    private fun pos(
        chapter: Int,
        stage: Int,
        encounter: Encounter,
        phase: Int = 1,
    ) = ProgressPosition(chapter, stage, encounter, phase)

    private fun at(
        position: ProgressPosition,
        completed: Boolean = false,
    ) = Progress("ana", position, completed)

    private fun lastMiniboss(chapter: Int) =
        keeper.onOutcome("ana", pos(chapter, 10, Encounter.MINIBOSS), Outcome.CLEARED, at(pos(chapter, 10, Encounter.CHAPTER_BOSS)))

    private fun bossWin(chapter: Int) =
        keeper.onOutcome(
            "ana",
            pos(chapter, 10, Encounter.CHAPTER_BOSS),
            Outcome.CLEARED,
            if (chapter < 15) at(pos(chapter + 1, 1, Encounter.PHASE)) else at(pos(15, 10, Encounter.CHAPTER_BOSS), completed = true),
        )

    /** A boss fight of [chapter]: the last miniboss won at [from] and the chapter boss at [to]. */
    private fun fight(
        chapter: Int,
        from: Long,
        to: Long,
    ) {
        clock.millis = from
        lastMiniboss(chapter)
        clock.millis = to
        bossWin(chapter)
    }

    private fun weapon(
        base: Int,
        heroId: String = "kael",
    ) = Piece("w-$heroId", "ana", Slot.WEAPON, Rarity.COMMON, base, 0, emptyList(), heroId = heroId)

    private fun bossMs(chapter: Int) = rankings.bossTimes["ana" to chapter]?.first

    @Test
    fun `a chapter 3 boss won 12345 ms after the last miniboss records 12345`() {
        fight(3, 10_000, 22_345)

        assertEquals(12_345L, bossMs(3))
        assertNull(rankings.clocks["ana"]!!.bossReachedAt)
    }

    @Test
    fun `a slower win keeps the record and a faster one replaces it`() {
        fight(3, 10_000, 22_345)

        fight(3, 100_000, 115_000)
        assertEquals(12_345L, bossMs(3))

        fight(3, 200_000, 209_000)
        assertEquals(9_000L, bossMs(3))
    }

    @Test
    fun `a win 999 ms after the miniboss is refused and one of 1000 ms is kept`() {
        fight(3, 0, 999)
        assertNull(bossMs(3))

        fight(3, 5_000, 6_000)
        assertEquals(1_000L, bossMs(3))
    }

    @Test
    fun `a page load at the boss restarts the clock`() {
        clock.millis = 0
        lastMiniboss(3)
        clock.millis = 50_000
        keeper.onProgressLoaded("ana", at(pos(3, 10, Encounter.CHAPTER_BOSS)))
        clock.millis = 62_000
        bossWin(3)

        assertEquals(12_000L, bossMs(3))
    }

    @Test
    fun `a farm win at the boss restarts the clock`() {
        clock.millis = 0
        lastMiniboss(3)
        clock.millis = 30_000
        keeper.onFarmWin("ana", at(pos(3, 10, Encounter.CHAPTER_BOSS)))
        clock.millis = 41_500
        bossWin(3)

        assertEquals(11_500L, bossMs(3))
    }

    @Test
    fun `a failed boss stops the clock and the next attempt is timed from its own start`() {
        clock.millis = 0
        lastMiniboss(3)
        clock.millis = 90_000
        keeper.onOutcome("ana", pos(3, 10, Encounter.CHAPTER_BOSS), Outcome.FAILED, at(pos(3, 10, Encounter.PHASE, 8)))
        assertNull(rankings.clocks["ana"]!!.bossReachedAt)

        fight(3, 200_000, 210_000)

        assertEquals(10_000L, bossMs(3))
    }

    @Test
    fun `a boss win with the clock stopped records nothing`() {
        clock.millis = 5_000
        bossWin(3)

        assertTrue(rankings.bossTimes.isEmpty())
    }

    @Test
    fun `a reset stops the boss clock, starts the run and keeps the boss times`() {
        fight(3, 10_000, 22_345)

        clock.millis = 0
        lastMiniboss(4)
        clock.millis = 1_000_000
        keeper.onReset("ana")

        assertEquals(RunClock("ana", 1_000_000, null), rankings.clocks["ana"])
        assertEquals(12_345L, bossMs(3))
    }

    @Test
    fun `a player who never reset is timed from the registration`() {
        fight(15, 7_199_000, 7_200_000)

        assertEquals(7_200_000L, rankings.storyTimes["ana"]?.first)
        assertEquals(1_000L, bossMs(15))
    }

    @Test
    fun `a run after a reset is timed from the reset`() {
        resets.save("ana", 1)
        clock.millis = 1_000_000
        keeper.onReset("ana")

        fight(15, 4_590_000, 4_600_000)

        assertEquals(3_600_000L, rankings.storyTimes["ana"]?.first)
    }

    @Test
    fun `a story shorter than 1365000 ms is refused and 1365000 is kept`() {
        resets.save("ana", 1)
        clock.millis = 0
        keeper.onReset("ana")
        fight(15, 1_360_000, 1_364_999)
        assertNull(rankings.storyTimes["ana"])

        clock.millis = 10_000_000
        keeper.onReset("ana")
        fight(15, 11_360_000, 11_365_000)

        assertEquals(1_365_000L, rankings.storyTimes["ana"]?.first)
    }

    @Test
    fun `a player who reset before the rankings has no run start and no story time`() {
        resets.save("ana", 1)

        fight(15, 7_000_000, 7_200_000)

        assertNull(rankings.storyTimes["ana"])
    }

    @Test
    fun `a slower run keeps the story time and a faster one replaces it`() {
        resets.save("ana", 1)
        clock.millis = 1_000_000
        keeper.onReset("ana")
        fight(15, 4_590_000, 4_600_000)
        assertEquals(3_600_000L, rankings.storyTimes["ana"]?.first)

        clock.millis = 10_000_000
        keeper.onReset("ana")
        fight(15, 13_990_000, 14_000_000)
        assertEquals(3_600_000L, rankings.storyTimes["ana"]?.first)

        clock.millis = 20_000_000
        keeper.onReset("ana")
        fight(15, 22_990_000, 23_000_000)
        assertEquals(3_000_000L, rankings.storyTimes["ana"]?.first)
    }

    @Test
    fun `a phase win and an ordinary miniboss win touch no clock`() {
        keeper.onOutcome("ana", pos(3, 2, Encounter.PHASE, 3), Outcome.CLEARED, at(pos(3, 2, Encounter.PHASE, 4)))
        keeper.onOutcome("ana", pos(3, 2, Encounter.MINIBOSS), Outcome.CLEARED, at(pos(3, 3, Encounter.PHASE)))

        assertTrue(rankings.clocks.isEmpty())
    }

    @Test
    fun `a miniboss win records the click power and a phase win does not`() {
        equipment.save(weapon(5))

        keeper.onOutcome("ana", pos(1, 1, Encounter.PHASE), Outcome.CLEARED, at(pos(1, 1, Encounter.PHASE, 2)))
        assertTrue(rankings.powers.isEmpty())

        keeper.onOutcome("ana", pos(1, 1, Encounter.MINIBOSS), Outcome.CLEARED, at(pos(1, 2, Encounter.PHASE)))
        assertEquals(6.0, rankings.powers["ana"]?.first)
    }

    @Test
    fun `a farm win records the click power`() {
        equipment.save(weapon(5))

        keeper.onFarmWin("ana", at(pos(1, 3, Encounter.PHASE)))

        assertEquals(6.0, rankings.powers["ana"]?.first)
    }

    @Test
    fun `a lower power keeps the best`() {
        equipment.save(weapon(5))
        rankings.improveClickPower("ana", 41.0, 0)

        assertEquals(6.0, keeper.recordClickPower("ana", at(pos(1, 1, Encounter.PHASE))))

        assertEquals(41.0, rankings.powers["ana"]?.first)
    }

    @Test
    fun `no cards row gives no power`() {
        cards.deleteByUsername("ana")

        assertNull(keeper.recordClickPower("ana", at(pos(1, 1, Encounter.PHASE))))

        assertTrue(rankings.powers.isEmpty())
    }

    @Test
    fun `the power reads the leader's stars, the team and the talents`() {
        cards.save(
            PlayerCards("ana", Element.FIRE, "kael", mapOf(CopyKey("kael", 3) to 1, CopyKey("lyra", 2) to 1, CopyKey("seraphine", 0) to 1)),
        )
        teams.save("ana", Team(2, listOf("lyra", "seraphine", null, null)))
        equipment.save(weapon(4, "lyra"))
        talents.save("ana", "CLICK_DAMAGE", 3)

        val power = keeper.recordClickPower("ana", at(pos(6, 1, Encounter.PHASE)))

        assertEquals(41.55, power!!, 1e-9)
        assertEquals(41.55, rankings.powers["ana"]!!.first, 1e-9)
    }
}
