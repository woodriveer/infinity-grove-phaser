package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryHeroRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceChanceRoller
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.SequenceIds
import br.com.woodriver.infinity_grove_ws.domain.BossNotAvailableException
import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.DailyLimitReachedException
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.FarmBoss
import br.com.woodriver.infinity_grove_ws.domain.FarmTooFastException
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FarmServiceTest {
    private val progresses = InMemoryProgressRepository()
    private val playerCards = InMemoryPlayerCardsRepository()
    private val users = InMemoryUserRepository()
    private val rates =
        CardDropRates(minibossRatePerStage = 0.02, chapterBossRate = 0.30, chapterBossDailyLimit = 10, farmMinIntervalMs = 5000)
    private val today = LocalDate.of(2026, 10, 18)
    private val clock = MutableClock(today.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() + 10 * 3_600_000L)
    private var chance = SequenceChanceRoller(0.5)
    private val equipment = InMemoryEquipmentRepository()
    private var equipmentChance = SequenceChanceRoller(0.5)
    private val heroes = InMemoryHeroRepository(*HeroSeed.heroes().toTypedArray())
    private val service get() =
        FarmService(
            progresses,
            InMemoryChapterRepository(ChapterDefinition.first()),
            users,
            playerCards,
            CardRewards(heroes, chance, rates, clock),
            EquipmentRewards(
                equipment,
                WalletAccess(InMemoryWalletRepository(), DropTable(listOf(DropRule(1, 1, 5, 1500))), SequenceDropRoller(1), clock),
                equipmentChance,
                SequenceIds(),
                EquipmentRules(),
            ),
        )

    private val completed = Progress("yan", ProgressPosition(1, 10, Encounter.CHAPTER_BOSS, 1), completed = true)
    private val miniboss3 = FarmBoss(Encounter.MINIBOSS, 3)
    private val chapterBoss = FarmBoss(Encounter.CHAPTER_BOSS)

    private fun player(
        progress: Progress = completed,
        bosses: BossRecord = BossRecord(clearedChapters = setOf(1)),
        start: Element = Element.FIRE,
    ) {
        users.save(User("yan", "hash", 1L, 1L))
        progresses.save(progress)
        playerCards.save(PlayerCards.start("yan", start, HeroSeed.heroes()).withBosses(bosses))
    }

    private fun at(
        stage: Int,
        encounter: Encounter,
    ) = Progress("yan", ProgressPosition(1, stage, encounter, 1))

    private fun blank(heroId: String) = playerCards.cards.getValue("yan").copiesOf(heroId, 0)

    @Test
    fun `state lists the miniboss of every stage below the current one`() {
        player(at(4, Encounter.PHASE))

        assertEquals(listOf(1, 2, 3), service.state("yan").bosses.map { it.stage })
        assertEquals(List(3) { Encounter.MINIBOSS }, service.state("yan").bosses.map { it.kind })
    }

    @Test
    fun `state has no boss at the start of the campaign`() {
        player(at(1, Encounter.PHASE))

        assertEquals(emptyList(), service.state("yan").bosses)
    }

    @Test
    fun `the miniboss of the current stage is not beaten until the chapter boss is next`() {
        player(at(4, Encounter.MINIBOSS))
        assertEquals(listOf(1, 2, 3), service.state("yan").bosses.map { it.stage })

        player(at(10, Encounter.CHAPTER_BOSS))
        assertEquals((1..10).toList(), service.state("yan").bosses.map { it.stage })
    }

    @Test
    fun `the chapter boss is listed only once the campaign is completed`() {
        player(at(10, Encounter.CHAPTER_BOSS))
        assertEquals(10, service.state("yan").bosses.size)

        player(completed)
        val bosses = service.state("yan").bosses
        assertEquals(11, bosses.size)
        assertEquals(chapterBoss, bosses.last())
    }

    @Test
    fun `state answers the chapter boss wins left today`() {
        player(bosses = BossRecord(setOf(1), today, 4, null))

        assertEquals(6, service.state("yan").chapterBossWinsLeft)
    }

    @Test
    fun `a stage 3 miniboss farm win with a roll below six percent drops a blank card of the chapter hero`() {
        player()
        chance = SequenceChanceRoller(0.0)

        val result = service.report("yan", miniboss3, Outcome.CLEARED)

        assertEquals(CardDrop("kael", "Kael Raizférrea", 0), result.drop)
        assertEquals(2, blank("kael"))
    }

    @Test
    fun `a stage 3 miniboss farm win with a roll of six percent or more drops nothing`() {
        player()
        chance = SequenceChanceRoller(0.06)

        assertNull(service.report("yan", miniboss3, Outcome.CLEARED).drop)
        assertEquals(1, blank("kael"))
    }

    @Test
    fun `a miniboss farm win never counts as a chapter boss win`() {
        player()

        assertEquals(10, service.report("yan", miniboss3, Outcome.CLEARED).chapterBossWinsLeft)
    }

    @Test
    fun `a chapter boss farm win rolls thirty percent for the next chapter hero and counts for today`() {
        player()
        chance = SequenceChanceRoller(0.2999)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals("lyra", result.drop?.heroId)
        assertEquals(9, result.chapterBossWinsLeft)
        assertEquals(1, blank("lyra"))
        assertEquals(9, service.state("yan").chapterBossWinsLeft)
    }

    @Test
    fun `a chapter boss farm win with a roll of thirty percent or more drops nothing but still counts`() {
        player()
        chance = SequenceChanceRoller(0.30)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertNull(result.drop)
        assertEquals(9, result.chapterBossWinsLeft)
    }

    @Test
    fun `a farm report never changes the campaign position or the completed flag`() {
        player()
        chance = SequenceChanceRoller(0.0)

        service.report("yan", miniboss3, Outcome.CLEARED)
        clock.millis += 5000
        service.report("yan", chapterBoss, Outcome.CLEARED)
        clock.millis += 5000
        service.report("yan", chapterBoss, Outcome.FAILED)

        assertEquals(completed, progresses.progresses.getValue("yan"))
    }

    @Test
    fun `a failed farm fight answers 200 style, rolls nothing and leaves the wins and the bag`() {
        player(bosses = BossRecord(setOf(1), today, 3, null))
        chance = SequenceChanceRoller(0.0)
        val before = playerCards.cards.getValue("yan")

        val result = service.report("yan", chapterBoss, Outcome.FAILED)

        assertNull(result.drop)
        assertEquals(7, result.chapterBossWinsLeft)
        assertEquals(0, chance.reads)
        assertEquals(before, playerCards.cards.getValue("yan"))
    }

    @Test
    fun `a boss not beaten yet is not available and nothing is rolled or changed`() {
        player(at(3, Encounter.PHASE))
        chance = SequenceChanceRoller(0.0)
        val before = playerCards.cards.getValue("yan")

        assertFailsWith<BossNotAvailableException> { service.report("yan", FarmBoss(Encounter.MINIBOSS, 5), Outcome.CLEARED) }
        assertFailsWith<BossNotAvailableException> { service.report("yan", chapterBoss, Outcome.CLEARED) }
        assertFailsWith<BossNotAvailableException> { service.report("yan", FarmBoss(Encounter.MINIBOSS, 3), Outcome.FAILED) }

        assertEquals(0, chance.reads)
        assertEquals(before, playerCards.cards.getValue("yan"))
    }

    @Test
    fun `the tenth chapter boss win of the day is allowed and the eleventh is refused`() {
        player(bosses = BossRecord(setOf(1), today, 9, null))
        chance = SequenceChanceRoller(0.0)

        assertEquals(0, service.report("yan", chapterBoss, Outcome.CLEARED).chapterBossWinsLeft)
        val before = playerCards.cards.getValue("yan")
        clock.millis += 5000

        assertFailsWith<DailyLimitReachedException> { service.report("yan", chapterBoss, Outcome.CLEARED) }

        assertEquals(1, chance.reads)
        assertEquals(before, playerCards.cards.getValue("yan"))
    }

    @Test
    fun `the limit does not stop a miniboss farm`() {
        player(bosses = BossRecord(setOf(1), today, 10, null))

        assertEquals(0, service.report("yan", miniboss3, Outcome.CLEARED).chapterBossWinsLeft)
    }

    @Test
    fun `the chapter boss count starts again on the next UTC day`() {
        player(bosses = BossRecord(setOf(1), today, 10, null))
        assertEquals(0, service.state("yan").chapterBossWinsLeft)

        clock.millis += 24 * 3_600_000L

        assertEquals(10, service.state("yan").chapterBossWinsLeft)
        assertEquals(9, service.report("yan", chapterBoss, Outcome.CLEARED).chapterBossWinsLeft)
    }

    @Test
    fun `a farm win less than five seconds after the previous one is too fast and changes nothing`() {
        player()
        chance = SequenceChanceRoller(0.0)
        service.report("yan", miniboss3, Outcome.CLEARED)
        val before = playerCards.cards.getValue("yan")
        clock.millis += 4999

        assertFailsWith<FarmTooFastException> { service.report("yan", chapterBoss, Outcome.CLEARED) }

        assertEquals(1, chance.reads)
        assertEquals(before, playerCards.cards.getValue("yan"))
    }

    @Test
    fun `a farm win exactly five seconds after the previous one is accepted`() {
        player()
        service.report("yan", miniboss3, Outcome.CLEARED)
        clock.millis += 5000

        assertEquals(9, service.report("yan", chapterBoss, Outcome.CLEARED).chapterBossWinsLeft)
    }

    @Test
    fun `an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.state("ghost") }
        assertFailsWith<UserNotFoundException> { service.report("ghost", miniboss3, Outcome.CLEARED) }
    }

    @Test
    fun `a user without cards fails`() {
        users.save(User("yan", "hash", 1L, 1L))
        progresses.save(completed)

        assertFailsWith<PlayerCardsMissingException> { service.state("yan") }
        assertFailsWith<PlayerCardsMissingException> { service.report("yan", miniboss3, Outcome.CLEARED) }
    }

    @Test
    fun `a boss must be a miniboss with a stage or the chapter boss`() {
        assertFailsWith<IllegalArgumentException> { FarmBoss(Encounter.MINIBOSS) }
        assertFailsWith<IllegalArgumentException> { FarmBoss(Encounter.CHAPTER_BOSS, 1) }
        assertFailsWith<IllegalArgumentException> { FarmBoss(Encounter.PHASE) }
    }

    @Test
    fun `a miniboss farm win whose equipment roll passes returns the piece and stores it`() {
        player()
        equipmentChance = SequenceChanceRoller(0.2, 0.0)

        val result = service.report("yan", miniboss3, Outcome.CLEARED)

        val drop = result.equipmentDrop!!
        assertEquals(false, drop.sold)
        assertEquals(listOf(drop.piece), equipment.findAll("yan"))
    }

    @Test
    fun `a miniboss farm win whose equipment roll fails returns no piece`() {
        player()
        equipmentChance = SequenceChanceRoller(0.25)

        assertNull(service.report("yan", miniboss3, Outcome.CLEARED).equipmentDrop)
        assertTrue(equipment.pieces.isEmpty())
    }

    @Test
    fun `a chapter boss farm win always returns a piece`() {
        player()
        equipmentChance = SequenceChanceRoller(0.99)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals(equipment.findAll("yan").single(), result.equipmentDrop?.piece)
    }

    @Test
    fun `a failed farm fight and every refused farm win drop no piece`() {
        player(at(3, Encounter.PHASE))
        equipmentChance = SequenceChanceRoller(0.0)
        assertNull(service.report("yan", miniboss3.copy(stage = 2), Outcome.FAILED).equipmentDrop)
        assertFailsWith<BossNotAvailableException> { service.report("yan", FarmBoss(Encounter.MINIBOSS, 5), Outcome.CLEARED) }
        player()
        service.report("yan", miniboss3, Outcome.CLEARED)
        val stored = equipment.pieces.size
        clock.millis += 4999
        assertFailsWith<FarmTooFastException> { service.report("yan", chapterBoss, Outcome.CLEARED) }

        assertEquals(stored, equipment.pieces.size)
    }

    @Test
    fun `the refused eleventh chapter boss win drops no piece`() {
        player(bosses = BossRecord(setOf(1), today, 10, null))
        equipmentChance = SequenceChanceRoller(0.0)

        assertFailsWith<DailyLimitReachedException> { service.report("yan", chapterBoss, Outcome.CLEARED) }

        assertTrue(equipment.pieces.isEmpty())
    }
}
