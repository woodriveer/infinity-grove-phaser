package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryRankingRepository
import br.com.woodriver.infinity_grove_ws.InMemoryResetRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTeamRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ClickPowerResult
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.InvalidRankingRequestException
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingMe
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class RankingServiceTest {
    private val rankings = InMemoryRankingRepository()
    private val users = InMemoryUserRepository()
    private val progresses = InMemoryProgressRepository()
    private val cards = InMemoryPlayerCardsRepository()
    private val equipment = InMemoryEquipmentRepository()
    private val teams = InMemoryTeamRepository()
    private val keeper =
        RecordKeeper(
            rankings,
            users,
            InMemoryResetRepository(),
            InMemoryChapterRepository(*(1..15).map(ChapterDefinition::of).toTypedArray()),
            cards,
            equipment,
            teams,
            InMemoryTalentRepository(),
            MutableClock(0),
        )
    private val service = RankingService(rankings, keeper, progresses, users)

    private fun player(name: String = "ana") {
        users.save(User(name, "h", 0, 0))
        cards.save(PlayerCards(name, Element.FIRE, "kael", mapOf(CopyKey("kael", 0) to 1)))
    }

    private fun weapon(
        base: Int,
        heroId: String = "kael",
    ) = Piece("w-$heroId", "ana", Slot.WEAPON, Rarity.COMMON, base, 0, emptyList(), heroId = heroId)

    private fun twelveInChapterThree() = (1..12).forEach { rankings.bossTimes["p%02d".format(it) to 3] = 1_000L * it to it.toLong() }

    @Test
    fun `a boss board answers the chapter, at most 10 entries and the caller`() {
        twelveInChapterThree()

        val page = service.board("p12", RankingBoard.BOSS_TIME, 3)

        assertEquals(3, page.chapter)
        assertEquals((1..10).map { "p%02d".format(it) }, page.entries.map { it.username })
        assertEquals(RankingMe(12, "p12", 12000.0), page.me)
    }

    @Test
    fun `a board without chapters ignores the chapter`() {
        assertNull(service.board("ana", RankingBoard.STORY_TIME, 3).chapter)
    }

    @Test
    fun `a caller without a record has no own row`() {
        twelveInChapterThree()

        assertNull(service.board("ana", RankingBoard.BOSS_TIME, 3).me)
    }

    @Test
    fun `a boss board without a valid chapter is INVALID_RANKING_REQUEST`() {
        assertFailsWith<InvalidRankingRequestException> { service.board("ana", RankingBoard.BOSS_TIME, null) }
        assertFailsWith<InvalidRankingRequestException> { service.board("ana", RankingBoard.BOSS_TIME, 16) }
    }

    @Test
    fun `the refresh answers the current power and the best after the call`() {
        player()
        equipment.save(weapon(5))

        assertEquals(ClickPowerResult(6.0, 6.0), service.refreshClickPower("ana"))
    }

    @Test
    fun `the refresh keeps a bigger best`() {
        player()
        cards.save(
            PlayerCards(
                "ana",
                Element.FIRE,
                "kael",
                mapOf(
                    CopyKey("kael", 0) to 1,
                    CopyKey("lyra", 2) to 1,
                    CopyKey("seraphine", 0) to 1,
                ),
            ),
        )
        teams.save("ana", Team(2, listOf("lyra", "seraphine", null, null)))
        equipment.save(weapon(4, "lyra"))
        progresses.save(Progress("ana", ProgressPosition(3, 1, Encounter.PHASE, 1)))
        rankings.improveClickPower("ana", 41.0, 0)

        assertEquals(ClickPowerResult(33.0, 41.0), service.refreshClickPower("ana"))
    }

    @Test
    fun `the refresh without a cards row answers no value and the stored best`() {
        users.save(User("ana", "h", 0, 0))
        assertEquals(ClickPowerResult(null, null), service.refreshClickPower("ana"))

        rankings.improveClickPower("ana", 41.0, 0)
        assertEquals(ClickPowerResult(null, 41.0), service.refreshClickPower("ana"))
    }

    @Test
    fun `the refresh of an unknown user is USER_NOT_FOUND`() {
        assertFailsWith<UserNotFoundException> { service.refreshClickPower("ghost") }
    }
}
