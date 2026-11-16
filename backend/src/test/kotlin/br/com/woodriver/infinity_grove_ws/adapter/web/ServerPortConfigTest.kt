package br.com.woodriver.infinity_grove_ws.adapter.web

import kotlin.test.Test
import kotlin.test.assertTrue

/** RUN-02: Cloud Run injects PORT and sends requests there; without PORT (compose, bootRun) the backend stays on 8080. */
class ServerPortConfigTest {
    private val yaml =
        ServerPortConfigTest::class.java
            .getResource("/application.yaml")!!
            .readText()
            .replace("\r\n", "\n")

    @Test
    fun `the shipped yaml listens on PORT with 8080 as default`() {
        assertTrue(yaml.contains("server:\n  # Cloud Run sends requests to \$PORT") && yaml.contains("  port: \${PORT:8080}"))
    }
}
