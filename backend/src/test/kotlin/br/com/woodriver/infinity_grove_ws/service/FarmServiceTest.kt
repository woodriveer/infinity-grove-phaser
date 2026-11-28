package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryHeroRepository
import br.com.woodriver.infinity_grove_ws.InMemoryLegacyRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.NoRecordKeeping
import br.com.woodriver.infinity_grove_ws.RecordingRecordKeeping
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
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.usecase.RecordKeeping
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
    private var records: RecordKeeping = NoRecordKeeping
    private val service get() = farmWith(ChapterDefinition.first(), ChapterDefinition.of(15))

    private fun farmWith(vararg chapters: ChapterDefinition) =
        FarmService(
            progresses,
            InMemoryChapterRepository(*chapters),
            users,
            playerCards,
            CardRewards(heroes, chance, rates, clock),
            EquipmentRewards(
                equipment,
                WalletAccess(InMemoryWalletRepository(), InMemoryDropRuleRepository(DropRule(1, 1, 5, 1500)), SequenceDropRoller(1), clock),
                equipmentChance,
                SequenceIds(),
                EquipmentRules(),
                InMemoryLegacyRepository(),
            ),
            records,
        )

    private val completed = Progress("yan", ProgressPosition(15, 10, Encounter.CHAPTER_BOSS, 1), completed = true)
    private val miniboss3 = FarmBoss(Encounter.MINIBOSS, 3)
    private val chapterBoss = FarmBoss(Encounter.CHAPTER_BOSS)
    private val atChapter3 = Progress("yan", ProgressPosition(3, 4, Encounter.PHASE, 1))
    private val firstThree get() = farmWith(ChapterDefinition.of(1), ChapterDefinition.of(2), ChapterDefinition.of(3))

    private fun cleared(): Set<Int> {
        val cards = playerCards.cards.getValue("yan")
        return cards.bosses.clearedChapters
    }

    private fun player(
        progress: Progress = completed,
        bosses: BossRecord = BossRecord(clearedChapters = setOf(15)),
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
    fun `a player completed at chapter 5 farms chapter 6 bosses only and has none beaten yet`() {
        player(Progress("yan", ProgressPosition(5, 10, Encounter.CHAPTER_BOSS, 1), completed = true))

        assertEquals(emptyList(), farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).state("yan").bosses)
    }

    @Test
    fun `a player completed at chapter 5 cannot report a chapter 5 boss win as a farm win once chapter 6 is open`() {
        player(Progress("yan", ProgressPosition(5, 10, Encounter.CHAPTER_BOSS, 1), completed = true))

        assertFailsWith<BossNotAvailableException> {
            farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).report("yan", chapterBoss, Outcome.CLEARED)
        }
        assertFailsWith<BossNotAvailableException> {
            farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).report("yan", FarmBoss(Encounter.MINIBOSS, 3), Outcome.CLEARED)
        }
    }

    @Test
    fun `a player in chapter 6 farms the minibosses of chapter 6 that were passed`() {
        player(Progress("yan", ProgressPosition(6, 4, Encounter.PHASE, 1)))

        val bosses = farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).state("yan").bosses

        assertEquals(listOf(1, 2, 3), bosses.map { it.stage })
        assertEquals(List(3) { Encounter.MINIBOSS }, bosses.map { it.kind })
    }

    @Test
    fun `state answers the chapter boss wins left today`() {
        player(bosses = BossRecord(setOf(15), today, 4, null))

        assertEquals(6, service.state("yan").chapterBossWinsLeft)
    }

    @Test
    fun `a stage 3 miniboss farm win with a roll below six percent drops a blank card of the chapter hero`() {
        player()
        chance = SequenceChanceRoller(0.0)

        val result = service.report("yan", miniboss3, Outcome.CLEARED)

        assertEquals(CardDrop("seraphine", "Seraphine Aurora", 0), result.drop)
        assertEquals(1, blank("seraphine"))
    }

    @Test
    fun `a stage 3 miniboss farm win with a roll of six percent or more drops nothing`() {
        player()
        chance = SequenceChanceRoller(0.06)

        assertNull(service.report("yan", miniboss3, Outcome.CLEARED).drop)
        assertEquals(0, blank("seraphine"))
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

        assertEquals("seraphine", result.drop?.heroId)
        assertEquals(9, result.chapterBossWinsLeft)
        assertEquals(1, blank("seraphine"))
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
        player(bosses = BossRecord(setOf(15), today, 3, null))
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
        player(bosses = BossRecord(setOf(15), today, 9, null))
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
        player(bosses = BossRecord(setOf(15), today, 10, null))

        assertEquals(0, service.report("yan", miniboss3, Outcome.CLEARED).chapterBossWinsLeft)
    }

    @Test
    fun `the chapter boss count starts again on the next UTC day`() {
        player(bosses = BossRecord(setOf(15), today, 10, null))
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
        player(bosses = BossRecord(setOf(15), today, 10, null))
        equipmentChance = SequenceChanceRoller(0.0)

        assertFailsWith<DailyLimitReachedException> { service.report("yan", chapterBoss, Outcome.CLEARED) }

        assertTrue(equipment.pieces.isEmpty())
    }

    @Test
    fun `state lists the current chapter by default with every reached chapter`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))

        val state = firstThree.state("yan")

        assertEquals(3, state.chapter)
        assertEquals(listOf(1, 2, 3), state.chapters)
        assertEquals(listOf(1, 2, 3), state.bosses.map { it.stage })
        assertEquals(ChapterDefinition.of(3), state.definition)
    }

    @Test
    fun `state of an earlier chapter lists its ten minibosses, its chapter boss and its definition`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))

        val state = firstThree.state("yan", 2)

        assertEquals(2, state.chapter)
        assertEquals(listOf(1, 2, 3), state.chapters)
        assertEquals(11, state.bosses.size)
        assertEquals(chapterBoss, state.bosses.last())
        assertEquals(ChapterDefinition.of(2), state.definition)
        assertEquals(10, state.chapterBossWinsLeft)
    }

    @Test
    fun `state of a chapter above the reached one answers the reached chapter`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))

        val state = firstThree.state("yan", 9)

        assertEquals(3, state.chapter)
        assertEquals(listOf(1, 2, 3), state.bosses.map { it.stage })
    }

    @Test
    fun `state of a completed campaign reaches chapters 1 to 15`() {
        player()

        val state = service.state("yan")

        assertEquals((1..15).toList(), state.chapters)
        assertEquals(15, state.chapter)
    }

    @Test
    fun `state refuses a chapter below 1`() {
        assertEquals(
            "chapter must be an integer of at least 1",
            assertFailsWith<IllegalArgumentException> { firstThree.state("yan", 0) }.message,
        )
    }

    @Test
    fun `a player opened from chapter 5 to chapter 6 farms all eleven bosses of chapter 5`() {
        player(Progress("yan", ProgressPosition(5, 10, Encounter.CHAPTER_BOSS, 1), completed = true))

        val state = farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).state("yan", 5)

        assertEquals(5, state.chapter)
        assertEquals(11, state.bosses.size)
    }

    @Test
    fun `an earlier chapter miniboss farm win drops the hero of that chapter`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.0)

        val result = firstThree.report("yan", miniboss3, Outcome.CLEARED, 2)

        assertEquals(CardDrop("lyra", "Lyra Folhaveloz", 0), result.drop)
        assertEquals(1, blank("lyra"))
    }

    @Test
    fun `a report without a chapter fights the current chapter`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.0)

        assertEquals("orina", firstThree.report("yan", miniboss3, Outcome.CLEARED).drop?.heroId)
    }

    @Test
    fun `an earlier chapter boss farm win drops the hero of the next chapter and counts for today`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.2999)

        val result = firstThree.report("yan", chapterBoss, Outcome.CLEARED, 2)

        assertEquals("orina", result.drop?.heroId)
        assertEquals(9, result.chapterBossWinsLeft)
        assertEquals(setOf(1, 2), cleared())
    }

    @Test
    fun `an earlier chapter boss farm win at a roll of thirty percent drops nothing`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.30)

        val result = firstThree.report("yan", chapterBoss, Outcome.CLEARED, 2)

        assertNull(result.drop)
        assertEquals(9, result.chapterBossWinsLeft)
    }

    @Test
    fun `an earlier chapter boss missing from the cleared chapters drops its card for certain and is recorded`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1)))
        chance = SequenceChanceRoller(0.99)

        assertEquals("orina", firstThree.report("yan", chapterBoss, Outcome.CLEARED, 2).drop?.heroId)
        assertEquals(setOf(1, 2), cleared())
    }

    @Test
    fun `an earlier chapter boss rolls the rarity of that chapter`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        equipmentChance = SequenceChanceRoller(0.0, 0.99)

        val result = firstThree.report("yan", chapterBoss, Outcome.CLEARED, 2)

        assertEquals(Rarity.UNCOMMON, result.equipmentDrop!!.piece.rarity)
    }

    @Test
    fun `the same rolls at chapter 15 give a legendary piece`() {
        player()
        equipmentChance = SequenceChanceRoller(0.0, 0.99)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals(Rarity.LEGENDARY, result.equipmentDrop!!.piece.rarity)
    }

    @Test
    fun `chapter boss wins of every chapter share one daily limit`() {
        player(atChapter3, BossRecord(setOf(1, 2), today, 9, null))

        assertEquals(0, firstThree.report("yan", chapterBoss, Outcome.CLEARED, 1).chapterBossWinsLeft)
        clock.millis += 5000

        assertFailsWith<DailyLimitReachedException> { firstThree.report("yan", chapterBoss, Outcome.CLEARED, 2) }
    }

    @Test
    fun `the farm interval spans chapters`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        firstThree.report("yan", miniboss3, Outcome.CLEARED, 1)
        clock.millis += 4999

        assertFailsWith<FarmTooFastException> { firstThree.report("yan", miniboss3, Outcome.CLEARED, 2) }
    }

    @Test
    fun `a boss of a chapter above the current one is not available and changes nothing`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.0)
        equipmentChance = SequenceChanceRoller(0.0)

        assertFailsWith<BossNotAvailableException> { firstThree.report("yan", miniboss3, Outcome.CLEARED, 4) }

        assertEquals(0, blank("vex"))
        assertTrue(equipment.pieces.isEmpty())
        assertEquals(10, firstThree.state("yan").chapterBossWinsLeft)
    }

    @Test
    fun `a miniboss of stage 11 of an earlier chapter is not available`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))

        assertFailsWith<BossNotAvailableException> { firstThree.report("yan", FarmBoss(Encounter.MINIBOSS, 11), Outcome.CLEARED, 2) }
    }

    @Test
    fun `a report refuses a chapter below 1`() {
        assertEquals(
            "chapter must be an integer of at least 1",
            assertFailsWith<IllegalArgumentException> { firstThree.report("yan", miniboss3, Outcome.CLEARED, 0) }.message,
        )
    }

    @Test
    fun `an earlier chapter farm report never changes the campaign position`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.0)

        firstThree.report("yan", miniboss3, Outcome.CLEARED, 2)

        assertEquals(atChapter3, progresses.findForUpdate("yan"))
    }

    @Test
    fun `an earlier chapter miniboss of stage 3 drops its hero below six percent`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.0599)

        assertEquals(CardDrop("lyra", "Lyra Folhaveloz", 0), firstThree.report("yan", miniboss3, Outcome.CLEARED, 2).drop)
        assertEquals(1, blank("lyra"))
    }

    @Test
    fun `an earlier chapter miniboss of stage 3 drops nothing at six percent`() {
        player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))
        chance = SequenceChanceRoller(0.06)

        assertNull(firstThree.report("yan", miniboss3, Outcome.CLEARED, 2).drop)
        assertEquals(0, blank("lyra"))
    }

    @Test
    fun `an earlier chapter miniboss rolls the rarity of that chapter and not of the current one`() {
        //  Chapter 5 is open: its miniboss tier reaches rare at this roll, chapter 2's stops at uncommon
        player(Progress("yan", ProgressPosition(5, 4, Encounter.PHASE, 1)), BossRecord(clearedChapters = setOf(1, 2, 3, 4)))
        equipmentChance = SequenceChanceRoller(0.0, 0.99)

        val result = firstThree.report("yan", miniboss3, Outcome.CLEARED, 2)

        assertEquals(Rarity.UNCOMMON, result.equipmentDrop!!.piece.rarity)
    }

    @Test
    fun `the chapter 15 boss drops the hero of chapter 15 and no hero of chapter 16`() {
        player()
        chance = SequenceChanceRoller(0.0)

        assertEquals(CardDrop("seraphine", "Seraphine Aurora", 0), service.report("yan", chapterBoss, Outcome.CLEARED, 15).drop)
    }

    @Test
    fun `a farm win is reported to the records with the campaign position`() {
        player(at(2, Encounter.PHASE))
        val recording = RecordingRecordKeeping()
        records = recording

        service.report("yan", FarmBoss(Encounter.MINIBOSS, 1), Outcome.CLEARED)

        assertEquals(listOf("farm:PHASE"), recording.events)
    }

    @Test
    fun `a failed farm fight reaches no record`() {
        player(at(2, Encounter.PHASE))
        val recording = RecordingRecordKeeping()
        records = recording

        service.report("yan", FarmBoss(Encounter.MINIBOSS, 1), Outcome.FAILED)

        assertTrue(recording.events.isEmpty())
    }

    @Test
    fun `a refused farm report reaches no record`() {
        player(at(2, Encounter.PHASE))
        val recording = RecordingRecordKeeping()
        records = recording

        assertFailsWith<BossNotAvailableException> { service.report("yan", FarmBoss(Encounter.MINIBOSS, 2), Outcome.CLEARED) }

        assertTrue(recording.events.isEmpty())
    }
}
