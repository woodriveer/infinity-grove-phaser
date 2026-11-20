package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class GiftTest {
    @Test
    fun `November 20 is the gift day in 2026 and in 2027`() {
        assertTrue(GiftDay.isGiftDay(LocalDate.of(2026, 11, 20)))
        assertTrue(GiftDay.isGiftDay(LocalDate.of(2027, 11, 20)))
    }

    @Test
    fun `November 19 and November 21 are not the gift day`() {
        assertFalse(GiftDay.isGiftDay(LocalDate.of(2026, 11, 19)))
        assertFalse(GiftDay.isGiftDay(LocalDate.of(2026, 11, 21)))
    }

    @Test
    fun `the 20th of October and of December is not the gift day`() {
        assertFalse(GiftDay.isGiftDay(LocalDate.of(2026, 10, 20)))
        assertFalse(GiftDay.isGiftDay(LocalDate.of(2026, 12, 20)))
    }

    @Test
    fun `a claim with a piece is granted and a claim without one is not`() {
        val ring = Piece("r1", "yan", Slot.RING, Rarity.COMMON, null, 0, emptyList())

        assertTrue(GiftClaim(ring).granted)
        assertFalse(GiftClaim(null).granted)
    }

    @Test
    fun `the staff gift id is the name of the staff special`() {
        assertEquals(PieceSpecial.BLACK_AWARENESS_STAFF.name, GiftDay.STAFF_GIFT_ID)
    }
}
