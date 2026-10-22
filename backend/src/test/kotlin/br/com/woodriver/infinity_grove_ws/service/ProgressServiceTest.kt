package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryHeroRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.LogCapture
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceChanceRoller
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.SequenceIds
import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressConflictException
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ProgressServiceTest {
    private val users = InMemoryUserRepository()
    private val progresses = InMemoryProgressRepository()
    private val chapter = ChapterDefinition.first()
    private val chapters = InMemoryChapterRepository(*(1..5).map(ChapterDefinition::of).toTypedArray())
    private val heroes = InMemoryHeroRepository(*HeroSeed.heroes().toTypedArray())
    private val playerCards = InMemoryPlayerCardsRepository()
    private val talents = InMemoryTalentRepository()
    private val rates =
        CardDropRates(minibossRatePerStage = 0.02, chapterBossRate = 0.30, chapterBossDailyLimit = 10, farmMinIntervalMs = 5000)
    private val today = LocalDate.of(2026, 10, 18)
    private val clock = MutableClock(today.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() + 10 * 3_600_000L)
    private var chance = SequenceChanceRoller(0.5)
    private val equipment = InMemoryEquipmentRepository()
    private var equipmentChance = SequenceChanceRoller(0.5)

    private fun equipmentRewards(pieces: EquipmentRepositoryPort = equipment) =
        EquipmentRewards(
            pieces,
            WalletAccess(InMemoryWalletRepository(), InMemoryDropRuleRepository(DropRule(1, 1, 5, 1500)), SequenceDropRoller(1), clock),
            equipmentChance,
            SequenceIds(),
            EquipmentRules(),
        )

    private val service get() =
        ProgressService(
            progresses,
            chapters,
            users,
            playerCards,
            CardRewards(heroes, chance, rates, clock),
            equipmentRewards(),
            talents,
            TalentRules(),
        )

    private val start = ProgressPosition(1, 1, Encounter.PHASE, 1)

    private fun existingUser(name: String = "yan") = users.save(User(name, "hash", 1L, 1L))

    @Test
    fun `get creates stage 1 phase 1 for a player without progress and returns the chapter definition`() {
        existingUser()

        val view = service.get("yan")

        assertEquals(start, view.progress.position)
        assertEquals(chapter, view.chapter)
        assertEquals(Progress.start("yan"), progresses.progresses["yan"])
    }

    @Test
    fun `get returns the stored progress when one exists`() {
        existingUser()
        val stored = Progress("yan", ProgressPosition(1, 4, Encounter.MINIBOSS, 1))
        progresses.save(stored)

        assertEquals(stored, service.get("yan").progress)
    }

    @Test
    fun `get for an unknown user fails and creates no progress`() {
        assertFailsWith<UserNotFoundException> { service.get("ghost") }

        assertTrue(progresses.progresses.isEmpty())
    }

    @Test
    fun `get fails when the stored chapter does not exist`() {
        existingUser()
        progresses.save(Progress("yan", ProgressPosition(6, 1, Encounter.PHASE, 1)))

        assertFailsWith<ChapterNotFoundException> { service.get("yan") }
    }

    @Test
    fun `report saves the next position and returns it`() {
        existingUser()

        val view = service.report("yan", start, Outcome.CLEARED).view

        val expected = Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 2))
        assertEquals(expected, view.progress)
        assertEquals(expected, progresses.progresses["yan"])
    }

    @Test
    fun `report creates the progress first when the player has none`() {
        existingUser()

        service.report("yan", start, Outcome.CLEARED)

        val saved = progresses.progresses.getValue("yan")
        assertEquals(2, saved.position.phase)
    }

    @Test
    fun `a failed boss is saved as the last phase of the stage`() {
        existingUser()
        progresses.save(Progress("yan", ProgressPosition(1, 3, Encounter.MINIBOSS, 1)))

        val view = service.report("yan", ProgressPosition(1, 3, Encounter.MINIBOSS, 1), Outcome.FAILED).view

        assertEquals(ProgressPosition(1, 3, Encounter.PHASE, 5), view.progress.position)
    }

    @Test
    fun `a conflicting report saves nothing and the exception carries the stored progress`() {
        existingUser()
        val stored = Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 3))
        progresses.save(stored)

        val e = assertFailsWith<ProgressConflictException> { service.report("yan", start, Outcome.CLEARED) }

        assertEquals(stored, e.current.progress)
        assertEquals(chapter, e.current.chapter)
        assertEquals(stored, progresses.progresses["yan"])
    }

    @Test
    fun `report for an unknown user fails and creates no progress`() {
        assertFailsWith<UserNotFoundException> { service.report("ghost", start, Outcome.CLEARED) }

        assertTrue(progresses.progresses.isEmpty())
    }

    @Test
    fun `players do not share progress`() {
        existingUser("yan")
        existingUser("ana")

        service.report("yan", start, Outcome.CLEARED)

        val ana = service.get("ana").progress
        assertEquals(1, ana.position.phase)
    }

    private val miniboss = ProgressPosition(1, 1, Encounter.MINIBOSS, 1)
    private val chapterBoss = ProgressPosition(1, 10, Encounter.CHAPTER_BOSS, 1)

    private fun playerAt(
        position: ProgressPosition,
        start: Element = Element.FIRE,
        bosses: BossRecord = BossRecord(),
    ) {
        existingUser()
        progresses.save(Progress("yan", position))
        playerCards.save(PlayerCards.start("yan", start, HeroSeed.heroes()).withBosses(bosses))
    }

    private fun earned() = talents.earnedPoints("yan")

    @Test
    fun `the first clear of a phase pays 1 talent point and answers it`() {
        existingUser()

        val result = service.report("yan", start, Outcome.CLEARED)

        assertEquals(1, result.talentPoints)
        assertEquals(1, earned())
    }

    @Test
    fun `the first clear of a miniboss pays 2 talent points`() {
        playerAt(miniboss)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        assertEquals(2, result.talentPoints)
        assertEquals(2, earned())
    }

    @Test
    fun `the first clear of a chapter boss pays 5 talent points`() {
        playerAt(chapterBoss)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals(5, result.talentPoints)
        assertEquals(5, earned())
    }

    @Test
    fun `walking a whole chapter pays 50 phases, 10 minibosses and the boss once each`() {
        existingUser()
        var position = start
        repeat(50 + 10 + 1) {
            val view = service.report("yan", position, Outcome.CLEARED).view
            position = view.progress.position
        }

        assertEquals(50 * 1 + 10 * 2 + 5, earned())
    }

    @Test
    fun `the last phase replayed after a failed miniboss pays nothing`() {
        existingUser()
        progresses.save(Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 5)))
        playerCards.save(PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes()))
        val lastPhase = ProgressPosition(1, 1, Encounter.PHASE, 5)

        assertEquals(1, service.report("yan", lastPhase, Outcome.CLEARED).talentPoints)
        service.report("yan", miniboss, Outcome.FAILED)
        val replay = service.report("yan", lastPhase, Outcome.CLEARED)

        assertEquals(0, replay.talentPoints)
        assertEquals(1, earned())
    }

    @Test
    fun `a failed miniboss pays nothing, then winning it pays its 2 points once`() {
        playerAt(miniboss)

        assertEquals(0, service.report("yan", miniboss, Outcome.FAILED).talentPoints)
        assertEquals(0, earned())
        service.report("yan", ProgressPosition(1, 1, Encounter.PHASE, 5), Outcome.CLEARED)
        assertEquals(2, service.report("yan", miniboss, Outcome.CLEARED).talentPoints)
        assertEquals(1 + 2, earned())
    }

    @Test
    fun `a refused report pays nothing`() {
        existingUser()

        assertFailsWith<ProgressConflictException> { service.report("yan", ProgressPosition(1, 3, Encounter.PHASE, 1), Outcome.CLEARED) }

        assertEquals(0, earned())
    }

    @Test
    fun `the first phase of the next chapter pays its own point`() {
        playerAt(ProgressPosition(1, 10, Encounter.CHAPTER_BOSS, 1))
        service.report("yan", chapterBoss, Outcome.CLEARED)

        val result = service.report("yan", ProgressPosition(2, 1, Encounter.PHASE, 1), Outcome.CLEARED)

        assertEquals(1, result.talentPoints)
        assertEquals(5 + 1, earned())
    }

    @Test
    fun `the points follow the settings`() {
        existingUser()
        val tuned =
            ProgressService(
                progresses,
                chapters,
                users,
                playerCards,
                CardRewards(heroes, chance, rates, clock),
                equipmentRewards(),
                talents,
                TalentRules(pointsPerPhase = 3),
            )

        assertEquals(3, tuned.report("yan", start, Outcome.CLEARED).talentPoints)
    }

    private fun blankCopies(heroId: String) = playerCards.cards.getValue("yan").copiesOf(heroId, 0)

    @Test
    fun `a won stage 1 miniboss with a roll below two percent drops a blank card of the chapter hero`() {
        playerAt(miniboss)
        chance = SequenceChanceRoller(0.0)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        assertEquals(CardDrop("kael", "Kael Raizférrea", 0), result.drop)
        assertEquals(2, blankCopies("kael"))
    }

    @Test
    fun `a dropped card is logged with the player, the hero and the source`() {
        playerAt(miniboss)
        chance = SequenceChanceRoller(0.0)

        LogCapture(CardRewards::class.java).use { logs ->
            service.report("yan", miniboss, Outcome.CLEARED)

            assertEquals(listOf("Card dropped username=yan hero=kael source=MINIBOSS"), logs.infos)
        }
    }

    @Test
    fun `a chapter boss drop is logged with its own source`() {
        playerAt(chapterBoss)

        LogCapture(CardRewards::class.java).use { logs ->
            service.report("yan", chapterBoss, Outcome.CLEARED)

            assertEquals(listOf("Card dropped username=yan hero=lyra source=CHAPTER_BOSS"), logs.infos)
        }
    }

    @Test
    fun `no drop logs nothing`() {
        playerAt(miniboss)

        LogCapture(CardRewards::class.java).use { logs ->
            service.report("yan", miniboss, Outcome.CLEARED)

            assertEquals(emptyList(), logs.infos)
        }
    }

    @Test
    fun `a won stage 1 miniboss with a roll of two percent or more drops nothing`() {
        playerAt(miniboss)
        chance = SequenceChanceRoller(0.02)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        assertNull(result.drop)
        assertEquals(1, blankCopies("kael"))
    }

    @Test
    fun `a won stage 5 miniboss rolls ten percent`() {
        val stage5 = ProgressPosition(1, 5, Encounter.MINIBOSS, 1)
        playerAt(stage5)
        chance = SequenceChanceRoller(0.0999)

        assertEquals("kael", service.report("yan", stage5, Outcome.CLEARED).drop?.heroId)
    }

    @Test
    fun `the miniboss drop is the hero of the chapter in the order of the player`() {
        playerAt(miniboss, start = Element.WATER)
        chance = SequenceChanceRoller(0.0)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        assertEquals("orina", result.drop?.heroId)
        assertEquals(2, blankCopies("orina"))
    }

    @Test
    fun `clearing the chapter boss answers with the first stage of the next chapter and its definition`() {
        playerAt(chapterBoss)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals(ProgressPosition(2, 1, Encounter.PHASE, 1), result.view.progress.position)
        assertEquals(false, result.view.progress.completed)
        assertEquals(ChapterDefinition.of(2), result.view.chapter)
        assertEquals(ProgressPosition(2, 1, Encounter.PHASE, 1), progresses.progresses.getValue("yan").position)
    }

    @Test
    fun `get opens the next chapter of a progress stored as completed before it existed`() {
        existingUser()
        progresses.save(Progress("yan", chapterBoss, completed = true))

        val view = service.get("yan")

        assertEquals(ProgressPosition(2, 1, Encounter.PHASE, 1), view.progress.position)
        assertEquals(ChapterDefinition.of(2), view.chapter)
        assertEquals(false, progresses.progresses.getValue("yan").completed)
    }

    @Test
    fun `the progress of the last chapter stays completed`() {
        existingUser()
        val last = Progress("yan", ProgressPosition(5, 10, Encounter.CHAPTER_BOSS, 1), completed = true)
        progresses.save(last)

        assertEquals(last, service.get("yan").progress)
    }

    @Test
    fun `the first chapter boss win drops the next chapter hero without a roll and records the win`() {
        playerAt(chapterBoss)
        chance = SequenceChanceRoller(0.99)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals("lyra", result.drop?.heroId)
        assertEquals(1, blankCopies("lyra"))
        assertEquals("kael", playerCards.cards.getValue("yan").leaderId)
        assertEquals(0, chance.reads)
        val bosses = playerCards.cards.getValue("yan").bosses
        assertTrue(bosses.hasWon(1))
        assertEquals(9, bosses.winsLeft(today, 10))
    }

    @Test
    fun `a later chapter boss win rolls thirty percent for the next chapter hero`() {
        playerAt(chapterBoss, bosses = BossRecord(clearedChapters = setOf(1)))
        chance = SequenceChanceRoller(0.2999)

        assertEquals("lyra", service.report("yan", chapterBoss, Outcome.CLEARED).drop?.heroId)
        assertEquals(1, chance.reads)
    }

    @Test
    fun `a later chapter boss win with a roll of thirty percent or more drops nothing but still counts`() {
        playerAt(chapterBoss, bosses = BossRecord(clearedChapters = setOf(1)))
        chance = SequenceChanceRoller(0.30)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertNull(result.drop)
        assertEquals(
            9,
            playerCards.cards
                .getValue("yan")
                .bosses
                .winsLeft(today, 10),
        )
    }

    @Test
    fun `a phase win and a failed boss drop nothing and make no roll`() {
        playerAt(miniboss)
        service.report("yan", miniboss, Outcome.FAILED)
        progresses.save(Progress("yan", start))
        service.report("yan", start, Outcome.CLEARED)

        assertEquals(0, chance.reads)
        assertEquals(1, blankCopies("kael"))
    }

    @Test
    fun `a rejected report makes no roll and adds no card`() {
        playerAt(miniboss)
        chance = SequenceChanceRoller(0.0)

        assertFailsWith<ProgressConflictException> { service.report("yan", start, Outcome.CLEARED) }

        assertEquals(0, chance.reads)
        assertEquals(1, blankCopies("kael"))
    }

    @Test
    fun `a failure storing the cards propagates so the transaction rolls the progress back`() {
        playerAt(miniboss)
        chance = SequenceChanceRoller(0.0)
        val failing =
            object : PlayerCardsRepositoryPort by playerCards {
                override fun save(cards: PlayerCards): PlayerCards = error("cards store is down")
            }
        val broken =
            ProgressService(
                progresses,
                chapters,
                users,
                failing,
                CardRewards(heroes, chance, rates, clock),
                equipmentRewards(),
                talents,
                TalentRules(),
            )

        assertFailsWith<IllegalStateException> { broken.report("yan", miniboss, Outcome.CLEARED) }
    }

    @Test
    fun `a player without cards still has the report accepted and gets no drop`() {
        existingUser()
        progresses.save(Progress("yan", miniboss))
        chance = SequenceChanceRoller(0.0)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        assertNull(result.drop)
        assertEquals(ProgressPosition(1, 2, Encounter.PHASE, 1), result.view.progress.position)
    }

    @Test
    fun `a cleared miniboss whose equipment roll passes returns the piece and stores it`() {
        playerAt(miniboss)
        equipmentChance = SequenceChanceRoller(0.2, 0.0)

        val result = service.report("yan", miniboss, Outcome.CLEARED)

        val drop = result.equipmentDrop!!
        assertEquals(false, drop.sold)
        assertEquals(listOf(drop.piece), equipment.findAll("yan"))
    }

    @Test
    fun `a cleared miniboss whose equipment roll fails returns no piece`() {
        playerAt(miniboss)
        equipmentChance = SequenceChanceRoller(0.25)

        assertNull(service.report("yan", miniboss, Outcome.CLEARED).equipmentDrop)
        assertTrue(equipment.pieces.isEmpty())
    }

    @Test
    fun `a cleared chapter boss always returns a piece`() {
        playerAt(chapterBoss)
        equipmentChance = SequenceChanceRoller(0.99)

        val result = service.report("yan", chapterBoss, Outcome.CLEARED)

        assertEquals(1, equipment.findAll("yan").size)
        assertEquals(equipment.findAll("yan").single(), result.equipmentDrop?.piece)
    }

    @Test
    fun `a phase win a failed boss and a rejected report drop no equipment`() {
        playerAt(miniboss)
        equipmentChance = SequenceChanceRoller(0.0)
        service.report("yan", miniboss, Outcome.FAILED)
        progresses.save(Progress("yan", start))
        assertNull(service.report("yan", start, Outcome.CLEARED).equipmentDrop)
        playerAt(miniboss)
        assertFailsWith<ProgressConflictException> { service.report("yan", start, Outcome.CLEARED) }

        assertEquals(0, equipmentChance.reads)
        assertTrue(equipment.pieces.isEmpty())
    }

    @Test
    fun `a player without cards gets no equipment either`() {
        existingUser()
        progresses.save(Progress("yan", miniboss))
        equipmentChance = SequenceChanceRoller(0.0)

        assertNull(service.report("yan", miniboss, Outcome.CLEARED).equipmentDrop)
        assertTrue(equipment.pieces.isEmpty())
    }

    @Test
    fun `a failure storing the piece propagates so the transaction rolls the progress back`() {
        playerAt(chapterBoss)
        val failing =
            object : EquipmentRepositoryPort by equipment {
                override fun save(piece: br.com.woodriver.infinity_grove_ws.domain.Piece) = error("equipment store is down")
            }
        val broken =
            ProgressService(
                progresses,
                chapters,
                users,
                playerCards,
                CardRewards(heroes, chance, rates, clock),
                equipmentRewards(failing),
                talents,
                TalentRules(),
            )

        assertFailsWith<IllegalStateException> { broken.report("yan", chapterBoss, Outcome.CLEARED) }
    }
}
