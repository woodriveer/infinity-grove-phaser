package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.BossNotAvailableException
import br.com.woodriver.infinity_grove_ws.domain.DailyLimitReachedException
import br.com.woodriver.infinity_grove_ws.domain.EquipmentNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.FarmTooFastException
import br.com.woodriver.infinity_grove_ws.domain.HeroNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.InvalidAffixException
import br.com.woodriver.infinity_grove_ws.domain.InvalidFusionException
import br.com.woodriver.infinity_grove_ws.domain.InvalidStartingElementException
import br.com.woodriver.infinity_grove_ws.domain.MaxRefineException
import br.com.woodriver.infinity_grove_ws.domain.NoAffixLeftException
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCardsException
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCopperException
import br.com.woodriver.infinity_grove_ws.domain.RefineTooLowException
import kotlin.test.Test
import kotlin.test.assertEquals

class ApiExceptionHandlerTest {
    private val handler = ApiExceptionHandler()

    @Test
    fun `a request error is a 400 with its code`() {
        val problem = handler.heroRequest(InvalidStartingElementException("LIGHT"))

        assertEquals(400, problem.status)
        assertEquals("INVALID_STARTING_ELEMENT", problem.properties?.get("code"))
        assertEquals("INVALID_FUSION", handler.heroRequest(InvalidFusionException("stars 3")).properties?.get("code"))
    }

    @Test
    fun `an unknown hero is a 404 with its code`() {
        val problem = handler.heroNotFound(HeroNotFoundException("ghost"))

        assertEquals(404, problem.status)
        assertEquals("HERO_NOT_FOUND", problem.properties?.get("code"))
    }

    @Test
    fun `a state conflict is a 409 with its code`() {
        val conflicts =
            listOf(
                handler.heroConflict(NotEnoughCardsException("kael", 0)) to "NOT_ENOUGH_CARDS",
                handler.heroConflict(HeroNotOwnedException("kael")) to "HERO_NOT_OWNED",
                handler.heroConflict(DailyLimitReachedException(10)) to "DAILY_LIMIT_REACHED",
                handler.heroConflict(BossNotAvailableException("MINIBOSS 3")) to "BOSS_NOT_AVAILABLE",
                handler.heroConflict(FarmTooFastException(5000)) to "FARM_TOO_FAST",
            )

        conflicts.forEach { (problem, code) ->
            assertEquals(409, problem.status)
            assertEquals(code, problem.properties?.get("code"))
        }
    }

    @Test
    fun `a bad affix index is a 400 with its code`() {
        val problem = handler.equipmentRequest(InvalidAffixException(3, 2))

        assertEquals(400, problem.status)
        assertEquals("INVALID_AFFIX", problem.properties?.get("code"))
    }

    @Test
    fun `a missing piece is a 404 with its code`() {
        val problem = handler.equipmentNotFound(EquipmentNotFoundException("p1"))

        assertEquals(404, problem.status)
        assertEquals("EQUIPMENT_NOT_FOUND", problem.properties?.get("code"))
    }

    @Test
    fun `an equipment state conflict is a 409 with its code`() {
        val conflicts =
            listOf(
                handler.equipmentConflict(NotEnoughCopperException(500)) to "NOT_ENOUGH_COPPER",
                handler.equipmentConflict(MaxRefineException()) to "MAX_REFINE",
                handler.equipmentConflict(RefineTooLowException(5)) to "REFINE_TOO_LOW",
                handler.equipmentConflict(NoAffixLeftException()) to "NO_AFFIX_LEFT",
            )

        conflicts.forEach { (problem, code) ->
            assertEquals(409, problem.status)
            assertEquals(code, problem.properties?.get("code"))
        }
    }
}
