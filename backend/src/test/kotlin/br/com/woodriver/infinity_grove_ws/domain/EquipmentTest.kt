package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class EquipmentTest {
    private val rules = EquipmentRules()

    private fun weapon(
        rarity: Rarity = Rarity.COMMON,
        baseClick: Int = 3,
        refine: Int = 0,
        affixes: List<Affix> = listOf(Affix(AffixType.CRIT_CHANCE, 2)),
    ) = Piece("p1", "yan", Slot.WEAPON, rarity, baseClick, refine, affixes)

    private fun ring(
        rarity: Rarity = Rarity.COMMON,
        refine: Int = 0,
        affixes: List<Affix> = listOf(Affix(AffixType.CLICK_DAMAGE_PCT, 10)),
    ) = Piece("p2", "yan", Slot.RING, rarity, null, refine, affixes)

    @Test
    fun `rarities hold 1 2 3 4 and 4 affixes with the spec multipliers`() {
        assertEquals(listOf(1, 2, 3, 4, 4), Rarity.entries.map { it.affixCount })
        assertEquals(listOf(1.0, 1.2, 1.5, 1.8, 2.2), Rarity.entries.map { it.valueMultiplier })
        assertEquals(listOf(1, 2, 3, 5, 8), Rarity.entries.map { it.costMultiplier })
        assertEquals(listOf(1, 2, 3, 4, 5), Rarity.entries.map { it.index })
    }

    @Test
    fun `click damage percent is allowed on every slot but the weapon`() {
        assertEquals(5, AffixType.allowedOn(Slot.WEAPON).size)
        assertEquals(false, AffixType.CLICK_DAMAGE_PCT in AffixType.allowedOn(Slot.WEAPON))
        listOf(Slot.ARMOR, Slot.RING, Slot.AMULET).forEach { assertEquals(AffixType.entries, AffixType.allowedOn(it)) }
    }

    @Test
    fun `an affix value is the base times one plus a tenth per refine level rounded down`() {
        assertEquals(20, weapon(refine = 10).value(Affix(AffixType.CRIT_CHANCE, 10)))
        assertEquals(7, weapon(refine = 1).value(Affix(AffixType.CRIT_CHANCE, 7)))
        assertEquals(13, weapon(refine = 3).value(Affix(AffixType.CRIT_CHANCE, 10)))
        assertEquals(10, weapon(refine = 0).value(Affix(AffixType.CRIT_CHANCE, 10)))
    }

    @Test
    fun `a weapon click damage grows by a tenth of its base per level with one decimal`() {
        assertEquals(3.0, weapon(baseClick = 3, refine = 0).clickDamage())
        assertEquals(3.3, weapon(baseClick = 3, refine = 1).clickDamage())
        assertEquals(2.2, weapon(baseClick = 2, refine = 1).clickDamage())
        assertEquals(6.0, weapon(baseClick = 3, refine = 10).clickDamage())
    }

    @Test
    fun `a piece that is not a weapon has no click damage`() {
        assertNull(ring().clickDamage())
    }

    @Test
    fun `the refine cost is the floor of 500 times 1_7 to the level times the rarity multiplier`() {
        assertEquals(500L, weapon(refine = 0).refineCost(rules))
        assertEquals(850L, weapon(refine = 1).refineCost(rules))
        assertEquals(1445L, weapon(refine = 2).refineCost(rules))
        assertEquals(2456L, weapon(refine = 3).refineCost(rules))
        assertEquals(59293L, weapon(refine = 9).refineCost(rules))
        assertEquals(4000L, weapon(Rarity.LEGENDARY, refine = 0, affixes = emptyList()).refineCost(rules))
        assertEquals(1000L, weapon(Rarity.UNCOMMON, refine = 0, affixes = emptyList()).refineCost(rules))
    }

    @Test
    fun `a piece at the maximum level has no refine cost`() {
        assertNull(weapon(refine = 10).refineCost(rules))
    }

    @Test
    fun `the reroll cost applies from level 5`() {
        assertNull(weapon(refine = 4).rerollCost(rules))
        assertEquals(5000L, weapon(refine = 5).rerollCost(rules))
        assertEquals(5000L, weapon(refine = 10).rerollCost(rules))
    }

    @Test
    fun `the sell price is 100 times the rarity index times one plus half a level rounded down`() {
        assertEquals(100L, weapon(refine = 0).sellPrice())
        assertEquals(150L, weapon(refine = 1).sellPrice())
        assertEquals(900L, weapon(Rarity.RARE, refine = 4, affixes = emptyList()).sellPrice())
        assertEquals(3000L, weapon(Rarity.LEGENDARY, refine = 10, affixes = emptyList()).sellPrice())
    }

    @Test
    fun `a weapon without base click damage or another slot with one is rejected`() {
        assertFailsWith<IllegalArgumentException> { Piece("p", "yan", Slot.WEAPON, Rarity.COMMON, null, 0, emptyList()) }
        assertFailsWith<IllegalArgumentException> { Piece("p", "yan", Slot.ARMOR, Rarity.COMMON, 3, 0, emptyList()) }
    }

    @Test
    fun `a repeated affix type or click damage percent on a weapon is rejected`() {
        val twice = listOf(Affix(AffixType.CRIT_CHANCE, 2), Affix(AffixType.CRIT_CHANCE, 3))
        assertFailsWith<IllegalArgumentException> { weapon(Rarity.UNCOMMON, affixes = twice) }
        assertFailsWith<IllegalArgumentException> { weapon(affixes = listOf(Affix(AffixType.CLICK_DAMAGE_PCT, 5))) }
    }

    @Test
    fun `more affixes than the rarity allows is rejected`() {
        val two = listOf(Affix(AffixType.CRIT_CHANCE, 2), Affix(AffixType.BOSS_DAMAGE_PCT, 6))
        assertFailsWith<IllegalArgumentException> { weapon(Rarity.COMMON, affixes = two) }
        assertEquals(2, weapon(Rarity.UNCOMMON, affixes = two).affixes.size)
    }

    @Test
    fun `a refine level outside 0 to 10 is rejected`() {
        assertFailsWith<IllegalArgumentException> { weapon(refine = -1) }
        assertFailsWith<IllegalArgumentException> { weapon(refine = 11) }
        assertEquals(10, weapon(refine = 10).refine)
    }

    @Test
    fun `an affix base below one and a blank piece id are rejected`() {
        assertFailsWith<IllegalArgumentException> { Affix(AffixType.CRIT_CHANCE, 0) }
        assertFailsWith<IllegalArgumentException> { Piece(" ", "yan", Slot.RING, Rarity.COMMON, null, 0, emptyList()) }
    }

    @Test
    fun `the rules reject a rate outside 0 to 1 a bag below one and a negative cost`() {
        assertFailsWith<IllegalArgumentException> { EquipmentRules(minibossRate = 1.1) }
        assertFailsWith<IllegalArgumentException> { EquipmentRules(chapterBossRate = -0.1) }
        assertFailsWith<IllegalArgumentException> { EquipmentRules(bagCapacity = 0) }
        assertFailsWith<IllegalArgumentException> { EquipmentRules(refineBaseCost = -1) }
        assertFailsWith<IllegalArgumentException> { EquipmentRules(rerollCost = -1) }
    }

    private val zero: () -> Double = { 0.0 }

    @Test
    fun `refined raises the level by one and keeps everything else`() {
        val piece = weapon(refine = 4)

        assertEquals(5, piece.refined().refine)
        assertEquals(piece.copy(refine = 5), piece.refined())
    }

    @Test
    fun `refined rejects a piece at the maximum level`() {
        assertFailsWith<MaxRefineException> { weapon(refine = 10).refined() }
        assertEquals(10, weapon(refine = 9).refined().refine)
    }

    @Test
    fun `a reroll at level 5 replaces only the chosen affix with a type the piece lacked`() {
        val piece =
            weapon(Rarity.UNCOMMON, refine = 5, affixes = listOf(Affix(AffixType.CRIT_CHANCE, 2), Affix(AffixType.BOSS_DAMAGE_PCT, 6)))

        val rerolled = piece.rerolled(0, zero)

        assertEquals(AffixType.CRIT_DAMAGE_PCT, rerolled.affixes[0].type)
        assertEquals(Affix(AffixType.BOSS_DAMAGE_PCT, 6), rerolled.affixes[1])
        assertEquals(5, rerolled.refine)
        assertEquals(piece.baseClick, rerolled.baseClick)
    }

    @Test
    fun `a reroll rolls the new base inside the range of the new type scaled by the rarity`() {
        val piece = weapon(Rarity.UNCOMMON, refine = 5, affixes = listOf(Affix(AffixType.CRIT_CHANCE, 2)))

        val low = piece.rerolled(0, zero)
        val high = piece.rerolled(0, scripted(0.0, 0.999))

        assertEquals(AffixType.CRIT_DAMAGE_PCT, low.affixes[0].type)
        assertEquals(12, low.affixes[0].base)
        assertEquals(36, high.affixes[0].base)
    }

    @Test
    fun `a reroll on a weapon never lands on click damage percent`() {
        val piece = weapon(Rarity.LEGENDARY, refine = 5, affixes = listOf(Affix(AffixType.CRIT_CHANCE, 2)))

        (0..9).forEach { step ->
            val rerolled = piece.rerolled(0, scripted(step / 10.0, 0.5))
            assertEquals(false, rerolled.affixes[0].type == AffixType.CLICK_DAMAGE_PCT)
        }
    }

    @Test
    fun `a reroll on another slot may land on click damage percent`() {
        val piece = ring(refine = 5, affixes = listOf(Affix(AffixType.CRIT_CHANCE, 2)))

        assertEquals(AffixType.CLICK_DAMAGE_PCT, piece.rerolled(0, zero).affixes[0].type)
    }

    @Test
    fun `a reroll below level 5 is rejected and changes nothing`() {
        assertFailsWith<RefineTooLowException> { weapon(refine = 4).rerolled(0, zero) }
    }

    @Test
    fun `a reroll of an affix the piece does not have is rejected`() {
        assertFailsWith<InvalidAffixException> { weapon(refine = 5).rerolled(1, zero) }
        assertFailsWith<InvalidAffixException> { weapon(refine = 5).rerolled(-1, zero) }
    }

    private fun scripted(vararg values: Double): () -> Double {
        val queue = values.toMutableList()
        return { if (queue.isEmpty()) 0.0 else queue.removeAt(0) }
    }
}
