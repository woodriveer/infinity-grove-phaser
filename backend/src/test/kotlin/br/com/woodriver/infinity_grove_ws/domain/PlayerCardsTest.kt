package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PlayerCardsTest {
    private val heroes = HeroSeed.heroes()

    private fun started(element: Element = Element.FIRE) = PlayerCards.start("yan", element, heroes)

    /** The starting hero Kael with [count] blank cards in total. */
    private fun withBlank(count: Int) = (2..count).fold(started()) { acc, _ -> acc.add("kael") }

    /** Kael holding [count] cards of [stars] stars and nothing else. */
    private fun holding(
        stars: Int,
        count: Int,
    ) = PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", stars) to count))

    @Test
    fun `a new player holds one blank card of the starting hero, who is the leader`() {
        assertEquals("kael", started(Element.FIRE).leaderId)
        assertEquals("orina", started(Element.WATER).leaderId)
        assertEquals("lyra", started(Element.NATURE).leaderId)

        val cards = started(Element.WATER)

        assertEquals(1, cards.copiesOf("orina", 0))
        assertTrue(cards.owned("orina"))
        assertEquals(0, cards.starsOf("orina"))
        assertEquals(Element.WATER, cards.startingElement)
    }

    @Test
    fun `light and darkness cannot start`() {
        assertFailsWith<InvalidStartingElementException> { started(Element.LIGHT) }
        assertFailsWith<InvalidStartingElementException> { started(Element.DARKNESS) }
    }

    @Test
    fun `a hero never seen is not owned and has no stars`() {
        val cards = started()

        assertFalse(cards.owned("lyra"))
        assertEquals(0, cards.starsOf("lyra"))
        assertEquals(0, cards.copiesOf("lyra", 0))
    }

    @Test
    fun `adding a card makes a blank copy and owns the hero`() {
        val cards = started().add("lyra").add("lyra")

        assertEquals(2, cards.copiesOf("lyra", 0))
        assertTrue(cards.owned("lyra"))
        assertEquals(0, cards.starsOf("lyra"))
    }

    @Test
    fun `fusing three blank cards leaves one card of one star`() {
        val fused = withBlank(3).fuse("kael", 0)

        assertEquals(0, fused.copiesOf("kael", 0))
        assertEquals(1, fused.copiesOf("kael", 1))
        assertEquals(1, fused.starsOf("kael"))
    }

    @Test
    fun `fusing with four blank cards leaves one blank and one one-star card`() {
        val fused = withBlank(4).fuse("kael", 0)

        assertEquals(1, fused.copiesOf("kael", 0))
        assertEquals(1, fused.copiesOf("kael", 1))
    }

    @Test
    fun `a fusion leaves every other card untouched`() {
        val cards = withBlank(3).add("lyra").fuse("kael", 0)

        assertEquals(mapOf(CopyKey("lyra", 0) to 1, CopyKey("kael", 1) to 1), cards.copies)
    }

    @Test
    fun `three one-star cards fuse into a two-star card`() {
        val fused = holding(stars = 1, count = 3).fuse("kael", 1)

        assertEquals(mapOf(CopyKey("kael", 2) to 1), fused.copies)
        assertEquals(2, fused.starsOf("kael"))
    }

    @Test
    fun `three two-star cards fuse into a three-star card`() {
        val fused = holding(stars = 2, count = 3).fuse("kael", 2)

        assertEquals(mapOf(CopyKey("kael", 3) to 1), fused.copies)
        assertEquals(3, fused.starsOf("kael"))
    }

    @Test
    fun `a three-star card cannot be fused`() {
        assertFailsWith<InvalidFusionException> { holding(stars = 3, count = 5).fuse("kael", 3) }
    }

    @Test
    fun `stars outside 0 to 2 are an invalid fusion`() {
        assertFailsWith<InvalidFusionException> { withBlank(3).fuse("kael", -1) }
        assertFailsWith<InvalidFusionException> { withBlank(3).fuse("kael", 4) }
    }

    @Test
    fun `fewer than three copies is not enough`() {
        assertFailsWith<NotEnoughCardsException> { started().fuse("kael", 0) }
        assertFailsWith<NotEnoughCardsException> { withBlank(2).fuse("kael", 0) }
        assertFailsWith<NotEnoughCardsException> { withBlank(3).fuse("lyra", 0) }
    }

    @Test
    fun `the stars of a hero are the highest among its cards`() {
        val cards = withBlank(4).fuse("kael", 0)

        assertEquals(1, cards.starsOf("kael"))
        assertEquals(1, cards.copiesOf("kael", 0))
    }

    @Test
    fun `the leader can be any owned hero`() {
        val cards = started().add("lyra").withLeader("lyra")

        assertEquals("lyra", cards.leaderId)
    }

    @Test
    fun `a hero that is not owned cannot lead`() {
        assertFailsWith<HeroNotOwnedException> { started().withLeader("lyra") }
    }

    @Test
    fun `the boss record is replaced as a whole`() {
        val bosses = BossRecord().afterChapterBossWin(1, LocalDate.of(2026, 10, 18))

        assertEquals(bosses, started().withBosses(bosses).bosses)
    }

    @Test
    fun `counts below one and stars above nine are rejected`() {
        assertFailsWith<IllegalArgumentException> { PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 0) to 0)) }
        assertFailsWith<IllegalArgumentException> { PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 10) to 1)) }
    }

    @Test
    fun `cards of 4 to 9 stars are kept and the stars of the hero are the highest`() {
        val cards = PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 3) to 1, CopyKey("kael", 9) to 2))

        assertEquals(9, cards.starsOf("kael"))
        assertEquals(2, cards.copiesOf("kael", 9))
    }

    @Test
    fun `a card of 10 stars or of negative stars is rejected`() {
        assertFailsWith<IllegalArgumentException> { PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 10) to 1)) }
        assertFailsWith<IllegalArgumentException> { PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", -1) to 1)) }
    }

    @Test
    fun `a four-star card cannot be fused yet`() {
        assertFailsWith<InvalidFusionException> { holding(stars = 4, count = 3).fuse("kael", 4) }
    }
}
