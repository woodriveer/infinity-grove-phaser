package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PlayerEquipmentTest {
    private fun piece(
        id: String,
        slot: Slot = Slot.RING,
        heroId: String? = null,
        username: String = "yan",
    ) = Piece(id, username, slot, Rarity.COMMON, if (slot == Slot.WEAPON) 3 else null, 0, emptyList(), heroId)

    private fun equipment(
        vararg pieces: Piece,
        capacity: Int = 100,
    ) = PlayerEquipment("yan", pieces.toList(), capacity)

    @Test
    fun `add stores a piece while the bag has room`() {
        val updated = equipment(piece("a")).add(piece("b"))

        assertEquals(listOf("a", "b"), updated.pieces.map { it.id })
    }

    @Test
    fun `a bag at capacity is full and refuses another piece`() {
        val full = equipment(piece("a"), piece("b"), capacity = 2)

        assertTrue(full.isFull)
        assertFalse(equipment(piece("a"), capacity = 2).isFull)
        assertFailsWith<IllegalStateException> { full.add(piece("c")) }
        assertEquals(2, full.pieces.size)
    }

    @Test
    fun `equip puts the piece on the hero`() {
        val updated = equipment(piece("a")).equip("a", "kael")

        assertEquals("kael", updated.find("a").heroId)
        assertEquals(listOf("a"), updated.worn("kael").map { it.id })
    }

    @Test
    fun `equip on an occupied slot sends the old piece back to the bag`() {
        val updated = equipment(piece("old", heroId = "kael"), piece("new")).equip("new", "kael")

        assertEquals("kael", updated.find("new").heroId)
        assertNull(updated.find("old").heroId)
        assertEquals(2, updated.pieces.size)
    }

    @Test
    fun `equip keeps the pieces of the other slots of the hero`() {
        val updated = equipment(piece("armor", Slot.ARMOR, "kael"), piece("ring")).equip("ring", "kael")

        assertEquals(setOf("armor", "ring"), updated.worn("kael").map { it.id }.toSet())
    }

    @Test
    fun `equip moves a piece worn by another hero and leaves that slot empty`() {
        val updated = equipment(piece("a", heroId = "kael")).equip("a", "lyra")

        assertEquals("lyra", updated.find("a").heroId)
        assertTrue(updated.worn("kael").isEmpty())
    }

    @Test
    fun `equip does not touch the same slot of another hero`() {
        val updated = equipment(piece("kaelRing", heroId = "kael"), piece("spare")).equip("spare", "lyra")

        assertEquals("kael", updated.find("kaelRing").heroId)
        assertEquals("lyra", updated.find("spare").heroId)
    }

    @Test
    fun `equipping the piece already worn by the hero changes nothing`() {
        val before = equipment(piece("a", heroId = "kael"))

        assertEquals(before, before.equip("a", "kael"))
    }

    @Test
    fun `unequip keeps the piece in the bag`() {
        val updated = equipment(piece("a", heroId = "kael")).unequip("a")

        assertNull(updated.find("a").heroId)
        assertEquals(1, updated.pieces.size)
    }

    @Test
    fun `remove drops a worn piece and leaves the slot empty`() {
        val updated = equipment(piece("a", heroId = "kael"), piece("b")).remove("a")

        assertEquals(listOf("b"), updated.pieces.map { it.id })
        assertTrue(updated.worn("kael").isEmpty())
    }

    @Test
    fun `replace swaps the piece with the same id`() {
        val before = equipment(piece("a"), piece("b"))
        val refined = before.find("a").copy(refine = 1)

        assertEquals(1, before.replace(refined).find("a").refine)
        assertEquals(0, before.replace(refined).find("b").refine)
    }

    @Test
    fun `an unknown piece is not found by any operation`() {
        val equipment = equipment(piece("a"))

        assertFailsWith<EquipmentNotFoundException> { equipment.find("x") }
        assertFailsWith<EquipmentNotFoundException> { equipment.equip("x", "kael") }
        assertFailsWith<EquipmentNotFoundException> { equipment.unequip("x") }
        assertFailsWith<EquipmentNotFoundException> { equipment.remove("x") }
        assertFailsWith<EquipmentNotFoundException> { equipment.replace(piece("x")) }
    }

    @Test
    fun `pieces of another account two pieces of one id or two in one slot are rejected`() {
        assertFailsWith<IllegalArgumentException> { equipment(piece("a", username = "other")) }
        assertFailsWith<IllegalArgumentException> { equipment(piece("a"), piece("a")) }
        assertFailsWith<IllegalArgumentException> { equipment(piece("a", heroId = "kael"), piece("b", heroId = "kael")) }
        assertFailsWith<IllegalArgumentException> { equipment(capacity = 0) }
    }
}
