package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.FixedGiftCalendar
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryGiftRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceChanceRoller
import br.com.woodriver.infinity_grove_ws.SequenceIds
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PieceSpecial
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class GiftServiceTest {
    private val users = InMemoryUserRepository()
    private val playerCards = InMemoryPlayerCardsRepository()
    private val pieces = InMemoryEquipmentRepository()
    private val gifts = InMemoryGiftRepository()
    private val calendar = FixedGiftCalendar(LocalDate.of(2026, 11, 20))
    private val chance = SequenceChanceRoller(0.5)
    private val service = GiftService(gifts, calendar, pieces, playerCards, users, chance, SequenceIds(), MutableClock(1_000L))

    private val staffAffixes =
        listOf(
            Affix(AffixType.BOSS_DAMAGE_PCT, 28),
            Affix(AffixType.BOSS_TIME_SECONDS, 6),
            Affix(AffixType.CRIT_DAMAGE_PCT, 55),
            Affix(AffixType.ARMOR_PIERCE_PCT, 28),
        )

    private val staff =
        Piece("piece-1", "yan", Slot.WEAPON, Rarity.LEGENDARY, 11, 0, staffAffixes, null, PieceSpecial.BLACK_AWARENESS_STAFF)

    private fun player() {
        users.save(User("yan", "hash", 1L, 1L))
        playerCards.save(PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes()))
    }

    @Test
    fun `on November 20 a player without the gift receives the staff in the bag`() {
        player()

        val claim = service.claim("yan")

        assertTrue(claim.granted)
        assertEquals(staff, claim.piece)
        assertEquals(listOf(staff), pieces.findAll("yan"))
        assertEquals(listOf(GiftGrant("yan", "BLACK_AWARENESS_STAFF", "piece-1", 1_000L)), gifts.grants)
    }

    @Test
    fun `a second claim the same day gives nothing and stores nothing`() {
        player()
        service.claim("yan")

        val second = service.claim("yan")

        assertFalse(second.granted)
        assertEquals(1, pieces.findAll("yan").size)
        assertEquals(1, gifts.grants.size)
    }

    @Test
    fun `a claim on the next November 20 after a grant gives nothing`() {
        player()
        service.claim("yan")
        calendar.today = LocalDate.of(2027, 11, 20)

        assertFalse(service.claim("yan").granted)
        assertEquals(1, pieces.findAll("yan").size)
    }

    @Test
    fun `a claim on November 19 gives nothing, stores nothing and reads no chance`() {
        player()
        calendar.today = LocalDate.of(2026, 11, 19)

        assertFalse(service.claim("yan").granted)
        assertTrue(pieces.findAll("yan").isEmpty())
        assertTrue(gifts.grants.isEmpty())
        assertEquals(0, chance.reads)
    }

    @Test
    fun `a claim on November 21 gives nothing`() {
        player()
        calendar.today = LocalDate.of(2026, 11, 21)

        assertFalse(service.claim("yan").granted)
    }

    @Test
    fun `a full bag still receives the staff and nothing is sold`() {
        player()
        repeat(100) { pieces.save(Piece("r$it", "yan", Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CRIT_CHANCE, 2)))) }

        val claim = service.claim("yan")

        assertTrue(claim.granted)
        val stored = pieces.findAll("yan")
        assertEquals(101, stored.size)
        assertTrue(stored.any { it.special == PieceSpecial.BLACK_AWARENESS_STAFF })
    }

    @Test
    fun `a player who sold the staff does not receive another`() {
        player()
        gifts.save(GiftGrant("yan", "BLACK_AWARENESS_STAFF", "sold-piece", 500L))

        assertFalse(service.claim("yan").granted)
        assertTrue(pieces.findAll("yan").isEmpty())
    }

    @Test
    fun `an unknown user is rejected`() {
        assertFailsWith<UserNotFoundException> { service.claim("ghost") }
    }

    @Test
    fun `a user without a cards row is rejected on the gift day`() {
        users.save(User("yan", "hash", 1L, 1L))

        assertFailsWith<PlayerCardsMissingException> { service.claim("yan") }
    }
}
