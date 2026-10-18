package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EquipmentNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class EquipmentServiceTest {
    private val users = InMemoryUserRepository()
    private val playerCards = InMemoryPlayerCardsRepository()
    private val pieces = InMemoryEquipmentRepository()
    private val rules = EquipmentRules()
    private val service get() = EquipmentService(pieces, playerCards, users, rules)

    private fun player() {
        users.save(User("yan", "hash", 1L, 1L))
        playerCards.save(PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes()).add("lyra"))
    }

    private fun ring(
        id: String,
        heroId: String? = null,
        username: String = "yan",
    ) = Piece(id, username, Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CRIT_CHANCE, 2)), heroId).also { pieces.save(it) }

    @Test
    fun `list returns every piece of the player with the bag capacity`() {
        player()
        ring("a")
        ring("b", "kael")
        ring("c", username = "other")

        val equipment = service.list("yan")

        assertEquals(listOf("a", "b"), equipment.pieces.map { it.id })
        assertEquals(100, equipment.capacity)
    }

    @Test
    fun `list for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.list("ghost") }
    }

    @Test
    fun `equip puts the piece on an owned hero and stores it`() {
        player()
        ring("a")

        val equipment = service.equip("yan", "a", "kael")

        assertEquals("kael", equipment.find("a").heroId)
        assertEquals("kael", pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip on a taken slot returns the old piece to the bag`() {
        player()
        ring("old", "kael")
        ring("new")

        val equipment = service.equip("yan", "new", "kael")

        assertEquals("kael", pieces.pieces.getValue("new").heroId)
        assertNull(pieces.pieces.getValue("old").heroId)
        assertEquals(2, equipment.pieces.size)
    }

    @Test
    fun `equip moves a piece from the hero wearing it to another`() {
        player()
        ring("a", "kael")

        service.equip("yan", "a", "lyra")

        assertEquals("lyra", pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip on a hero the player does not own is refused and changes nothing`() {
        player()
        ring("a")

        assertFailsWith<HeroNotOwnedException> { service.equip("yan", "a", "vex") }

        assertNull(pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip of a missing piece or of a piece of another account is not found`() {
        player()
        ring("theirs", username = "other")

        assertFailsWith<EquipmentNotFoundException> { service.equip("yan", "ghost", "kael") }
        assertFailsWith<EquipmentNotFoundException> { service.equip("yan", "theirs", "kael") }
        assertNull(pieces.pieces.getValue("theirs").heroId)
    }

    @Test
    fun `unequip empties the slot and keeps the piece`() {
        player()
        ring("a", "kael")

        val equipment = service.unequip("yan", "a")

        assertNull(equipment.find("a").heroId)
        assertNull(pieces.pieces.getValue("a").heroId)
        assertEquals(1, pieces.pieces.size)
    }

    @Test
    fun `unequip of a missing piece or of another account piece is not found`() {
        player()
        ring("theirs", "kael", username = "other")

        assertFailsWith<EquipmentNotFoundException> { service.unequip("yan", "ghost") }
        assertFailsWith<EquipmentNotFoundException> { service.unequip("yan", "theirs") }
        assertEquals("kael", pieces.pieces.getValue("theirs").heroId)
    }

    @Test
    fun `a change for an unknown user or a player without cards fails`() {
        assertFailsWith<UserNotFoundException> { service.equip("ghost", "a", "kael") }
        users.save(User("yan", "hash", 1L, 1L))
        assertFailsWith<PlayerCardsMissingException> { service.equip("yan", "a", "kael") }
        assertFailsWith<PlayerCardsMissingException> { service.unequip("yan", "a") }
    }
}
