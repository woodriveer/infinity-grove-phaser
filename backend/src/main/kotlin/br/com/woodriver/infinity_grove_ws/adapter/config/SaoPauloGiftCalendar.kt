package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.port.GiftCalendarPort
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

/** The gift calendar on the application [Clock]: the instant seen in America/Sao_Paulo (UTC-3, no daylight saving since 2019). */
@Component
class SaoPauloGiftCalendar(
    private val clock: Clock,
) : GiftCalendarPort {
    override fun today(): LocalDate = clock.instant().atZone(ZONE).toLocalDate()

    companion object {
        val ZONE: ZoneId = ZoneId.of("America/Sao_Paulo")
    }
}
