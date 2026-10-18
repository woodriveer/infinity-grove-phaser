package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class HeroExceptionsTest {
    @Test
    fun `request errors are 400 type exceptions with stable codes`() {
        val startingElement = InvalidStartingElementException("LIGHT")
        val fusion = InvalidFusionException("stars 3")

        assertIs<HeroRequestException>(startingElement)
        assertIs<HeroRequestException>(fusion)
        assertEquals("INVALID_STARTING_ELEMENT", startingElement.code)
        assertEquals("INVALID_FUSION", fusion.code)
    }

    @Test
    fun `an unknown hero carries its own code and is not a request or conflict error`() {
        val e = HeroNotFoundException("ghost")

        assertEquals("HERO_NOT_FOUND", e.code)
        assertEquals(false, e is HeroRequestException || e is HeroConflictException)
    }

    @Test
    fun `state errors are conflict type exceptions with stable codes`() {
        val conflicts =
            listOf(
                NotEnoughCardsException("kael", 0) to "NOT_ENOUGH_CARDS",
                HeroNotOwnedException("kael") to "HERO_NOT_OWNED",
                DailyLimitReachedException(10) to "DAILY_LIMIT_REACHED",
                BossNotAvailableException("MINIBOSS 3") to "BOSS_NOT_AVAILABLE",
                FarmTooFastException(5000) to "FARM_TOO_FAST",
            )

        conflicts.forEach { (exception, code) ->
            assertIs<HeroConflictException>(exception)
            assertEquals(code, exception.code)
        }
    }

    @Test
    fun `a player without cards is a plain business exception`() {
        val e = PlayerCardsMissingException("yan")

        assertEquals("PLAYER_WITHOUT_HEROES", e.code)
        assertEquals(false, e is HeroRequestException || e is HeroConflictException)
    }
}
