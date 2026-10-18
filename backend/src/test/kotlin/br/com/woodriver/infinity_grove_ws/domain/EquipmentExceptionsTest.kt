package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class EquipmentExceptionsTest {
    @Test
    fun `a bad affix index is a request error with its own code`() {
        val e = InvalidAffixException(3, 2)

        assertIs<EquipmentRequestException>(e)
        assertEquals("INVALID_AFFIX", e.code)
    }

    @Test
    fun `a missing piece is a plain business exception with its own code`() {
        val e = EquipmentNotFoundException("p1")

        assertEquals("EQUIPMENT_NOT_FOUND", e.code)
        assertTrue(e.javaClass.superclass == BusinessException::class.java)
    }

    @Test
    fun `state errors are conflict exceptions with stable codes`() {
        val conflicts =
            listOf(
                NotEnoughCopperException(500) to "NOT_ENOUGH_COPPER",
                MaxRefineException() to "MAX_REFINE",
                RefineTooLowException(5) to "REFINE_TOO_LOW",
                NoAffixLeftException() to "NO_AFFIX_LEFT",
            )

        conflicts.forEach { (exception, code) ->
            assertIs<EquipmentConflictException>(exception)
            assertEquals(code, exception.code)
        }
    }
}
