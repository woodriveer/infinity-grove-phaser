package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.port.DatabaseHealthPort
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

private class FixedDatabaseHealth(
    private val up: Boolean,
) : DatabaseHealthPort {
    override fun reachable() = up
}

class HealthControllerTest {
    @Test
    fun `health answers 200 UP with the commit when the database answers`() {
        val response = HealthController(FixedDatabaseHealth(true), "abc").health()

        assertEquals(200, response.statusCode.value())
        assertEquals(HealthResponse("UP", "abc"), response.body)
    }

    @Test
    fun `health answers 503 DOWN with the commit when the database does not answer`() {
        val response = HealthController(FixedDatabaseHealth(false), "abc").health()

        assertEquals(503, response.statusCode.value())
        assertEquals(HealthResponse("DOWN", "abc"), response.body)
    }

    @Test
    fun `the shipped yaml reads the commit from APP_COMMIT with unknown as default`() {
        val yaml = HealthControllerTest::class.java.getResource("/application.yaml")!!.readText()

        assertTrue(yaml.contains("commit: \${APP_COMMIT:unknown}"))
    }
}
