package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class CardConfigTest {
    private val config = CardConfig()

    @Test
    fun `defaults are two percent per stage, thirty percent, ten wins a day and five seconds`() {
        assertEquals(CardDropRates(0.02, 0.30, 10, 5000), config.cardDropRates(CardProperties()))
    }

    @Test
    fun `configured values are used`() {
        val rates =
            config.cardDropRates(
                CardProperties(minibossRatePerStage = 0.5, chapterBossRate = 1.0, chapterBossDailyLimit = 3, farmMinIntervalMs = 0),
            )

        assertEquals(CardDropRates(0.5, 1.0, 3, 0), rates)
    }

    @Test
    fun `a rate outside 0 to 1, a limit below 1 or a negative interval fails startup`() {
        assertFailsWith<IllegalArgumentException> { config.cardDropRates(CardProperties(minibossRatePerStage = 1.5)) }
        assertFailsWith<IllegalArgumentException> { config.cardDropRates(CardProperties(chapterBossRate = -0.1)) }
        assertFailsWith<IllegalArgumentException> { config.cardDropRates(CardProperties(chapterBossDailyLimit = 0)) }
        assertFailsWith<IllegalArgumentException> { config.cardDropRates(CardProperties(farmMinIntervalMs = -1)) }
    }

    @Test
    fun `the random chance is always from 0 inclusive to 1 exclusive`() {
        val roller = config.chanceRoller()

        assertTrue((1..2000).all { roller.roll() in 0.0..<1.0 })
    }
}
