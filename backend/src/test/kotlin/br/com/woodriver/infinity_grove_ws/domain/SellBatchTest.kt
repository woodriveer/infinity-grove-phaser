package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class SellBatchTest {
    @Test
    fun `a batch keeps 1 to 100 distinct ids in the order given`() {
        assertEquals(listOf("b", "a"), SellBatch(listOf("b", "a")).pieceIds)
        assertEquals(100, SellBatch((1..100).map { "p$it" }).pieceIds.size)
        assertEquals(listOf("x"), SellBatch(listOf("x")).pieceIds)
    }

    @Test
    fun `an empty batch is refused with INVALID_SELL_BATCH`() {
        val e = assertFailsWith<InvalidSellBatchException> { SellBatch(emptyList()) }

        assertEquals("INVALID_SELL_BATCH", e.code)
    }

    @Test
    fun `a batch of 101 ids is refused`() {
        assertFailsWith<InvalidSellBatchException> { SellBatch((1..101).map { "p$it" }) }
    }

    @Test
    fun `a batch that lists a piece twice is refused`() {
        assertFailsWith<InvalidSellBatchException> { SellBatch(listOf("a", "b", "a")) }
    }
}
