package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class CardDropsTest {
    private val rates =
        CardDropRates(minibossRatePerStage = 0.02, chapterBossRate = 0.30, chapterBossDailyLimit = 10, farmMinIntervalMs = 5000)
    private val heroes = HeroSeed.heroes()

    private var reads = 0

    private fun drop(
        encounter: Encounter,
        chance: Double,
        chapter: Int = 1,
        stage: Int = 1,
        start: Element = Element.FIRE,
        first: Boolean = false,
    ) = CardDropper
        .drop(encounter, chapter, stage, start, first, rates, heroes) {
            reads += 1
            chance
        }?.id

    @Test
    fun `the stage 1 miniboss drops the hero of its chapter below two percent`() {
        assertEquals("kael", drop(Encounter.MINIBOSS, 0.0))
        assertEquals("kael", drop(Encounter.MINIBOSS, 0.0199))
    }

    @Test
    fun `the stage 1 miniboss drops nothing from two percent up`() {
        assertNull(drop(Encounter.MINIBOSS, 0.02))
        assertNull(drop(Encounter.MINIBOSS, 0.99))
    }

    @Test
    fun `the miniboss chance grows two percent a stage up to twenty percent on stage 10`() {
        assertEquals("kael", drop(Encounter.MINIBOSS, 0.0599, stage = 3))
        assertNull(drop(Encounter.MINIBOSS, 0.06, stage = 3))
        assertEquals("kael", drop(Encounter.MINIBOSS, 0.1999, stage = 10))
        assertNull(drop(Encounter.MINIBOSS, 0.20, stage = 10))
    }

    @Test
    fun `the miniboss chance restarts with the stage of every chapter`() {
        assertEquals("lyra", drop(Encounter.MINIBOSS, 0.0199, chapter = 2, stage = 1))
        assertNull(drop(Encounter.MINIBOSS, 0.02, chapter = 2, stage = 1))
    }

    @Test
    fun `the miniboss chance never goes above one`() {
        assertEquals(1.0, CardDropRates(0.5, 0.3, 10, 5000).minibossRate(3))
    }

    @Test
    fun `the miniboss hero depends on the starting element and the chapter`() {
        assertEquals("orina", drop(Encounter.MINIBOSS, 0.0, start = Element.WATER))
        assertEquals("lyra", drop(Encounter.MINIBOSS, 0.0, chapter = 2, start = Element.FIRE))
        assertEquals("seraphine", drop(Encounter.MINIBOSS, 0.0, chapter = 5, start = Element.NATURE))
    }

    @Test
    fun `the first chapter boss win drops the next chapter hero with certainty and reads no chance`() {
        assertEquals("lyra", drop(Encounter.CHAPTER_BOSS, 0.99, first = true))
        assertEquals(0, reads)
    }

    @Test
    fun `later chapter boss wins drop the next chapter hero below thirty percent whatever the stage`() {
        assertEquals("lyra", drop(Encounter.CHAPTER_BOSS, 0.0))
        assertEquals("lyra", drop(Encounter.CHAPTER_BOSS, 0.2999, stage = 0))
        assertNull(drop(Encounter.CHAPTER_BOSS, 0.30))
        assertNull(drop(Encounter.CHAPTER_BOSS, 0.99))
    }

    @Test
    fun `the chapter boss releases the hero of the next element of the player order`() {
        assertEquals("orina", drop(Encounter.CHAPTER_BOSS, 0.0, start = Element.NATURE, first = true))
        assertEquals("vex", drop(Encounter.CHAPTER_BOSS, 0.0, chapter = 3, start = Element.FIRE, first = true))
        assertEquals("seraphine", drop(Encounter.CHAPTER_BOSS, 0.0, chapter = 4, first = true))
    }

    @Test
    fun `the last chapter boss drops the hero of chapter five`() {
        assertEquals("seraphine", drop(Encounter.CHAPTER_BOSS, 0.0, chapter = 5, first = true))
        assertEquals("seraphine", drop(Encounter.CHAPTER_BOSS, 0.05, chapter = 5))
        assertNull(drop(Encounter.CHAPTER_BOSS, 0.30, chapter = 5))
    }

    @Test
    fun `a phase never drops and reads no chance`() {
        assertNull(drop(Encounter.PHASE, 0.0))
        assertEquals(0, reads)
    }

    @Test
    fun `rates outside their range are rejected`() {
        assertFailsWith<IllegalArgumentException> { CardDropRates(-0.1, 0.1, 10, 5000) }
        assertFailsWith<IllegalArgumentException> { CardDropRates(0.01, 1.1, 10, 5000) }
        assertFailsWith<IllegalArgumentException> { CardDropRates(0.01, 0.1, 0, 5000) }
        assertFailsWith<IllegalArgumentException> { CardDropRates(0.01, 0.1, 10, -1) }
    }
}
