package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class EnemyStatsTest {
    private fun stats(
        defense: Int = 0,
        crit: Int = 0,
    ) = EnemyStats(Element.WATER, defense, crit)

    @Test
    fun `accepts the ends of the ranges`() {
        assertEquals(90, stats(defense = 90, crit = 100).defense)
        assertEquals(0, stats(defense = 0).defense)
        assertEquals(0, stats().critResistance)
    }

    @Test
    fun `rejects a defense above 90`() {
        assertFailsWith<IllegalArgumentException> { stats(defense = 91) }
    }

    @Test
    fun `rejects a negative defense`() {
        assertFailsWith<IllegalArgumentException> { stats(defense = -1) }
    }

    @Test
    fun `rejects a critical resistance outside 0 to 100`() {
        assertFailsWith<IllegalArgumentException> { stats(crit = 101) }
        assertFailsWith<IllegalArgumentException> { stats(crit = -1) }
    }

    @Test
    fun `the default is fire with no defense and no resistance`() {
        assertEquals(EnemyStats(Element.FIRE, 0, 0), EnemyStats.DEFAULT)
    }

    @Test
    fun `the seeded stage elements take turns from fire to darkness`() {
        val elements = ChapterDefinition.first().stages.map { it.monster.element }

        assertEquals(
            List(2) { listOf(Element.FIRE, Element.WATER, Element.NATURE, Element.LIGHT, Element.DARKNESS) }.flatten(),
            elements,
        )
    }

    @Test
    fun `the seeded miniboss shares the element of its stage and gets 10 plus the stage as defense`() {
        val stages = ChapterDefinition.first().stages

        assertEquals(stages.map { it.monster.element }, stages.map { it.miniboss.element })
        assertEquals((11..20).toList(), stages.map { it.miniboss.defense })
        assertEquals((12..30 step 2).toList(), stages.map { it.miniboss.critResistance })
    }

    @Test
    fun `the seeded phase monsters have no defense and no resistance`() {
        ChapterDefinition.first().stages.forEach {
            assertEquals(Pair(0, 0), Pair(it.monster.defense, it.monster.critResistance))
        }
    }

    @Test
    fun `the seeded chapter boss is darkness with defense 30 and resistance 30`() {
        assertEquals(EnemyStats(Element.DARKNESS, 30, 30), ChapterDefinition.first().boss)
    }
}
