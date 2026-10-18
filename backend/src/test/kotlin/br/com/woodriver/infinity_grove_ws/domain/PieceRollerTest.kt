package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PieceRollerTest {
    private val rules = EquipmentRules()

    /** Returns the scripted numbers in order and 0.0 once they run out; `reads` counts how many were taken. */
    private class Script(
        vararg values: Double,
    ) : () -> Double {
        private val queue = values.toMutableList()
        var reads = 0

        override fun invoke(): Double {
            reads++
            return if (queue.isEmpty()) 0.0 else queue.removeAt(0)
        }
    }

    private fun roll(
        encounter: Encounter,
        vararg values: Double,
    ): Piece? = PieceRoller.roll(encounter, rules, "yan", "p1", Script(*values))

    @Test
    fun `a phase never drops and reads no number`() {
        val script = Script(0.0)

        assertNull(PieceRoller.roll(Encounter.PHASE, rules, "yan", "p1", script))
        assertEquals(0, script.reads)
    }

    @Test
    fun `a miniboss drops below 25 percent and not at 25 percent`() {
        assertNotNull(roll(Encounter.MINIBOSS, 0.2499))
        assertNull(roll(Encounter.MINIBOSS, 0.25))
        assertNull(roll(Encounter.MINIBOSS, 0.9))
    }

    @Test
    fun `a chapter boss always drops`() {
        assertNotNull(roll(Encounter.CHAPTER_BOSS, 0.0))
        assertNotNull(roll(Encounter.CHAPTER_BOSS, 0.999999))
    }

    @Test
    fun `the miniboss rarity follows the 60 30 10 weights at their boundaries`() {
        fun rarity(point: Double) = roll(Encounter.MINIBOSS, 0.0, point)!!.rarity

        assertEquals(Rarity.COMMON, rarity(0.0))
        assertEquals(Rarity.COMMON, rarity(0.599))
        assertEquals(Rarity.UNCOMMON, rarity(0.6))
        assertEquals(Rarity.UNCOMMON, rarity(0.899))
        assertEquals(Rarity.RARE, rarity(0.9))
        assertEquals(Rarity.RARE, rarity(0.999))
    }

    @Test
    fun `the chapter boss rarity follows the 40 40 15 5 weights at their boundaries`() {
        fun rarity(point: Double) = roll(Encounter.CHAPTER_BOSS, 0.0, point)!!.rarity

        assertEquals(Rarity.UNCOMMON, rarity(0.0))
        assertEquals(Rarity.UNCOMMON, rarity(0.399))
        assertEquals(Rarity.RARE, rarity(0.4))
        assertEquals(Rarity.RARE, rarity(0.799))
        assertEquals(Rarity.EPIC, rarity(0.8))
        assertEquals(Rarity.EPIC, rarity(0.949))
        assertEquals(Rarity.LEGENDARY, rarity(0.95))
        assertEquals(Rarity.LEGENDARY, rarity(0.999))
    }

    @Test
    fun `the slot is uniform among the four`() {
        fun slot(point: Double) = roll(Encounter.MINIBOSS, 0.0, 0.0, point)!!.slot

        assertEquals(Slot.WEAPON, slot(0.0))
        assertEquals(Slot.WEAPON, slot(0.249))
        assertEquals(Slot.ARMOR, slot(0.25))
        assertEquals(Slot.RING, slot(0.5))
        assertEquals(Slot.AMULET, slot(0.75))
        assertEquals(Slot.AMULET, slot(0.999))
    }

    @Test
    fun `a weapon gets base click damage from 2 to 5 and no click damage percent`() {
        val low = roll(Encounter.MINIBOSS, 0.0, 0.0, 0.0, 0.0)!!
        val high = roll(Encounter.MINIBOSS, 0.0, 0.0, 0.0, 0.999)!!

        assertEquals(Slot.WEAPON, low.slot)
        assertEquals(2, low.baseClick)
        assertEquals(5, high.baseClick)
        assertEquals(listOf(AffixType.CRIT_CHANCE), low.affixes.map { it.type })
    }

    @Test
    fun `the weapon click damage is scaled by the rarity multiplier and rounded down`() {
        val legendary = roll(Encounter.CHAPTER_BOSS, 0.0, 0.99, 0.0, 0.999)!!
        val rare = roll(Encounter.CHAPTER_BOSS, 0.0, 0.4, 0.0, 0.5)!!

        assertEquals(Rarity.LEGENDARY, legendary.rarity)
        assertEquals(11, legendary.baseClick)
        assertEquals(Rarity.RARE, rare.rarity)
        assertEquals(6, rare.baseClick)
    }

    @Test
    fun `a piece that is not a weapon has no base click damage and may roll click damage percent`() {
        val ring = roll(Encounter.MINIBOSS, 0.0, 0.0, 0.5, 0.0, 0.0)!!

        assertEquals(Slot.RING, ring.slot)
        assertNull(ring.baseClick)
        assertEquals(listOf(Affix(AffixType.CLICK_DAMAGE_PCT, 5)), ring.affixes)
    }

    @Test
    fun `an affix value is drawn between its bounds then scaled and rounded down`() {
        val low = roll(Encounter.MINIBOSS, 0.0, 0.0, 0.5, 0.0, 0.0)!!
        val high = roll(Encounter.MINIBOSS, 0.0, 0.0, 0.5, 0.0, 0.999)!!
        val scaled = roll(Encounter.CHAPTER_BOSS, 0.0, 0.99, 0.5, 0.0, 0.999)!!

        assertEquals(5, low.affixes.single().base)
        assertEquals(15, high.affixes.single().base)
        assertEquals(33, scaled.affixes.first().base)
    }

    @Test
    fun `every rarity rolls as many distinct affix types as it allows`() {
        val uncommon = roll(Encounter.CHAPTER_BOSS, 0.0, 0.0, 0.5)!!
        val rare = roll(Encounter.CHAPTER_BOSS, 0.0, 0.4, 0.5)!!
        val epic = roll(Encounter.CHAPTER_BOSS, 0.0, 0.8, 0.5)!!
        val legendary = roll(Encounter.CHAPTER_BOSS, 0.0, 0.99, 0.5)!!

        assertEquals(listOf(2, 3, 4, 4), listOf(uncommon, rare, epic, legendary).map { it.affixes.size })
        listOf(uncommon, rare, epic, legendary).forEach { piece ->
            assertEquals(
                piece.affixes.size,
                piece.affixes
                    .map { it.type }
                    .toSet()
                    .size,
            )
        }
    }

    @Test
    fun `a legendary weapon rolls four affixes and never click damage percent`() {
        val legendary = roll(Encounter.CHAPTER_BOSS, 0.0, 0.99, 0.0)!!

        assertEquals(Slot.WEAPON, legendary.slot)
        assertTrue(legendary.affixes.none { it.type == AffixType.CLICK_DAMAGE_PCT })
        assertEquals(4, legendary.affixes.size)
    }

    @Test
    fun `a rolled piece starts unrefined and in the bag with the given id`() {
        val piece = roll(Encounter.CHAPTER_BOSS, 0.0)!!

        assertEquals(0, piece.refine)
        assertNull(piece.heroId)
        assertEquals("p1", piece.id)
        assertEquals("yan", piece.username)
    }

    @Test
    fun `a custom rate is read from the rules`() {
        val never = EquipmentRules(minibossRate = 0.0, chapterBossRate = 0.0)

        assertNull(PieceRoller.roll(Encounter.MINIBOSS, never, "yan", "p", Script(0.0)))
        assertNull(PieceRoller.roll(Encounter.CHAPTER_BOSS, never, "yan", "p", Script(0.0)))
    }
}
