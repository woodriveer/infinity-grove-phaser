package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.MutableClock
import java.time.Instant
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class SaoPauloGiftCalendarTest {
    private fun today(instant: String) = SaoPauloGiftCalendar(MutableClock(Instant.parse(instant).toEpochMilli())).today()

    @Test
    fun `midnight of November 20 in Sao Paulo is 03_00 UTC`() {
        assertEquals(LocalDate.of(2026, 11, 20), today("2026-11-20T03:00:00Z"))
    }

    @Test
    fun `one second before is still November 19 in Sao Paulo`() {
        assertEquals(LocalDate.of(2026, 11, 19), today("2026-11-20T02:59:59Z"))
    }

    @Test
    fun `23_59_59 of November 20 in Sao Paulo is still the 20th`() {
        assertEquals(LocalDate.of(2026, 11, 20), today("2026-11-21T02:59:59Z"))
    }

    @Test
    fun `03_00 UTC of November 21 is November 21 in Sao Paulo`() {
        assertEquals(LocalDate.of(2026, 11, 21), today("2026-11-21T03:00:00Z"))
    }
}
